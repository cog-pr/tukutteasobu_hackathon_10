import type { PublicRoomState, PublicRoundState, RoomState, RoundState } from '../types/game'
import { countVotes } from './countVotes'
import { selectMvp } from './selectMvp'

export type ToPublicRoomStateInput = {
  room: RoomState
  /** The socket's own playerId, needed for viewer-relative fields like hasVoted. */
  viewerId: string
}

const PRE_REVEAL_PHASES = new Set(['ROUND_INTRO', 'ANSWERING', 'VOTING'])

function toPublicRound(room: RoomState, round: RoundState, viewerId: string): PublicRoundState {
  if (PRE_REVEAL_PHASES.has(room.phase)) {
    const showAnswers = room.phase === 'VOTING' && round.answerOrder !== null
    const answerA = showAnswers ? (round.answerOrder!.A === 'human' ? round.humanAnswer : round.aiAnswer) : null
    const answerB = showAnswers ? (round.answerOrder!.B === 'human' ? round.humanAnswer : round.aiAnswer) : null

    return {
      isRevealed: false,
      roundNumber: round.roundNumber,
      challengerId: round.challengerId,
      prompt: round.prompt,
      hasHumanAnswer: round.humanAnswer !== null,
      hasAiAnswer: round.aiAnswer !== null,
      hasVoted: viewerId in round.votes,
      answerA,
      answerB,
      challengeType: round.challengeType,
      challengeResult: round.challengeResult,
      challengeProgress: round.challengeProgress,
    }
  }

  const challengerName = room.players.find((player) => player.id === round.challengerId)?.name ?? ''
  const { countA, countB } = countVotes(round.votes)
  const answerOrder = round.isForfeit ? null : round.answerOrder
  const answerA = answerOrder ? (answerOrder.A === 'human' ? round.humanAnswer : round.aiAnswer) : null
  const answerB = answerOrder ? (answerOrder.B === 'human' ? round.humanAnswer : round.aiAnswer) : null

  return {
    isRevealed: true,
    roundNumber: round.roundNumber,
    challengerId: round.challengerId,
    challengerName,
    prompt: round.prompt,
    answerA,
    answerB,
    answerOrder,
    voteCounts: { A: countA, B: countB },
    winner: round.winner ?? 'ai',
    isForfeit: round.isForfeit,
    challengeType: round.challengeType,
    challengeResult: round.challengeResult,
    challengeProgress: round.challengeProgress,
  }
}

/** Builds the per-viewer public projection of a RoomState, redacting round secrets until REVEAL. */
export function toPublicRoomState({ room, viewerId }: ToPublicRoomStateInput): PublicRoomState {
  const isGameResult = room.phase === 'GAME_RESULT'

  return {
    version: room.version,
    roomCode: room.roomCode,
    phase: room.phase,
    players: room.players,
    score: room.score,
    round: room.round ? toPublicRound(room, room.round, viewerId) : null,
    deadlineAt: room.deadlineAt,
    history: isGameResult ? room.history : [],
    mvp: isGameResult ? selectMvp({ history: room.history }) : null,
    updatedAt: room.updatedAt,
  }
}
