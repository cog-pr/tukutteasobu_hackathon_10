import { describe, expect, it } from "vitest";
import { generatePlayerId, generatePlayerToken } from "./playerAuth";

describe("generatePlayerId / generatePlayerToken", () => {
  it("player_ / token_ で始まる推測困難な値を生成する", () => {
    expect(generatePlayerId()).toMatch(/^player_[0-9a-f-]{36}$/);
    expect(generatePlayerToken()).toMatch(/^token_[0-9a-f-]{36}$/);
  });

  it("呼び出すたびに異なる値を返す", () => {
    expect(generatePlayerId()).not.toBe(generatePlayerId());
    expect(generatePlayerToken()).not.toBe(generatePlayerToken());
  });
});
