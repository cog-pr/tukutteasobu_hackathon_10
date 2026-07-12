import { runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import type { Prompt, RoomState, RoundState } from "../../shared/types/game";
import type { ServerMessage } from "../../shared/types/messages";
import { ROOM_STORAGE_KEY, type PersistedRoom } from "./GameRoom";
import type { GameRoom } from "./GameRoom";

/** Buffers every message a socket receives so tests never race a broadcast against listener attachment. */
export type MessageQueue = {
  next(): Promise<ServerMessage>;
};

function createQueue(socket: WebSocket): MessageQueue {
  const buffered: string[] = [];
  const waiters: Array<(value: string) => void> = [];

  socket.addEventListener("message", (event) => {
    const data = String(event.data);
    const waiter = waiters.shift();
    if (waiter) waiter(data);
    else buffered.push(data);
  });

  return {
    async next(): Promise<ServerMessage> {
      const queued = buffered.shift();
      const raw = queued !== undefined ? queued : await new Promise<string>((resolve) => waiters.push(resolve));
      return JSON.parse(raw) as ServerMessage;
    },
  };
}

async function openSocket(stub: DurableObjectStub<GameRoom>, roomCode: string, playerId: string, playerToken: string) {
  const response = await stub.fetch(
    new Request(`https://example.test/api/rooms/${roomCode}/ws?playerId=${encodeURIComponent(playerId)}&playerToken=${encodeURIComponent(playerToken)}`, {
      headers: { Upgrade: "websocket" },
    }),
  );
  const socket = response.webSocket!;
  const queue = createQueue(socket);
  socket.accept();
  return { socket, queue };
}

export type ConnectedPlayer = { playerId: string; playerToken: string; socket: WebSocket; queue: MessageQueue };

/** Creates a room with a host and connects its WebSocket, consuming the initial STATE_SYNC. */
export async function connectHost(roomCode: string, hostName = "Host"): Promise<{ stub: DurableObjectStub<GameRoom> } & ConnectedPlayer> {
  const stub = env.GAME_ROOM.getByName(roomCode);
  const created = await stub.createRoom(roomCode, hostName);
  if (!created.ok) throw new Error("unreachable");
  const { socket, queue } = await openSocket(stub, roomCode, created.playerId, created.playerToken);
  await queue.next(); // initial STATE_SYNC
  return { stub, playerId: created.playerId, playerToken: created.playerToken, socket, queue };
}

/** Joins an already-created room and connects its WebSocket, consuming the initial STATE_SYNC. */
export async function connectJoiner(stub: DurableObjectStub<GameRoom>, roomCode: string, playerName: string): Promise<ConnectedPlayer> {
  const joined = await stub.joinRoom(playerName);
  if (!joined.ok) throw new Error("unreachable");
  const { socket, queue } = await openSocket(stub, roomCode, joined.playerId, joined.playerToken);
  await queue.next(); // initial STATE_SYNC
  return { playerId: joined.playerId, playerToken: joined.playerToken, socket, queue };
}

/** Creates `count` connected players (players[0] is the host). Every queue is left empty. */
export async function connectPlayers(roomCode: string, count: number): Promise<{ stub: DurableObjectStub<GameRoom>; players: ConnectedPlayer[] }> {
  const host = await connectHost(roomCode, "P1");
  const players: ConnectedPlayer[] = [{ playerId: host.playerId, playerToken: host.playerToken, socket: host.socket, queue: host.queue }];
  for (let i = 1; i < count; i++) {
    players.push(await connectJoiner(host.stub, roomCode, `P${i + 1}`));
  }

  // Each already-connected player accumulates 2 broadcasts (player-joined + player-came-online) per
  // subsequent joiner. Drain exactly that many so every queue starts empty for the caller.
  for (let i = 0; i < players.length; i++) {
    const pending = 2 * (players.length - 1 - i);
    for (let n = 0; n < pending; n++) await players[i].queue.next();
  }

  return { stub: host.stub, players };
}

/** Creates a full 4-player room, all connected. players[0] is the host. Every queue is left empty. */
export async function connectFullRoom(roomCode: string): Promise<{ stub: DurableObjectStub<GameRoom>; players: ConnectedPlayer[] }> {
  return connectPlayers(roomCode, 4);
}

/** Sends ready:true for all 4 players and drains every resulting broadcast. */
export async function readyUpAll(players: ConnectedPlayer[]): Promise<void> {
  for (const player of players) {
    player.socket.send(JSON.stringify({ type: "READY", ready: true }));
  }
  for (const player of players) {
    for (let i = 0; i < players.length; i++) await player.queue.next();
  }
}

export async function sendAndWait(player: ConnectedPlayer, message: unknown): Promise<ServerMessage> {
  player.socket.send(JSON.stringify(message));
  return player.queue.next();
}

/** Directly rewrites the persisted RoomState, bypassing message handlers, for fast phase setup. */
export async function seedRoom(stub: DurableObjectStub<GameRoom>, mutate: (room: RoomState) => RoomState): Promise<void> {
  await runInDurableObject(stub, async (_instance, state) => {
    const stored = await state.storage.get<PersistedRoom>(ROOM_STORAGE_KEY);
    if (!stored) throw new Error("unreachable: room not created yet");
    await state.storage.put(ROOM_STORAGE_KEY, { ...stored, room: mutate(stored.room) } satisfies PersistedRoom);
  });
}

export async function readRoom(stub: DurableObjectStub<GameRoom>): Promise<RoomState> {
  return runInDurableObject(stub, async (_instance, state) => {
    const stored = await state.storage.get<PersistedRoom>(ROOM_STORAGE_KEY);
    if (!stored) throw new Error("unreachable: room not created yet");
    return stored.room;
  });
}

export const TEST_PROMPT: Prompt = { id: "prompt_001", type: "text", text: "お題", category: "normal" };

export function buildRoundFixture(challengerId: string, overrides: Partial<RoundState> = {}): RoundState {
  return {
    roundNumber: 1,
    challengerId,
    prompt: TEST_PROMPT,
    humanAnswer: null,
    aiAnswer: null,
    answerOrder: null,
    votes: {},
    winner: null,
    challengeType: null,
    challengeResult: null,
    isForfeit: false,
    challengeProgress: 0,
    challengeProgressUpdatedAt: null,
    ...overrides,
  };
}
