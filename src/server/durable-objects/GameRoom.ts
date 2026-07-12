import { DurableObject } from "cloudflare:workers";
import { GAME_CONFIG } from "../../shared/constants";
import { isGameStarted } from "../../shared/game/isGameStarted";
import type { GetRoomResponse } from "../../shared/types/api";
import type { Player, RoomState } from "../../shared/types/game";
import { generatePlayerId, generatePlayerToken } from "../lib/playerAuth";
import type { CreateRoomResult, JoinRoomResult } from "../types/rooms";
import type { Env } from "../types/env";
import { validateClientMessage } from "../../shared/validation/clientMessage";
import type { ServerMessage } from "../../shared/types/messages";

// GameRoom内部だけで保持する状態。playerTokenはPublicRoomStateへ含めない。
export type PersistedRoom = {
  room: RoomState;
  playerTokens: Record<string, string>;
};

export const ROOM_STORAGE_KEY = "room";

function createInitialRoomState(roomCode: string): RoomState {
  const now = Date.now();

  return {
    version: 1,
    roomCode,
    phase: "LOBBY",
    players: [],
    score: { human: 0, ai: 0 },
    round: null,
    challengerQueue: [],
    usedPromptIds: [],
    deadlineAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createPlayer(name: string, joinOrder: number, isHost: boolean): Player {
  return {
    id: generatePlayerId(),
    name,
    joinOrder,
    isHost,
    isOnline: false,
    isReady: false,
    supportedChallenges: [],
  };
}

export class GameRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("WebSocket upgrade required", { status: 426 });
    }

    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");
    const playerToken = url.searchParams.get("playerToken");
    if (!playerId || !playerToken) return new Response("Authentication required", { status: 401 });

    const stored = await this.load();
    if (!stored) return new Response("Room not found", { status: 404 });
    if (!stored.room.players.some((player) => player.id === playerId) || stored.playerTokens[playerId] !== playerToken) {
      return new Response("Authentication failed", { status: 401 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ playerId });
    const room = await this.updateOnline(playerId, true);
    server.send(JSON.stringify({ type: "STATE_SYNC", state: room } satisfies ServerMessage));
    await this.broadcastState(room, server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const attachment = ws.deserializeAttachment() as { playerId?: unknown } | null;
    const playerId = typeof attachment?.playerId === "string" ? attachment.playerId : null;
    if (!playerId) return this.sendError(ws, "UNAUTHENTICATED", "接続情報を確認できません。");

    let input: unknown;
    try {
      input = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      return this.sendError(ws, "INVALID_MESSAGE", "メッセージが正しいJSONではありません。");
    }
    const validation = validateClientMessage(input);
    if (!validation.valid) return this.sendError(ws, "INVALID_MESSAGE", validation.message);
    if (validation.value.type === "PING") {
      ws.send(JSON.stringify({ type: "PONG" } satisfies ServerMessage));
      return;
    }
    if (validation.value.type !== "READY") {
      return this.sendError(ws, "NOT_IMPLEMENTED", "このメッセージはまだ実装されていません。");
    }
    const ready = validation.value.ready;

    const stored = await this.load();
    if (!stored) return this.sendError(ws, "ROOM_NOT_FOUND", "ルームが見つかりません。");
    const player = stored.room.players.find((candidate) => candidate.id === playerId);
    if (!player) return this.sendError(ws, "PLAYER_NOT_FOUND", "プレイヤーが見つかりません。");
    if (player.isReady === ready) return;
    const room: RoomState = {
      ...stored.room,
      players: stored.room.players.map((candidate) => candidate.id === playerId ? { ...candidate, isReady: ready } : candidate),
      version: stored.room.version + 1,
      updatedAt: Date.now(),
    };
    await this.persist({ ...stored, room });
    await this.broadcastState(room);
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    await this.disconnect(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.disconnect(ws);
  }

  async getState(roomCode: string): Promise<RoomState> {
    const existing = await this.load();
    if (existing) {
      return existing.room;
    }

    const room = createInitialRoomState(roomCode);
    await this.persist({ room, playerTokens: {} });
    return room;
  }

  async createRoom(roomCode: string, playerName: string): Promise<CreateRoomResult> {
    const existing = await this.load();
    if (existing) {
      return { ok: false, code: "ROOM_CODE_TAKEN" };
    }

    const host = createPlayer(playerName, 0, true);
    const playerToken = generatePlayerToken();
    const room: RoomState = { ...createInitialRoomState(roomCode), players: [host] };

    await this.persist({ room, playerTokens: { [host.id]: playerToken } });

    return { ok: true, room, playerId: host.id, playerToken };
  }

  async joinRoom(playerName: string): Promise<JoinRoomResult> {
    const stored = await this.load();
    if (!stored) {
      return { ok: false, code: "ROOM_NOT_FOUND" };
    }

    const { room, playerTokens } = stored;

    if (room.players.length >= GAME_CONFIG.maxPlayers) {
      return { ok: false, code: "ROOM_FULL" };
    }

    if (isGameStarted(room.phase)) {
      return { ok: false, code: "GAME_ALREADY_STARTED" };
    }

    if (room.players.some((player) => player.name.trim() === playerName.trim())) {
      return { ok: false, code: "NAME_ALREADY_USED" };
    }

    const player = createPlayer(playerName, room.players.length, false);
    const playerToken = generatePlayerToken();

    const updatedRoom: RoomState = {
      ...room,
      players: [...room.players, player],
      version: room.version + 1,
      updatedAt: Date.now(),
    };

    await this.persist({
      room: updatedRoom,
      playerTokens: { ...playerTokens, [player.id]: playerToken },
    });
    await this.broadcastState(updatedRoom);

    return { ok: true, room: updatedRoom, playerId: player.id, playerToken };
  }

  async getRoomInfo(): Promise<GetRoomResponse> {
    const stored = await this.load();
    if (!stored) {
      return { exists: false, canJoin: false, playerCount: 0, hasStarted: false };
    }

    const { room } = stored;
    const hasStarted = isGameStarted(room.phase);
    const playerCount = room.players.length;
    const canJoin = !hasStarted && playerCount < GAME_CONFIG.maxPlayers;

    return { exists: true, canJoin, playerCount, hasStarted };
  }

  private async load(): Promise<PersistedRoom | undefined> {
    return this.ctx.storage.get<PersistedRoom>(ROOM_STORAGE_KEY);
  }

  private async persist(stored: PersistedRoom): Promise<void> {
    await this.ctx.storage.put(ROOM_STORAGE_KEY, stored);
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    ws.send(JSON.stringify({ type: "ERROR", code, message } satisfies ServerMessage));
  }

  private async updateOnline(playerId: string, isOnline: boolean): Promise<RoomState> {
    const stored = await this.load();
    if (!stored) throw new Error("Room disappeared");
    const player = stored.room.players.find((candidate) => candidate.id === playerId);
    if (!player || player.isOnline === isOnline) return stored.room;
    const room: RoomState = {
      ...stored.room,
      players: stored.room.players.map((candidate) => candidate.id === playerId ? { ...candidate, isOnline } : candidate),
      version: stored.room.version + 1,
      updatedAt: Date.now(),
    };
    await this.persist({ ...stored, room });
    return room;
  }

  private async disconnect(ws: WebSocket): Promise<void> {
    const attachment = ws.deserializeAttachment() as { playerId?: unknown } | null;
    const playerId = typeof attachment?.playerId === "string" ? attachment.playerId : null;
    if (!playerId) return;
    const stillConnected = this.ctx.getWebSockets().some((candidate) => candidate !== ws && candidate.readyState === WebSocket.OPEN && (candidate.deserializeAttachment() as { playerId?: unknown } | null)?.playerId === playerId);
    if (stillConnected) return;
    const room = await this.updateOnline(playerId, false);
    await this.broadcastState(room);
  }

  private async broadcastState(room: RoomState, except?: WebSocket): Promise<void> {
    const payload = JSON.stringify({ type: "STATE_SYNC", state: room } satisfies ServerMessage);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== except && socket.readyState === WebSocket.OPEN) socket.send(payload);
    }
  }
}
