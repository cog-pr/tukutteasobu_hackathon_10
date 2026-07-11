import { assignAnswerOrder, type AnswerOrder } from '../../shared/game/assignAnswerOrder'
import { countVotes, type VoteChoice } from '../../shared/game/countVotes'
import { getGameResult, type Score } from '../../shared/game/getGameResult'
import { selectNextChallenger } from '../../shared/game/selectNextChallenger'
import { prompts } from '../../data/prompts'
import type { Player, RoundHistoryEntry } from '../../types/game'
import type { Prompt } from '../../types/prompt'
import { generateAiAnswer } from '../services/ai'

export type GamePhase = 'LOBBY' | 'ROUND_INTRO' | 'ANSWERING' | 'VOTING' | 'REVEAL' | 'REVENGE_ACTIVE' | 'ROUND_RESULT' | 'GAME_RESULT'
export type LocalRound = { prompt: Prompt; challengerId: string; humanAnswer: string; aiAnswer: string; answerOrder: AnswerOrder; votes: Record<string, VoteChoice>; winner: 'human' | 'ai' | null; humanForfeit: boolean }
export type LocalGameState = { players: Player[]; score: Score; roundNumber: number; usedPromptIds: string[]; challengerQueue: string[]; previousChallengerId: string | null; round: LocalRound | null; phase: GamePhase; deadlineAt: number | null; history: RoundHistoryEntry[] }

const initialState = (): LocalGameState => ({ players: [], score: { human: 0, ai: 0 }, roundNumber: 0, usedPromptIds: [], challengerQueue: [], previousChallengerId: null, round: null, phase: 'LOBBY', deadlineAt: null, history: [] })
let state = initialState()
const listeners = new Set<() => void>()
const set = (next: LocalGameState) => { state = next; listeners.forEach((listener) => listener()) }

export const localGameStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener) },
  createPlayers(name: string) {
    const names = [name.trim(), 'サトウ', 'タナカ', 'ヤマダ']
    set({ ...initialState(), players: names.map((playerName, index) => ({ id: `player_${index + 1}`, name: playerName, joinOrder: index, isHost: index === 0, isOnline: true, isReady: true, supportedChallenges: ['rapid_tap'] })) })
  },
  async startRound() {
    const result = selectNextChallenger({ players: state.players, challengerQueue: state.challengerQueue, previousChallengerId: state.previousChallengerId })
    let used = state.usedPromptIds
    let available = prompts.filter((prompt) => !used.includes(prompt.id))
    if (!available.length) { used = []; available = prompts }
    const prompt = available[Math.floor(Math.random() * available.length)]
    const aiAnswer = await generateAiAnswer(prompt.id)
    set({ ...state, roundNumber: state.roundNumber + 1, usedPromptIds: [...used, prompt.id], challengerQueue: result.challengerQueue, previousChallengerId: result.nextChallengerId, phase: 'ROUND_INTRO', deadlineAt: null, round: { prompt, challengerId: result.nextChallengerId!, humanAnswer: '', aiAnswer, answerOrder: assignAnswerOrder(), votes: {}, winner: null, humanForfeit: false } })
  },
  beginAnswering() { set({ ...state, phase: 'ANSWERING', deadlineAt: Date.now() + 45_000 }) },
  submitAnswer(answer: string) { if (!state.round || state.round.humanAnswer) return; set({ ...state, phase: 'VOTING', deadlineAt: Date.now() + 20_000, round: { ...state.round, humanAnswer: answer } }) },
  forfeitAnswer() { if (!state.round) return; set({ ...state, phase: 'REVEAL', deadlineAt: null, round: { ...state.round, humanForfeit: true, winner: 'ai' } }) },
  vote(playerId: string, choice: VoteChoice) { if (!state.round || state.round.votes[playerId]) return; const votes = { ...state.round.votes, [playerId]: choice }; const done = Object.keys(votes).length === state.players.length - 1; if (!done) { set({ ...state, deadlineAt: Date.now() + 20_000, round: { ...state.round, votes } }); return } const result = countVotes(votes); const letter = result.winner === 'draw' ? 'A' : result.winner; set({ ...state, phase: 'REVEAL', deadlineAt: null, round: { ...state.round, votes, winner: state.round.answerOrder[letter] } }) },
  beginRevenge() { set({ ...state, phase: 'REVENGE_ACTIVE', deadlineAt: Date.now() + 5_000 }) },
  finishRound(humanGetsPoint: boolean, wentToRevenge: boolean) { if (!state.round) return; const winner: 'human' | 'ai' = humanGetsPoint ? 'human' : 'ai'; const score = { ...state.score, [winner]: state.score[winner] + 1 }; const challengerName = state.players.find((player) => player.id === state.round!.challengerId)?.name ?? ''; const history: RoundHistoryEntry[] = [...state.history, { roundNumber: state.roundNumber, challengerName, winner, wentToRevenge }]; set({ ...state, score, history, phase: getGameResult(score).finished ? 'GAME_RESULT' : 'ROUND_RESULT', deadlineAt: null }) },
  replay() { set({ ...initialState(), players: state.players }) },
  reset() { set(initialState()) },
}
