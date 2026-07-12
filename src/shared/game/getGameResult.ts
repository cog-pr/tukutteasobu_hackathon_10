import type { Score } from '../types/game'
import { GAME_CONFIG } from '../constants'
export type { Score } from '../types/game'

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
  winningScore: number = GAME_CONFIG.winningScore,
): GameResult {
  if (score.human >= winningScore) {
    return { finished: true, winner: "human" };
  }

  if (score.ai >= winningScore) {
    return { finished: true, winner: "ai" };
  }

  return { finished: false, winner: null };
}
