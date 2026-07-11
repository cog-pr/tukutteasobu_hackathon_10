import type { Score } from '../shared/game/getGameResult'
import type { Player, RoundHistoryEntry } from '../types/game'

export const DUMMY_ROOM_CODE = 'AB37X2'

export const DUMMY_PLAYERS: Player[] = [
  {
    id: 'player_1',
    name: 'たけし',
    joinOrder: 0,
    isHost: true,
    isOnline: true,
    isReady: true,
    supportedChallenges: ['rapid_tap', 'shake'],
  },
  {
    id: 'player_2',
    name: 'サトウ',
    joinOrder: 1,
    isHost: false,
    isOnline: true,
    isReady: true,
    supportedChallenges: ['rapid_tap', 'shake'],
  },
  {
    id: 'player_3',
    name: 'タナカ',
    joinOrder: 2,
    isHost: false,
    isOnline: true,
    isReady: false,
    supportedChallenges: ['rapid_tap'],
  },
  {
    id: 'player_4',
    name: 'ヤマダ',
    joinOrder: 3,
    isHost: false,
    isOnline: false,
    isReady: false,
    supportedChallenges: ['rapid_tap'],
  },
]

export const DUMMY_MAX_PLAYERS = 5

export const DUMMY_SCORE: Score = { human: 2, ai: 1 }

export const DUMMY_ROUND_NUMBER = 3

export const DUMMY_CHALLENGER_NAME = 'たけし'

export const DUMMY_PROMPT = '絶対に行きたくないコンビニ。その特徴とは？'

export const DUMMY_ANSWER_A = '24時間ずっと閉店している'
export const DUMMY_ANSWER_B = '店員が全員ラスボス'

export const DUMMY_ANSWER_ORDER: { A: 'human' | 'ai'; B: 'human' | 'ai' } = {
  A: 'human',
  B: 'ai',
}

export const DUMMY_VOTE_COUNT = { A: 1, B: 2 }

export const DUMMY_ROUND_HISTORY: RoundHistoryEntry[] = [
  { roundNumber: 1, challengerName: 'サトウ', winner: 'human', wentToRevenge: false },
  { roundNumber: 2, challengerName: 'タナカ', winner: 'ai', wentToRevenge: true },
  { roundNumber: 3, challengerName: 'たけし', winner: 'ai', wentToRevenge: true },
]

export const DUMMY_MVP_ANSWER = {
  playerName: 'サトウ',
  text: '24時間ずっと閉店している',
  votes: 3,
}
