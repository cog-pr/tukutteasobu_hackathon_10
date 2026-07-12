import { describe, expect, it } from "vitest";
import { ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from "../../shared/constants";
import { generateRoomCode } from "./roomCode";

describe("generateRoomCode", () => {
  it("生成される文字列は許可された文字のみで構成された大文字6文字になる", () => {
    const pattern = new RegExp(`^[${ROOM_CODE_CHARACTERS}]{${ROOM_CODE_LENGTH}}$`);

    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(pattern);
      expect(code).toBe(code.toUpperCase());
    }
  });

  it("毎回同じ値にはならない", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
