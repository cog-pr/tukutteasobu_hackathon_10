import type { CreateRoomRequest, GetRoomRequest, JoinRoomRequest } from '../types/api'
import { validatePlayerName } from './playerName'
import { validateRoomCode } from './roomCode'
import type { ValidationResult } from './result'
const validateRequest = (input: unknown): ValidationResult<{ playerName: string }> => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { valid: false, message: 'リクエストの形式が正しくありません。' }
  const record = input as Record<string, unknown>
  if (Object.keys(record).length !== 1 || !('playerName' in record)) return { valid: false, message: 'リクエストの形式が正しくありません。' }
  const result = validatePlayerName(record.playerName)
  return result.valid ? { valid: true, value: { playerName: result.value } } : result
}
export const validateCreateRoomRequest = (input: unknown): ValidationResult<CreateRoomRequest> => validateRequest(input)
export const validateJoinRoomRequest = (input: unknown): ValidationResult<JoinRoomRequest> => validateRequest(input)
export const validateGetRoomRequest = (input: unknown): ValidationResult<GetRoomRequest> => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { valid: false, message: 'リクエストの形式が正しくありません。' }
  const record = input as Record<string, unknown>
  if (Object.keys(record).length !== 1 || !('roomCode' in record)) return { valid: false, message: 'リクエストの形式が正しくありません。' }
  const result = validateRoomCode(record.roomCode)
  return result.valid ? { valid: true, value: { roomCode: result.value } } : result
}
