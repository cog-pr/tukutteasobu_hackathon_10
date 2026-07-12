import type { AnswerOrder, MvpResult, RoundHistoryEntry } from '../types/game'

export type SelectMvpInput = {
  history: readonly RoundHistoryEntry[]
}

function humanVoteCount(entry: RoundHistoryEntry, answerOrder: AnswerOrder): number {
  return answerOrder.A === 'human' ? entry.voteCounts.A : entry.voteCounts.B
}

function isBetter(candidate: RoundHistoryEntry, candidateVotes: number, current: RoundHistoryEntry, currentVotes: number): boolean {
  if (candidateVotes !== currentVotes) return candidateVotes > currentVotes
  if (candidate.roundNumber !== current.roundNumber) return candidate.roundNumber < current.roundNumber
  return candidate.challengerId < current.challengerId
}

/**
 * Picks the human answer with the most votes across the game.
 * Ties go to the earlier round, then to the lexicographically smaller challenger id.
 * Forfeited rounds (no human answer) are never eligible.
 */
export function selectMvp({ history }: SelectMvpInput): MvpResult {
  let best: { entry: RoundHistoryEntry; voteCount: number } | null = null

  for (const entry of history) {
    if (entry.humanAnswer === null || entry.answerOrder === null) continue
    const voteCount = humanVoteCount(entry, entry.answerOrder)
    if (best === null || isBetter(entry, voteCount, best.entry, best.voteCount)) {
      best = { entry, voteCount }
    }
  }

  if (!best) return null
  return {
    playerId: best.entry.challengerId,
    playerName: best.entry.challengerName,
    answer: best.entry.humanAnswer as string,
    roundNumber: best.entry.roundNumber,
    voteCount: best.voteCount,
  }
}
