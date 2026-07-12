import { describe, expect, it } from 'vitest'

import { selectMvp } from './selectMvp'
import type { RoundHistoryEntry } from '../types/game'

const prompt = { id: 'p1', type: 'text' as const, text: 'お題', category: 'normal' as const }

function entry(overrides: Partial<RoundHistoryEntry>): RoundHistoryEntry {
  return {
    roundNumber: 1,
    challengerId: 'player_1',
    challengerName: 'たけし',
    prompt,
    humanAnswer: '人間の回答',
    aiAnswer: 'AIの回答',
    answerOrder: { A: 'human', B: 'ai' },
    voteCounts: { A: 1, B: 2 },
    winner: 'ai',
    isForfeit: false,
    wentToRevenge: false,
    revengeResult: null,
    ...overrides,
  }
}

describe('selectMvp', () => {
  it('picks the human answer with the most votes', () => {
    const history = [
      entry({ roundNumber: 1, challengerId: 'player_1', challengerName: 'たけし', answerOrder: { A: 'human', B: 'ai' }, voteCounts: { A: 1, B: 2 } }),
      entry({ roundNumber: 2, challengerId: 'player_2', challengerName: 'サトウ', answerOrder: { A: 'ai', B: 'human' }, voteCounts: { A: 0, B: 3 } }),
    ]

    expect(selectMvp({ history })).toEqual({ playerId: 'player_2', playerName: 'サトウ', answer: '人間の回答', roundNumber: 2, voteCount: 3 })
  })

  it('breaks ties by earlier round number', () => {
    const history = [
      entry({ roundNumber: 2, challengerId: 'player_2', voteCounts: { A: 2, B: 0 } }),
      entry({ roundNumber: 1, challengerId: 'player_1', voteCounts: { A: 2, B: 0 } }),
    ]

    expect(selectMvp({ history })?.roundNumber).toBe(1)
  })

  it('breaks further ties by challengerId', () => {
    const history = [
      entry({ roundNumber: 1, challengerId: 'player_2', voteCounts: { A: 2, B: 0 } }),
      entry({ roundNumber: 1, challengerId: 'player_1', voteCounts: { A: 2, B: 0 } }),
    ]

    expect(selectMvp({ history })?.playerId).toBe('player_1')
  })

  it('returns null for empty history', () => {
    expect(selectMvp({ history: [] })).toBeNull()
  })

  it('returns null when every round was a forfeit', () => {
    const history = [entry({ humanAnswer: null, answerOrder: null, isForfeit: true, winner: 'ai' })]

    expect(selectMvp({ history })).toBeNull()
  })
})
