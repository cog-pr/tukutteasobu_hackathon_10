import { describe, expect, it } from 'vitest'
import { validateClientMessage } from './clientMessage'
describe('validateClientMessage', () => {
  it.each([
    { type: 'READY', ready: true }, { type: 'START_GAME' }, { type: 'SUBMIT_ANSWER', answer: '回答' },
    { type: 'CAST_VOTE', choice: 'A' }, { type: 'REVENGE_PROGRESS', value: 10 },
    { type: 'REVENGE_RESULT', result: 'success' }, { type: 'REMATCH' }, { type: 'PING' },
  ])('accepts $type', (message) => expect(validateClientMessage(message).valid).toBe(true))
  it('rejects an unknown type', () => expect(validateClientMessage({ type: 'UNKNOWN' }).valid).toBe(false))
  it('rejects a missing required property', () => expect(validateClientMessage({ type: 'READY' }).valid).toBe(false))
  it('rejects an invalid vote choice', () => expect(validateClientMessage({ type: 'CAST_VOTE', choice: 'C' }).valid).toBe(false))
  it('rejects an invalid answer', () => expect(validateClientMessage({ type: 'SUBMIT_ANSWER', answer: '   ' }).valid).toBe(false))
})
