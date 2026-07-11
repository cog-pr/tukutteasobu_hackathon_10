import { describe, expect, it } from 'vitest'

import { selectNextChallenger } from './selectNextChallenger'

const players = [
  { id: 'player-1', isOnline: true },
  { id: 'player-2', isOnline: true },
  { id: 'player-3', isOnline: true },
]

describe('selectNextChallenger', () => {
  it('shuffles all online players when the queue is empty', () => {
    const result = selectNextChallenger({
      players,
      challengerQueue: [],
      random: () => 0,
    })

    expect(result.nextChallengerId).toBe('player-2')
    expect(result.challengerQueue).toEqual(['player-3', 'player-1'])
  })

  it('does not select the same player consecutively after everyone has played', () => {
    const result = selectNextChallenger({
      players,
      challengerQueue: [],
      previousChallengerId: 'player-2',
      random: () => 0,
    })

    expect(result.nextChallengerId).not.toBe('player-2')
    expect([result.nextChallengerId, ...result.challengerQueue]).toEqual(
      expect.arrayContaining(players.map((player) => player.id)),
    )
  })

  it('does not reselect a player until the current queue is exhausted', () => {
    const result = selectNextChallenger({
      players,
      challengerQueue: ['player-3', 'player-1'],
      previousChallengerId: 'player-2',
      random: () => 0,
    })

    expect(result).toEqual({
      nextChallengerId: 'player-3',
      challengerQueue: ['player-1'],
    })
  })

  it('removes offline players from an existing queue', () => {
    const result = selectNextChallenger({
      players: players.map((player) => ({
        ...player,
        isOnline: player.id !== 'player-2',
      })),
      challengerQueue: ['player-2', 'player-3'],
      previousChallengerId: 'player-1',
    })

    expect(result).toEqual({
      nextChallengerId: 'player-3',
      challengerQueue: [],
    })
  })

  it('returns null when no players are online', () => {
    const result = selectNextChallenger({
      players: players.map((player) => ({ ...player, isOnline: false })),
      challengerQueue: [],
    })

    expect(result).toEqual({
      nextChallengerId: null,
      challengerQueue: [],
    })
  })
})
