import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("GET /api/dev/rooms/:roomCode/state", () => {
  it("初回はLOBBY状態を生成して返す", async () => {
    const res = await SELF.fetch(
      "https://example.com/api/dev/rooms/EF59Z4/state",
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      version: 1,
      roomCode: "EF59Z4",
      phase: "LOBBY",
    });
  });

  it("再取得すると同じ状態が返る", async () => {
    const first = await (
      await SELF.fetch("https://example.com/api/dev/rooms/GH60A5/state")
    ).json();
    const second = await (
      await SELF.fetch("https://example.com/api/dev/rooms/GH60A5/state")
    ).json();

    expect(second).toEqual(first);
  });
});
