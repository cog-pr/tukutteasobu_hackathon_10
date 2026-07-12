export const GAME_CONFIG = {
  minPlayers: 4, maxPlayers: 4, winningScore: 3,
  answerTimeMs: 45_000, voteTimeMs: 20_000, roundResultMs: 5_000,
  maxPlayerNameLength: 10, maxAnswerLength: 60,
  aiTimeoutMs: 8_000, reconnectDelayMs: 2_000,
  roundIntroDwellMs: 3_000, revealDwellMs: 6_000,
} as const

export const CHALLENGE_CONFIG = { rapidTap: { durationMs: 5_000, requiredCount: 35, maxTapsPerSecond: 12 } } as const

/** Uppercase, visually unambiguous characters accepted in room codes. */
export const ROOM_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' as const
export const ROOM_CODE_LENGTH = 6
