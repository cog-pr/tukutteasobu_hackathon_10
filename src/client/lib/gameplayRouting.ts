import type { GamePhase } from '../../shared/types/game'

export type ResolveGameplayRouteInput = {
  phase: GamePhase
  isChallenger: boolean
}

/** Maps the current server-driven phase (+ the viewer's role this round) to the screen every client should be on. */
export function resolveGameplayRoute({ phase, isChallenger }: ResolveGameplayRouteInput): string {
  switch (phase) {
    case 'LOBBY':
      return '/lobby'
    case 'ROUND_INTRO':
      return '/round-intro'
    case 'ANSWERING':
      return isChallenger ? '/answering/challenger' : '/answering/waiting'
    case 'VOTING':
      return isChallenger ? '/voting/waiting' : '/voting'
    case 'REVEAL':
      return '/reveal'
    case 'REVENGE_ACTIVE':
      return isChallenger ? '/revenge' : '/revenge/waiting'
    case 'ROUND_RESULT':
      return '/round-result'
    case 'GAME_RESULT':
      return '/result'
  }
}
