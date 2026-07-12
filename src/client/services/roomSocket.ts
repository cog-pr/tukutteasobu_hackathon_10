import type { PublicRoomState } from '../../shared/types/game'
import type { ServerMessage } from '../../shared/types/messages'
import type { PlayerSession } from './playerSession'

export function buildRoomSocketUrl(session: PlayerSession, baseUrl?: string): string {
  const configuredBase = baseUrl ?? import.meta.env.VITE_API_BASE_URL ?? window.location.origin
  const url = new URL(`/api/rooms/${encodeURIComponent(session.roomCode)}/ws`, configuredBase)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('playerId', session.playerId)
  url.searchParams.set('playerToken', session.playerToken)
  return url.toString()
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

export function parseServerMessage(data: unknown): ServerMessage | null {
  let value: unknown
  try { value = typeof data === 'string' ? JSON.parse(data) : data } catch { return null }
  if (!isRecord(value) || typeof value.type !== 'string') return null
  if (value.type === 'PONG') return { type: 'PONG' }
  if (value.type === 'ERROR' && typeof value.code === 'string' && typeof value.message === 'string') return value as ServerMessage
  if (value.type === 'STATE_SYNC' && isRecord(value.state) && typeof value.state.version === 'number' && typeof value.state.roomCode === 'string' && Array.isArray(value.state.players)) return value as { type: 'STATE_SYNC'; state: PublicRoomState }
  return null
}

export function selectNewerRoomState(current: PublicRoomState | null, incoming: PublicRoomState): PublicRoomState {
  return current && current.version >= incoming.version ? current : incoming
}
