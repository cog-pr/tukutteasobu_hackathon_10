import type { AnswerOrder, AnswerOwner, VoteChoice } from '../types/game'
import { countVotes } from './countVotes'

export type ResolveRoundWinnerInput = {
  votes: Record<string, VoteChoice>
  answerOrder: AnswerOrder
}

export type ResolveRoundWinnerResult = {
  countA: number
  countB: number
  winner: AnswerOwner
}

/** Translates an A/B vote tally into a human/ai winner. A tie goes to the human. */
export function resolveRoundWinner({ votes, answerOrder }: ResolveRoundWinnerInput): ResolveRoundWinnerResult {
  const { countA, countB, winner } = countVotes(votes)
  if (winner === 'draw') return { countA, countB, winner: 'human' }
  return { countA, countB, winner: winner === 'A' ? answerOrder.A : answerOrder.B }
}
