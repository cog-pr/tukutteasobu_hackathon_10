import { describe, expect, it } from 'vitest'
import { validateCreateRoomRequest, validateGetRoomRequest, validateJoinRoomRequest } from './api'
describe('HTTP request validation', () => {
  it('normalizes a create-room player name', () => expect(validateCreateRoomRequest({ playerName: ' タナカ ' })).toEqual({ valid: true, value: { playerName: 'タナカ' } }))
  it('rejects an invalid join-room player name', () => expect(validateJoinRoomRequest({ playerName: '' }).valid).toBe(false))
  it('normalizes a room lookup code', () => expect(validateGetRoomRequest({ roomCode: '7kx4mr' })).toEqual({ valid: true, value: { roomCode: '7KX4MR' } }))
  it('rejects missing and extra properties', () => {
    expect(validateCreateRoomRequest({}).valid).toBe(false)
    expect(validateCreateRoomRequest({ playerName: '田中', admin: true }).valid).toBe(false)
  })
})
