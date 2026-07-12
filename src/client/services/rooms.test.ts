import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from './apiClient'
import { createRoom, getRoom, joinRoom } from './rooms'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('rooms API client', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('sends a create-room request and returns the shared response shape', async () => {
    const response = { roomCode: 'AB37X2', playerId: 'player-1', playerToken: 'secret' }
    fetchMock.mockResolvedValue(jsonResponse(response))

    await expect(createRoom({ playerName: ' たなか ' })).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ playerName: 'たなか' }),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    })
  })

  it('normalizes the room code in a join-room request', async () => {
    const response = { roomCode: 'AB37X2', playerId: 'player-2', playerToken: 'secret' }
    fetchMock.mockResolvedValue(jsonResponse(response))

    await expect(joinRoom(' ab37x2 ', { playerName: 'さとう' })).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/rooms/AB37X2/join', {
      method: 'POST',
      body: JSON.stringify({ playerName: 'さとう' }),
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    })
  })

  it('gets room information without a Content-Type request header', async () => {
    const response = { exists: true, canJoin: true, playerCount: 2, hasStarted: false }
    fetchMock.mockResolvedValue(jsonResponse(response))

    await expect(getRoom('ab37x2')).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/rooms/AB37X2', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  })

  it('maps an API error to a displayable error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: 'ROOM_FULL', message: 'internal detail' }, 409))

    await expect(joinRoom('AB37X2', { playerName: 'さとう' })).rejects.toMatchObject({
      code: 'ROOM_FULL',
      message: 'このルームは満員です。',
    })
  })

  it('distinguishes a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('failed to fetch'))

    await expect(getRoom('AB37X2')).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
  })

  it('rejects a non-JSON response', async () => {
    fetchMock.mockResolvedValue(new Response('bad gateway', { status: 502 }))

    await expect(getRoom('AB37X2')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('rejects malformed success JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ exists: 'yes' }))

    await expect(getRoom('AB37X2')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('does not send an invalid room code', async () => {
    const promise = joinRoom('O0I1XX', { playerName: 'さとう' })

    await expect(promise).rejects.toBeInstanceOf(ApiClientError)
    await expect(promise).rejects.toMatchObject({ code: 'INVALID_ROOM_CODE' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
