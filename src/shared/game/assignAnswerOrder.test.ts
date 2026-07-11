import { describe, expect, it, vi } from "vitest";
import { assignAnswerOrder } from "./assignAnswerOrder";

describe("assignAnswerOrder", () => {
  it("returns { A: 'human', B: 'ai' } when Math.random() < 0.5", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    expect(assignAnswerOrder()).toEqual({ A: "human", B: "ai" });

    vi.restoreAllMocks();
  });

  it("returns { A: 'ai', B: 'human' } when Math.random() >= 0.5", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    expect(assignAnswerOrder()).toEqual({ A: "ai", B: "human" });

    vi.restoreAllMocks();
  });

  it("always assigns human and ai exactly once between A and B, for either branch", () => {
    for (const randomValue of [0, 0.5]) {
      vi.spyOn(Math, "random").mockReturnValue(randomValue);

      const order = assignAnswerOrder();
      const values = [order.A, order.B].sort();

      expect(values).toEqual(["ai", "human"]);
      expect(order.A).not.toBe(order.B);

      vi.restoreAllMocks();
    }
  });

  it("produces both assignment patterns across repeated calls", () => {
    const randomValues = [0, 0.5, 0, 0.5];
    let callIndex = 0;
    vi.spyOn(Math, "random").mockImplementation(
      () => randomValues[callIndex++],
    );

    const results = randomValues.map(() => assignAnswerOrder());

    expect(new Set(results.map((r) => JSON.stringify(r)))).toEqual(
      new Set([
        JSON.stringify({ A: "human", B: "ai" }),
        JSON.stringify({ A: "ai", B: "human" }),
      ]),
    );

    vi.restoreAllMocks();
  });
});
