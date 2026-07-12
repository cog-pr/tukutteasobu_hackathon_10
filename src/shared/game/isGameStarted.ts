import type { GamePhase } from '../types/game'

export function isGameStarted(phase: GamePhase): boolean {
  return phase !== "LOBBY";
}
