import { runInDurableObject } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { ROOM_STORAGE_KEY, type PersistedRoom } from "./GameRoom";

describe("GameRoom", () => {
  it("初回アクセス時にLOBBY状態を生成してStorageへ保存する", async () => {
    const stub = env.GAME_ROOM.getByName("AB37X2");

    const state = await stub.getState("AB37X2");

    expect(state).toMatchObject({
      version: 1,
      roomCode: "AB37X2",
      phase: "LOBBY",
    });
    expect(state.createdAt).toBe(state.updatedAt);
  });

  it("再取得時に同じ状態を返す", async () => {
    const stub = env.GAME_ROOM.getByName("CD48Y3");

    const first = await stub.getState("CD48Y3");
    const second = await stub.getState("CD48Y3");

    expect(second).toEqual(first);
  });

  it("異なるルームコードは異なるDurable Objectへ割り当てられる", async () => {
    const stubA = env.GAME_ROOM.getByName("ROOMAAA");
    const stubB = env.GAME_ROOM.getByName("ROOMBBB");

    expect(stubA.id.equals(stubB.id)).toBe(false);

    const stateA = await stubA.getState("ROOMAAA");
    const stateB = await stubB.getState("ROOMBBB");

    expect(stateA.roomCode).toBe("ROOMAAA");
    expect(stateB.roomCode).toBe("ROOMBBB");
  });
});

describe("GameRoom#createRoom", () => {
  it("ホストが1人登録されたRoomStateと認証情報を返す", async () => {
    const stub = env.GAME_ROOM.getByName("HOSTAA");

    const result = await stub.createRoom("HOSTAA", "たけし");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    expect(result.room.players).toEqual([
      expect.objectContaining({
        name: "たけし",
        isHost: true,
        joinOrder: 0,
        isOnline: true,
      }),
    ]);
    expect(result.playerId).toMatch(/^player_/);
    expect(result.playerToken).toMatch(/^token_/);
    expect(result.room.version).toBe(1);
  });

  it("playerTokenが公開状態(RoomState)に含まれない", async () => {
    const stub = env.GAME_ROOM.getByName("NOPUB1");

    const result = await stub.createRoom("NOPUB1", "たけし");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(JSON.stringify(result.room)).not.toContain(result.playerToken);
    expect(Object.keys(result.room)).not.toContain("playerToken");
  });

  it("既に存在するルームコードでは作成に失敗する", async () => {
    const stub = env.GAME_ROOM.getByName("DUP001");

    await stub.createRoom("DUP001", "たけし");
    const second = await stub.createRoom("DUP001", "サトウ");

    expect(second).toEqual({ ok: false, code: "ROOM_CODE_TAKEN" });
  });
});

describe("GameRoom#joinRoom", () => {
  it("正常に参加でき、versionとupdatedAtが更新される", async () => {
    const stub = env.GAME_ROOM.getByName("JOIN01");

    const created = await stub.createRoom("JOIN01", "たけし");
    if (!created.ok) throw new Error("unreachable");

    const joined = await stub.joinRoom("サトウ");

    expect(joined.ok).toBe(true);
    if (!joined.ok) throw new Error("unreachable");
    expect(joined.playerId).toMatch(/^player_/);
    expect(joined.playerToken).toMatch(/^token_/);
    expect(joined.room.players).toHaveLength(2);
    expect(joined.room.version).toBe(created.room.version + 1);
    expect(joined.room.updatedAt).toBeGreaterThanOrEqual(created.room.updatedAt);
  });

  it("合計4人まで参加でき、5人目は拒否される", async () => {
    const stub = env.GAME_ROOM.getByName("FULL01");

    await stub.createRoom("FULL01", "P1");
    await stub.joinRoom("P2");
    await stub.joinRoom("P3");
    const fourth = await stub.joinRoom("P4");

    expect(fourth.ok).toBe(true);
    if (fourth.ok) {
      expect(fourth.room.players).toHaveLength(4);
    }

    const fifth = await stub.joinRoom("P5");
    expect(fifth).toEqual({ ok: false, code: "ROOM_FULL" });
  });

  it("重複した名前の参加を拒否する", async () => {
    const stub = env.GAME_ROOM.getByName("DUPNM1");

    await stub.createRoom("DUPNM1", "たけし");
    const result = await stub.joinRoom("たけし");

    expect(result).toEqual({ ok: false, code: "NAME_ALREADY_USED" });
  });

  it("存在しないルームへの参加を拒否する", async () => {
    const stub = env.GAME_ROOM.getByName("NOEXST");

    const result = await stub.joinRoom("たけし");

    expect(result).toEqual({ ok: false, code: "ROOM_NOT_FOUND" });
  });

  it("開始済みのルームへの参加を拒否する", async () => {
    const stub = env.GAME_ROOM.getByName("STARTD");

    await stub.createRoom("STARTD", "たけし");
    await runInDurableObject(stub, async (_instance, state) => {
      const stored = await state.storage.get<PersistedRoom>(ROOM_STORAGE_KEY);
      if (!stored) throw new Error("unreachable");
      await state.storage.put(ROOM_STORAGE_KEY, {
        ...stored,
        room: { ...stored.room, phase: "ANSWERING" },
      } satisfies PersistedRoom);
    });

    const result = await stub.joinRoom("サトウ");

    expect(result).toEqual({ ok: false, code: "GAME_ALREADY_STARTED" });
  });
});

describe("GameRoom#getRoomInfo", () => {
  it("存在しないルームはexists:falseを返す", async () => {
    const stub = env.GAME_ROOM.getByName("INFNO1");

    expect(await stub.getRoomInfo()).toEqual({
      exists: false,
      canJoin: false,
      playerCount: 0,
      hasStarted: false,
    });
  });

  it("存在するルームの情報を返す", async () => {
    const stub = env.GAME_ROOM.getByName("INFOK1");

    await stub.createRoom("INFOK1", "たけし");

    expect(await stub.getRoomInfo()).toEqual({
      exists: true,
      canJoin: true,
      playerCount: 1,
      hasStarted: false,
    });
  });

  it("満員時にcanJoin:falseを返す", async () => {
    const stub = env.GAME_ROOM.getByName("INFFUL");

    await stub.createRoom("INFFUL", "P1");
    await stub.joinRoom("P2");
    await stub.joinRoom("P3");
    await stub.joinRoom("P4");

    expect(await stub.getRoomInfo()).toEqual({
      exists: true,
      canJoin: false,
      playerCount: 4,
      hasStarted: false,
    });
  });

  it("開始済みの場合にhasStarted:trueを返す", async () => {
    const stub = env.GAME_ROOM.getByName("INFSTD");

    await stub.createRoom("INFSTD", "たけし");
    await runInDurableObject(stub, async (_instance, state) => {
      const stored = await state.storage.get<PersistedRoom>(ROOM_STORAGE_KEY);
      if (!stored) throw new Error("unreachable");
      await state.storage.put(ROOM_STORAGE_KEY, {
        ...stored,
        room: { ...stored.room, phase: "VOTING" },
      } satisfies PersistedRoom);
    });

    expect(await stub.getRoomInfo()).toEqual({
      exists: true,
      canJoin: false,
      playerCount: 1,
      hasStarted: true,
    });
  });
});
