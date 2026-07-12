import { GAME_CONFIG } from '../constants'
import type { ValidationResult } from './result'
const LINE_BREAK_PATTERN = /[\r\n\u2028\u2029]/u
export function validateAnswer(answer: unknown): ValidationResult<string> {
  if (typeof answer !== 'string') return { valid: false, message: '回答は文字列で入力してください。' }
  if (LINE_BREAK_PATTERN.test(answer)) return { valid: false, message: '回答に改行は使用できません。' }
  if (answer.trim().length === 0) return { valid: false, message: '回答を入力してください。' }
  if (Array.from(answer).length > GAME_CONFIG.maxAnswerLength) return { valid: false, message: `回答は${GAME_CONFIG.maxAnswerLength}文字以内で入力してください。` }
  return { valid: true, value: answer }
}
