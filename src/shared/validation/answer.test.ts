import { describe, expect, it } from 'vitest'
import { validateAnswer } from './answer'
describe('validateAnswer', () => {
  it('accepts a normal answer', () => expect(validateAnswer('おもしろい回答').valid).toBe(true))
  it.each(['', '   '])('rejects empty input %#', (value) => expect(validateAnswer(value).valid).toBe(false))
  it('rejects line breaks', () => expect(validateAnswer('一行目\n二行目').valid).toBe(false))
  it('accepts 60 characters', () => expect(validateAnswer('あ'.repeat(60)).valid).toBe(true))
  it('rejects 61 characters', () => expect(validateAnswer('あ'.repeat(61)).valid).toBe(false))
  it('counts Unicode code points rather than UTF-16 units', () => expect(validateAnswer('😀'.repeat(60)).valid).toBe(true))
})
