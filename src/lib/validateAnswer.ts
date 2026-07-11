export type AnswerValidationResult =
  | { valid: true }
  | { valid: false; message: string }

const MAX_ANSWER_LENGTH = 60
const LINE_BREAK_PATTERN = /[\r\n\u2028\u2029]/u

/**
 * 大喜利の回答が文字数・空白・改行のルールを満たすか検証します。
 */
export function validateAnswer(answer: string): AnswerValidationResult {
  if (answer.length === 0) {
    return { valid: false, message: '回答を入力してください。' }
  }

  if (LINE_BREAK_PATTERN.test(answer)) {
    return { valid: false, message: '回答に改行は使用できません。' }
  }

  if (answer.trim().length === 0) {
    return { valid: false, message: '空白だけの回答は使用できません。' }
  }

  if (Array.from(answer).length > MAX_ANSWER_LENGTH) {
    return { valid: false, message: '回答は60文字以内で入力してください。' }
  }

  return { valid: true }
}
