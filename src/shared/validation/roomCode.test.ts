import { describe, expect, it } from 'vitest'
import { validateRoomCode } from './roomCode'
describe('validateRoomCode', () => {
  it('accepts a valid six-character code', () => expect(validateRoomCode('7KX4MR')).toEqual({ valid: true, value: '7KX4MR' }))
  it.each(['ABCDE', 'ABCDEFG'])('rejects an invalid length', (value) => expect(validateRoomCode(value).valid).toBe(false))
  it('trims and normalizes lowercase', () => expect(validateRoomCode(' 7kx4mr ')).toEqual({ valid: true, value: '7KX4MR' }))
  it('rejects symbols', () => expect(validateRoomCode('ABC!23').valid).toBe(false))
})
