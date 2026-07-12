import { DurableObject } from "cloudflare:workers";
import { GAME_CONFIG } from "../../shared/constants";
import { isGameStarted } from "../../shared/game/isGameStarted";
import type { GetRoomResponse } from "../../shared/types/api";
import type { Player, RoomState } from "../../shared/types/game";
import { generatePlayerId, generatePlayerToken } from "../lib/playerAuth";
import type { CreateRoomResult, JoinRoomResult } from "../types/rooms";
import type { Env } from "../types/env";

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
    isOnline: true,
    isReady: false,
    supportedChallenges: [],
  };
}

export class GameRoom extends DurableObject<Env> {
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
}
