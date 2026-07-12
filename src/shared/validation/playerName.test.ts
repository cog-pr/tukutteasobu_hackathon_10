import { describe, expect, it } from 'vitest'
import { validatePlayerName } from './playerName'
describe('validatePlayerName', () => {
  it('accepts a normal name and trims surrounding spaces', () => expect(validatePlayerName('  タナカ  ')).toEqual({ valid: true, value: 'タナカ' }))
  it.each(['', '   '])('rejects empty input %#', (value) => expect(validatePlayerName(value).valid).toBe(false))
  it('rejects line breaks', () => expect(validatePlayerName('田中\n太郎').valid).toBe(false))
  it('accepts 10 characters', () => expect(validatePlayerName('あ'.repeat(10)).valid).toBe(true))
  it('rejects 11 characters', () => expect(validatePlayerName('あ'.repeat(11)).valid).toBe(false))
})
