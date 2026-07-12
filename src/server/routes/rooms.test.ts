import { runInDurableObject, SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from "../../shared/constants";
import type { CreateRoomResponse, JoinRoomResponse } from "../../shared/types/api";
import { validateRoomCode } from "../../shared/validation/roomCode";
import type { GamePhase } from "../../shared/types/game";
import { ROOM_STORAGE_KEY, type PersistedRoom } from "../durable-objects/GameRoom";

const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_CHARACTERS}]{${ROOM_CODE_LENGTH}}$`);

async function createRoom(playerName: string) {
  const res = await SELF.fetch("https://example.com/api/rooms", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  return { res, body: (await res.json()) as CreateRoomResponse };
}

async function joinRoom(roomCode: string, playerName: string) {
  const res = await SELF.fetch(`https://example.com/api/rooms/${roomCode}/join`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  return { res, body: (await res.json()) as Record<string, unknown> };
}

async function forcePhase(roomCode: string, phase: GamePhase) {
  const stub = env.GAME_ROOM.getByName(roomCode);
  await runInDurableObject(stub, async (_instance, state) => {
    const stored = await state.storage.get<PersistedRoom>(ROOM_STORAGE_KEY);
    if (!stored) throw new Error("unreachable");
    await state.storage.put(ROOM_STORAGE_KEY, {
      ...stored,
      room: { ...stored.room, phase },
    } satisfies PersistedRoom);
  });
}

describe("POST /api/rooms", () => {
  it("正常にルームを作成できる", async () => {
    const { res, body } = await createRoom("たけし");

    expect(res.status).toBe(200);
    expect(body.roomCode).toMatch(ROOM_CODE_PATTERN);
    expect(body.playerId).toMatch(/^player_/);
    expect(body.playerToken).toMatch(/^token_/);
  });

  it("不正なプレイヤー名を拒否する", async () => {
    const res = await SELF.fetch("https://example.com/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerName: "" }),
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "INVALID_REQUEST" });
  });

  it("JSONとして不正なリクエストを拒否する", async () => {
    const res = await SELF.fetch("https://example.com/api/rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "INVALID_REQUEST" });
  });
});

describe("POST /api/rooms/:roomCode/join", () => {
  it("正常に参加できる", async () => {
    const { body: created } = await createRoom("たけし");

    const { res, body } = await joinRoom(created.roomCode, "サトウ");

    expect(res.status).toBe(200);
    expect(body.roomCode).toBe(created.roomCode);
    expect(validateRoomCode(body.roomCode).valid).toBe(true);
    expect(body.playerId).toMatch(/^player_/);
    expect(body.playerToken).toMatch(/^token_/);
    expect(Object.keys(body).sort()).toEqual([
      "playerId",
      "playerToken",
      "roomCode",
    ] satisfies Array<keyof JoinRoomResponse>);
  });

  it("合計4人まで参加でき、5人目を拒否する", async () => {
    const { body: created } = await createRoom("P1");

    await joinRoom(created.roomCode, "P2");
    await joinRoom(created.roomCode, "P3");
    const fourth = await joinRoom(created.roomCode, "P4");
    expect(fourth.res.status).toBe(200);

    const fifth = await joinRoom(created.roomCode, "P5");
    expect(fifth.res.status).toBe(409);
    expect(fifth.body).toEqual({ code: "ROOM_FULL", message: "このルームは満員です" });
  });

  it("重複した名前を拒否する", async () => {
    const { body: created } = await createRoom("たけし");

    const { res, body } = await joinRoom(created.roomCode, "たけし");

    expect(res.status).toBe(409);
    expect(body).toEqual({ code: "NAME_ALREADY_USED", message: "同じ名前のプレイヤーがいます" });
  });

  it("存在しないルームを拒否する", async () => {
    const { res, body } = await joinRoom("ZZZZZZ", "たけし");

    expect(res.status).toBe(404);
    expect(body).toEqual({ code: "ROOM_NOT_FOUND", message: "そのルームは見つかりませんでした" });
  });

  it("開始済みルームへの参加を拒否する", async () => {
    const { body: created } = await createRoom("たけし");
    await forcePhase(created.roomCode, "ANSWERING");

    const { res, body } = await joinRoom(created.roomCode, "サトウ");

    expect(res.status).toBe(409);
    expect(body).toEqual({ code: "GAME_ALREADY_STARTED", message: "このゲームはすでに始まっています" });
  });

  it("不正なルームコードを拒否する", async () => {
    const { res, body } = await joinRoom("AB", "たけし");

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ code: "INVALID_ROOM_CODE" });
  });
});

describe("GET /api/rooms/:roomCode", () => {
  it("存在するルームの情報を取得できる", async () => {
    const { body: created } = await createRoom("たけし");

    const res = await SELF.fetch(`https://example.com/api/rooms/${created.roomCode}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      exists: true,
      canJoin: true,
      playerCount: 1,
      hasStarted: false,
    });
  });

  it("存在しないルームについてexists:falseを返す", async () => {
    const res = await SELF.fetch("https://example.com/api/rooms/ZZZZZZ");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      exists: false,
      canJoin: false,
      playerCount: 0,
      hasStarted: false,
    });
  });

  it("満員時にcanJoin:falseを返す", async () => {
    const { body: created } = await createRoom("P1");
    await joinRoom(created.roomCode, "P2");
    await joinRoom(created.roomCode, "P3");
    await joinRoom(created.roomCode, "P4");

    const res = await SELF.fetch(`https://example.com/api/rooms/${created.roomCode}`);

    expect(await res.json()).toEqual({
      exists: true,
      canJoin: false,
      playerCount: 4,
      hasStarted: false,
    });
  });

  it("開始済みの場合にhasStarted:trueを返す", async () => {
    const { body: created } = await createRoom("たけし");
    await forcePhase(created.roomCode, "VOTING");

    const res = await SELF.fetch(`https://example.com/api/rooms/${created.roomCode}`);

    expect(await res.json()).toMatchObject({ hasStarted: true });
  });

  it("認証情報がレスポンスへ含まれない", async () => {
    const { body: created } = await createRoom("たけし");

    const res = await SELF.fetch(`https://example.com/api/rooms/${created.roomCode}`);
    const text = await res.text();

    expect(text).not.toContain("playerToken");
    expect(text).not.toContain("playerId");
    expect(text).not.toContain(created.playerToken);
  });
});
