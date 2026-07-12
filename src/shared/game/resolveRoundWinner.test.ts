import { describe, expect, it } from 'vitest'

import { resolveRoundWinner } from './resolveRoundWinner'

describe('resolveRoundWinner', () => {
  it('maps an A-win through to whichever side answered A', () => {
    const result = resolveRoundWinner({ votes: { p1: 'A', p2: 'A', p3: 'B' }, answerOrder: { A: 'human', B: 'ai' } })
    expect(result).toEqual({ countA: 2, countB: 1, winner: 'human' })
  })

  it('maps a B-win through to whichever side answered B', () => {
    const result = resolveRoundWinner({ votes: { p1: 'B', p2: 'B', p3: 'A' }, answerOrder: { A: 'human', B: 'ai' } })
    expect(result).toEqual({ countA: 1, countB: 2, winner: 'ai' })
  })

  it('gives the tie to the human regardless of answerOrder', () => {
    expect(resolveRoundWinner({ votes: { p1: 'A', p2: 'B' }, answerOrder: { A: 'human', B: 'ai' } }).winner).toBe('human')
    expect(resolveRoundWinner({ votes: { p1: 'A', p2: 'B' }, answerOrder: { A: 'ai', B: 'human' } }).winner).toBe('human')
  })

  it('gives the human the win when nobody voted', () => {
    expect(resolveRoundWinner({ votes: {}, answerOrder: { A: 'ai', B: 'human' } })).toEqual({ countA: 0, countB: 0, winner: 'human' })
  })
})
