import { GAME_CONFIG } from '../constants'
import type { ValidationResult } from './result'
const LINE_BREAK_PATTERN = /[\r\n\u2028\u2029]/u
export function validatePlayerName(name: unknown): ValidationResult<string> {
  if (typeof name !== 'string') return { valid: false, message: 'プレイヤー名は文字列で入力してください。' }
  if (LINE_BREAK_PATTERN.test(name)) return { valid: false, message: 'プレイヤー名に改行は使用できません。' }
  const value = name.trim()
  if (value.length === 0) return { valid: false, message: 'プレイヤー名を入力してください。' }
  if (Array.from(value).length > GAME_CONFIG.maxPlayerNameLength) return { valid: false, message: `プレイヤー名は${GAME_CONFIG.maxPlayerNameLength}文字以内で入力してください。` }
  return { valid: true, value }
}
