import { describe, expect, it } from 'vitest'

import { isGameStarted } from './isGameStarted'

describe('isGameStarted', () => {
  it('returns false while the room is waiting in the lobby', () => expect(isGameStarted('LOBBY')).toBe(false))
  it.each(['ANSWERING', 'VOTING', 'REVEAL', 'REVENGE_ACTIVE', 'ROUND_RESULT', 'GAME_RESULT'] as const)(
    'returns true once the phase has moved past the lobby (%s)',
    (phase) => expect(isGameStarted(phase)).toBe(true),
  )
})
