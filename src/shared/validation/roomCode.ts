import { ROOM_CODE_CHARACTERS, ROOM_CODE_LENGTH } from '../constants'
import type { ValidationResult } from './result'
const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_CHARACTERS}]{${ROOM_CODE_LENGTH}}$`)
export function validateRoomCode(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') return { valid: false, message: 'ルームコードは文字列で入力してください。' }
  const value = input.trim().toUpperCase()
  if (value.length !== ROOM_CODE_LENGTH) return { valid: false, message: `ルームコードは${ROOM_CODE_LENGTH}文字で入力してください。` }
  if (!ROOM_CODE_PATTERN.test(value)) return { valid: false, message: `使用できる文字は ${ROOM_CODE_CHARACTERS} です。` }
  return { valid: true, value }
}
