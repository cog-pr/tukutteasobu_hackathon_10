import { describe, expect, it } from 'vitest'

import { resolveGameplayRoute } from './gameplayRouting'
import type { GamePhase } from '../../shared/types/game'

describe('resolveGameplayRoute', () => {
  it('maps role-independent phases to a single screen', () => {
    const cases: Array<[GamePhase, string]> = [
      ['LOBBY', '/lobby'],
      ['ROUND_INTRO', '/round-intro'],
      ['REVEAL', '/reveal'],
      ['ROUND_RESULT', '/round-result'],
      ['GAME_RESULT', '/result'],
    ]
    for (const [phase, path] of cases) {
      expect(resolveGameplayRoute({ phase, isChallenger: true })).toBe(path)
      expect(resolveGameplayRoute({ phase, isChallenger: false })).toBe(path)
    }
  })

  it('sends the challenger to the active screen and everyone else to the waiting screen', () => {
    expect(resolveGameplayRoute({ phase: 'ANSWERING', isChallenger: true })).toBe('/answering/challenger')
    expect(resolveGameplayRoute({ phase: 'ANSWERING', isChallenger: false })).toBe('/answering/waiting')
    expect(resolveGameplayRoute({ phase: 'REVENGE_ACTIVE', isChallenger: true })).toBe('/revenge')
    expect(resolveGameplayRoute({ phase: 'REVENGE_ACTIVE', isChallenger: false })).toBe('/revenge/waiting')
  })

  it('sends the challenger to the waiting screen during voting since the challenger cannot vote', () => {
    expect(resolveGameplayRoute({ phase: 'VOTING', isChallenger: true })).toBe('/voting/waiting')
    expect(resolveGameplayRoute({ phase: 'VOTING', isChallenger: false })).toBe('/voting')
  })
})
