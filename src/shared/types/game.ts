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
export type RoundState = { roundNumber: number; challengerId: string; prompt: Prompt; humanAnswer: string | null; aiAnswer: string | null; answerOrder: AnswerOrder | null; votes: Record<string, VoteChoice>; winner: AnswerOwner | null; challengeType: ChallengeType | null; challengeResult: ChallengeResult | null }
export type RoomState = { version: number; roomCode: string; phase: GamePhase; players: Player[]; score: Score; round: RoundState | null; challengerQueue: string[]; usedPromptIds: string[]; deadlineAt: number | null; createdAt: number; updatedAt: number }
/** RoomState contains no credentials or server-private fields, so its public projection is identical. */
export type PublicRoomState = RoomState
export type RoundHistoryEntry = { roundNumber: number; challengerName: string; winner: AnswerOwner; wentToRevenge: boolean }
