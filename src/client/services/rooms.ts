import type {
  CreateRoomRequest,
  CreateRoomResponse,
  GetRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
} from '../../shared/types/api'
import { validateCreateRoomRequest, validateJoinRoomRequest } from '../../shared/validation/api'
import { validateRoomCode } from '../../shared/validation/roomCode'
import { ApiClientError, requestJson } from './apiClient'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isRoomSessionResponse = (value: unknown): value is CreateRoomResponse =>
  isRecord(value) &&
  typeof value.roomCode === 'string' &&
  validateRoomCode(value.roomCode).valid &&
  typeof value.playerId === 'string' &&
  value.playerId.length > 0 &&
  typeof value.playerToken === 'string' &&
  value.playerToken.length > 0

const isGetRoomResponse = (value: unknown): value is GetRoomResponse =>
  isRecord(value) &&
  typeof value.exists === 'boolean' &&
  typeof value.canJoin === 'boolean' &&
  typeof value.playerCount === 'number' &&
  Number.isInteger(value.playerCount) &&
  value.playerCount >= 0 &&
  typeof value.hasStarted === 'boolean'

function requireRoomCode(roomCode: string): string {
  const result = validateRoomCode(roomCode)
  if (!result.valid) throw new ApiClientError('INVALID_ROOM_CODE')
  return result.value
}

export function createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
  const result = validateCreateRoomRequest(request)
  if (!result.valid) return Promise.reject(new ApiClientError('INVALID_REQUEST'))
  return requestJson('/api/rooms', { method: 'POST', body: JSON.stringify(result.value) }, isRoomSessionResponse)
}

export function joinRoom(roomCode: string, request: JoinRoomRequest): Promise<JoinRoomResponse> {
  let normalizedRoomCode: string
  try {
    normalizedRoomCode = requireRoomCode(roomCode)
  } catch (error) {
    return Promise.reject(error)
  }
  const result = validateJoinRoomRequest(request)
  if (!result.valid) return Promise.reject(new ApiClientError('INVALID_REQUEST'))
  return requestJson(
    `/api/rooms/${encodeURIComponent(normalizedRoomCode)}/join`,
    { method: 'POST', body: JSON.stringify(result.value) },
    isRoomSessionResponse,
  )
}

export function getRoom(roomCode: string): Promise<GetRoomResponse> {
  let normalizedRoomCode: string
  try {
    normalizedRoomCode = requireRoomCode(roomCode)
  } catch (error) {
    return Promise.reject(error)
  }
  return requestJson(
    `/api/rooms/${encodeURIComponent(normalizedRoomCode)}`,
    { method: 'GET' },
    isGetRoomResponse,
  )
}
