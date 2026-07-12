import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

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
