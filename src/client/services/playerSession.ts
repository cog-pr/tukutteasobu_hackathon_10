import { validateRoomCode } from '../../shared/validation/roomCode'

export type PlayerSession = {
  roomCode: string
  playerId: string
  playerToken: string
}

export const PLAYER_SESSION_STORAGE_KEY = 'tukutteasobu.playerSession'

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const parsePlayerSession = (value: unknown): PlayerSession | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const roomCode = validateRoomCode(record.roomCode)
  if (
    !roomCode.valid ||
    typeof record.playerId !== 'string' ||
    record.playerId.length === 0 ||
    typeof record.playerToken !== 'string' ||
    record.playerToken.length === 0
  ) return null
  return { roomCode: roomCode.value, playerId: record.playerId, playerToken: record.playerToken }
}

export function savePlayerSession(session: PlayerSession): void {
  const validSession = parsePlayerSession(session)
  if (!validSession) return
  try {
    getStorage()?.setItem(PLAYER_SESSION_STORAGE_KEY, JSON.stringify(validSession))
  } catch {
    // Storage can be unavailable in private browsing, SSR, and restricted test environments.
  }
}

export function loadPlayerSession(): PlayerSession | null {
  const storage = getStorage()
  if (!storage) return null
  let serialized: string | null
  try {
    serialized = storage.getItem(PLAYER_SESSION_STORAGE_KEY)
  } catch {
    return null
  }
  if (serialized === null) return null
  try {
    return parsePlayerSession(JSON.parse(serialized))
  } catch {
    return null
  }
}

export function clearPlayerSession(): void {
  try {
    getStorage()?.removeItem(PLAYER_SESSION_STORAGE_KEY)
  } catch {
    // Clearing an unavailable storage is intentionally a no-op.
  }
}
