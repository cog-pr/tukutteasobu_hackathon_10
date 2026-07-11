export type Score = {
  human: number;
  ai: number;
};

export type GameResult =
  | {
      finished: false;
      winner: null;
    }
  | {
      finished: true;
      winner: "human" | "ai";
    };

export function getGameResult(
  score: Score,
  winningScore: number = 3,
): GameResult {
  if (score.human >= winningScore) {
    return { finished: true, winner: "human" };
  }

  if (score.ai >= winningScore) {
    return { finished: true, winner: "ai" };
  }

  return { finished: false, winner: null };
}
