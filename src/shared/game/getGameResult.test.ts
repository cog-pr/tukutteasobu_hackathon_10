import { describe, expect, it } from 'vitest'

import { getGameResult } from './getGameResult'

describe('getGameResult', () => {
  it('is not finished below the winning score', () => {
    expect(getGameResult({ human: 2, ai: 2 }, 3)).toEqual({ finished: false, winner: null })
  })

  it('declares the human the winner at the winning score', () => {
    expect(getGameResult({ human: 3, ai: 1 }, 3)).toEqual({ finished: true, winner: 'human' })
  })

  it('declares the ai the winner at the winning score', () => {
    expect(getGameResult({ human: 1, ai: 3 }, 3)).toEqual({ finished: true, winner: 'ai' })
  })

  it('defaults to GAME_CONFIG.winningScore when not given', () => {
    expect(getGameResult({ human: 0, ai: 0 })).toEqual({ finished: false, winner: null })
  })
})
