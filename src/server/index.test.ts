import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("Worker", () => {
  it("GET /api/health は200と{ ok: true }を返す", async () => {
    const res = await SELF.fetch("https://example.com/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("存在しないAPIは404を返す", async () => {
    const res = await SELF.fetch("https://example.com/api/does-not-exist");

    expect(res.status).toBe(404);
  });
});
