import { describe, expect, it } from 'vitest'

import { toPublicRoomState } from './toPublicRoomState'
import type { GamePhase, Player, RoomState, RoundState } from '../types/game'

const prompt = { id: 'p1', type: 'text' as const, text: 'お題', category: 'normal' as const }

const players: Player[] = [
  { id: 'player_1', name: 'たけし', joinOrder: 0, isHost: true, isOnline: true, isReady: true, supportedChallenges: [] },
  { id: 'player_2', name: 'サトウ', joinOrder: 1, isHost: false, isOnline: true, isReady: true, supportedChallenges: [] },
]

function round(overrides: Partial<RoundState> = {}): RoundState {
  return {
    roundNumber: 1,
    challengerId: 'player_1',
    prompt,
    humanAnswer: '人間の回答',
    aiAnswer: 'AIの回答',
    answerOrder: { A: 'human', B: 'ai' },
    votes: { player_2: 'A' },
    winner: null,
    challengeType: null,
    challengeResult: null,
    isForfeit: false,
    challengeProgress: 0,
    challengeProgressUpdatedAt: null,
    ...overrides,
  }
}

function room(phase: GamePhase, overrides: Partial<RoomState> = {}): RoomState {
  return {
    version: 1,
    roomCode: 'AB37X2',
    phase,
    players,
    score: { human: 0, ai: 0 },
    round: round(),
    challengerQueue: [],
    usedPromptIds: [prompt.id],
    deadlineAt: null,
    history: [],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('toPublicRoomState', () => {
  it('never exposes answer content or identity before VOTING', () => {
    for (const phase of ['ROUND_INTRO', 'ANSWERING'] as const) {
      const state = toPublicRoomState({ room: room(phase), viewerId: 'player_1' })
      const serialized = JSON.stringify(state)
      expect(serialized).not.toContain('人間の回答')
      expect(serialized).not.toContain('AIの回答')
      expect(state.round).toMatchObject({ isRevealed: false, hasHumanAnswer: true, hasAiAnswer: true, answerA: null, answerB: null })
    }
  })

  it('exposes answer text (but not owner identity or votes) during VOTING', () => {
    const state = toPublicRoomState({ room: room('VOTING'), viewerId: 'player_1' })
    const serialized = JSON.stringify(state)
    expect(serialized).not.toContain('"A":"human"')
    expect(state.round).toMatchObject({ isRevealed: false, answerA: '人間の回答', answerB: 'AIの回答' })
    expect(state.round).not.toHaveProperty('answerOrder')
  })

  it('hides VOTING answer text for a forfeited round (should not happen, but answerOrder is null)', () => {
    const forfeited = round({ humanAnswer: null, aiAnswer: 'AIの回答', answerOrder: null, isForfeit: true })
    const state = toPublicRoomState({ room: room('VOTING', { round: forfeited }), viewerId: 'player_1' })
    expect(state.round).toMatchObject({ isRevealed: false, answerA: null, answerB: null })
  })

  it('reflects the viewer-relative hasVoted flag', () => {
    const voter = toPublicRoomState({ room: room('VOTING'), viewerId: 'player_2' })
    const nonVoter = toPublicRoomState({ room: room('VOTING'), viewerId: 'player_1' })
    expect(voter.round).toMatchObject({ hasVoted: true })
    expect(nonVoter.round).toMatchObject({ hasVoted: false })
  })

  it('reveals answers, mapping, and aggregate vote counts from REVEAL onward', () => {
    const state = toPublicRoomState({
      room: room('REVEAL', { round: round({ votes: { player_2: 'A' }, winner: 'human' }) }),
      viewerId: 'player_2',
    })

    expect(state.round).toEqual({
      isRevealed: true,
      roundNumber: 1,
      challengerId: 'player_1',
      challengerName: 'たけし',
      prompt,
      answerA: '人間の回答',
      answerB: 'AIの回答',
      answerOrder: { A: 'human', B: 'ai' },
      voteCounts: { A: 1, B: 0 },
      winner: 'human',
      isForfeit: false,
      challengeType: null,
      challengeResult: null,
      challengeProgress: 0,
    })
  })

  it('never exposes which player cast which vote, even after reveal', () => {
    const state = toPublicRoomState({ room: room('REVEAL', { round: round({ votes: { player_2: 'A' } }) }), viewerId: 'player_1' })
    expect(JSON.stringify(state)).not.toContain('player_2":"A"')
  })

  it('hides answer/order/identity for a forfeited round even when revealed', () => {
    const forfeited = round({ humanAnswer: null, aiAnswer: 'AIの回答', answerOrder: null, isForfeit: true, winner: 'ai', votes: {} })
    const state = toPublicRoomState({ room: room('REVEAL', { round: forfeited }), viewerId: 'player_1' })

    expect(state.round).toMatchObject({ isRevealed: true, answerA: null, answerB: null, answerOrder: null, isForfeit: true, winner: 'ai' })
  })

  it('keeps history and mvp empty/null outside GAME_RESULT', () => {
    const historyEntry = {
      roundNumber: 1, challengerId: 'player_1', challengerName: 'たけし', prompt,
      humanAnswer: '人間の回答', aiAnswer: 'AIの回答', answerOrder: { A: 'human' as const, B: 'ai' as const },
      voteCounts: { A: 2, B: 0 }, winner: 'human' as const, isForfeit: false, wentToRevenge: false, revengeResult: null,
    }
    const state = toPublicRoomState({ room: room('ROUND_RESULT', { history: [historyEntry] }), viewerId: 'player_1' })
    expect(state.history).toEqual([])
    expect(state.mvp).toBeNull()
  })

  it('populates history and mvp once phase is GAME_RESULT', () => {
    const historyEntry = {
      roundNumber: 1, challengerId: 'player_1', challengerName: 'たけし', prompt,
      humanAnswer: '人間の回答', aiAnswer: 'AIの回答', answerOrder: { A: 'human' as const, B: 'ai' as const },
      voteCounts: { A: 2, B: 0 }, winner: 'human' as const, isForfeit: false, wentToRevenge: false, revengeResult: null,
    }
    const state = toPublicRoomState({ room: room('GAME_RESULT', { round: null, history: [historyEntry] }), viewerId: 'player_1' })
    expect(state.history).toEqual([historyEntry])
    expect(state.mvp).toEqual({ playerId: 'player_1', playerName: 'たけし', answer: '人間の回答', roundNumber: 1, voteCount: 2 })
  })

  it('returns round: null when there is no active round', () => {
    const state = toPublicRoomState({ room: room('LOBBY', { round: null }), viewerId: 'player_1' })
    expect(state.round).toBeNull()
  })
})
