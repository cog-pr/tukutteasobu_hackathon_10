import type { ClientMessage } from '../types/messages'
import { validateAnswer } from './answer'
import type { ValidationResult } from './result'
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const exactKeys = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every((key) => key in value)
export function validateClientMessage(input: unknown): ValidationResult<ClientMessage> {
  if (!isRecord(input) || typeof input.type !== 'string') return { valid: false, message: '不正なWebSocketメッセージです。' }
  switch (input.type) {
    case 'READY': if (exactKeys(input, ['type', 'ready']) && typeof input.ready === 'boolean') return { valid: true, value: input as ClientMessage }; break
    case 'START_GAME': case 'PING': case 'REMATCH': if (exactKeys(input, ['type'])) return { valid: true, value: input as ClientMessage }; break
    case 'SUBMIT_ANSWER': if (exactKeys(input, ['type', 'answer']) && validateAnswer(input.answer).valid) return { valid: true, value: input as ClientMessage }; break
    case 'CAST_VOTE': if (exactKeys(input, ['type', 'choice']) && (input.choice === 'A' || input.choice === 'B')) return { valid: true, value: input as ClientMessage }; break
    case 'REVENGE_PROGRESS': if (exactKeys(input, ['type', 'value']) && typeof input.value === 'number' && Number.isFinite(input.value) && input.value >= 0) return { valid: true, value: input as ClientMessage }; break
    case 'REVENGE_RESULT': if (exactKeys(input, ['type', 'result']) && (input.result === 'success' || input.result === 'failure')) return { valid: true, value: input as ClientMessage }; break
  }
  return { valid: false, message: 'WebSocketメッセージの形式が正しくありません。' }
}
export const isClientMessage = (input: unknown): input is ClientMessage => validateClientMessage(input).valid
