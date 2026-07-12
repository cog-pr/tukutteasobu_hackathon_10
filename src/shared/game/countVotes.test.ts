import { describe, expect, it } from 'vitest'

import { countVotes } from './countVotes'

describe('countVotes', () => {
  it('counts A and B votes separately', () => {
    expect(countVotes({ p1: 'A', p2: 'A', p3: 'B' })).toEqual({ countA: 2, countB: 1, winner: 'A' })
  })

  it('declares B the winner when it has more votes', () => {
    expect(countVotes({ p1: 'B', p2: 'B', p3: 'A' })).toEqual({ countA: 1, countB: 2, winner: 'B' })
  })

  it('returns draw on a tie', () => {
    expect(countVotes({ p1: 'A', p2: 'B' })).toEqual({ countA: 1, countB: 1, winner: 'draw' })
  })

  it('returns draw with zero votes', () => {
    expect(countVotes({})).toEqual({ countA: 0, countB: 0, winner: 'draw' })
  })
})
