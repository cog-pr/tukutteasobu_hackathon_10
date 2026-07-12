import { describe, expect, it } from 'vitest'
import { buildRoomSocketUrl, parseServerMessage, selectNewerRoomState } from './roomSocket'
describe('room socket service', () => {
  it('builds an authenticated websocket URL from a saved session', () => {
    const url = new URL(buildRoomSocketUrl({ roomCode: 'AB37X2', playerId: 'player-1', playerToken: 'secret token' }, 'https://example.test'))
    expect(url.protocol).toBe('wss:'); expect(url.pathname).toBe('/api/rooms/AB37X2/ws'); expect(url.searchParams.get('playerId')).toBe('player-1'); expect(url.searchParams.get('playerToken')).toBe('secret token')
  })
  it('accepts state sync and rejects malformed server messages', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'STATE_SYNC', state: { version: 2, roomCode: 'AB37X2', players: [] } }))).toMatchObject({ type: 'STATE_SYNC', state: { version: 2 } })
    expect(parseServerMessage('{bad')).toBeNull(); expect(parseServerMessage(JSON.stringify({ type: 'STATE_SYNC', state: { version: '2' } }))).toBeNull()
  })
  it('discards an older or duplicate state version', () => {
    const current = { version: 3, roomCode: 'AB37X2', players: [] } as never
    const older = { version: 2, roomCode: 'AB37X2', players: [] } as never
    expect(selectNewerRoomState(current, older)).toBe(current)
  })
})
