export type GamePhase = 'LOBBY' | 'ROUND_INTRO' | 'ANSWERING' | 'VOTING' | 'REVEAL' | 'REVENGE_ACTIVE' | 'ROUND_RESULT' | 'GAME_RESULT'
export type ChallengeType = 'rapid_tap' | 'shake' | 'smile' | 'color' | 'shout'
export type ChallengeResult = 'success' | 'failure'
export type ChallengeSupport = 'available' | 'granted' | 'unchecked' | 'unsupported'
export type VoteChoice = 'A' | 'B'
export type AnswerOwner = 'human' | 'ai'
export type Prompt = { id: string; type: 'text'; text: string; category: 'normal' | 'name' | 'fill' }
export type Player = { id: string; name: string; joinOrder: number; isHost: boolean; isOnline: boolean; isReady: boolean; supportedChallenges: ChallengeType[] }
export type Score = { human: number; ai: number }
export type AnswerOrder = { A: AnswerOwner; B: AnswerOwner }
export type RoundState = { roundNumber: number; challengerId: string; prompt: Prompt; humanAnswer: string | null; aiAnswer: string | null; answerOrder: AnswerOrder | null; votes: Record<string, VoteChoice>; winner: AnswerOwner | null; challengeType: ChallengeType | null; challengeResult: ChallengeResult | null; isForfeit: boolean; challengeProgress: number; challengeProgressUpdatedAt: number | null }
export type RoundHistoryEntry = { roundNumber: number; challengerId: string; challengerName: string; prompt: Prompt; humanAnswer: string | null; aiAnswer: string | null; answerOrder: AnswerOrder | null; voteCounts: { A: number; B: number }; winner: AnswerOwner; isForfeit: boolean; wentToRevenge: boolean; revengeResult: ChallengeResult | null }
export type RoomState = { version: number; roomCode: string; phase: GamePhase; players: Player[]; score: Score; round: RoundState | null; challengerQueue: string[]; usedPromptIds: string[]; deadlineAt: number | null; history: RoundHistoryEntry[]; createdAt: number; updatedAt: number }

// ---- Public (client-facing) projection: never includes playerToken, raw answers/votes before reveal, or per-player vote choices. ----

/** Round info visible before REVEAL: no A/B identity, no individual votes. answerA/B are populated only during VOTING (text only, order not revealed) — null in ROUND_INTRO/ANSWERING. */
export type PublicRoundStatePreReveal = { isRevealed: false; roundNumber: number; challengerId: string; prompt: Prompt; hasHumanAnswer: boolean; hasAiAnswer: boolean; hasVoted: boolean; answerA: string | null; answerB: string | null; challengeType: ChallengeType | null; challengeResult: ChallengeResult | null; challengeProgress: number }
/** Round info visible from REVEAL onward. Vote counts only — never who voted for what. answerA/B/answerOrder are null for a forfeited round. */
export type PublicRoundStateRevealed = { isRevealed: true; roundNumber: number; challengerId: string; challengerName: string; prompt: Prompt; answerA: string | null; answerB: string | null; answerOrder: AnswerOrder | null; voteCounts: { A: number; B: number }; winner: AnswerOwner; isForfeit: boolean; challengeType: ChallengeType | null; challengeResult: ChallengeResult | null; challengeProgress: number }
export type PublicRoundState = PublicRoundStatePreReveal | PublicRoundStateRevealed
export type MvpResult = { playerId: string; playerName: string; answer: string; roundNumber: number; voteCount: number } | null
/** history/mvp are only populated once phase is GAME_RESULT. */
export type PublicRoomState = { version: number; roomCode: string; phase: GamePhase; players: Player[]; score: Score; round: PublicRoundState | null; deadlineAt: number | null; history: RoundHistoryEntry[]; mvp: MvpResult; updatedAt: number }
