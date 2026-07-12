import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearPlayerSession,
  loadPlayerSession,
  PLAYER_SESSION_STORAGE_KEY,
  savePlayerSession,
  type PlayerSession,
} from './playerSession'

const session: PlayerSession = {
  roomCode: 'AB37X2',
  playerId: 'player-1',
  playerToken: 'secret-token',
}

function useStorage(storage: Partial<Storage>) {
  vi.stubGlobal('window', { localStorage: storage })
}

describe('player session', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('saves and loads a session while normalizing its room code', () => {
    const values = new Map<string, string>()
    useStorage({
      setItem: (key, value) => values.set(key, value),
      getItem: (key) => values.get(key) ?? null,
    })

    savePlayerSession({ ...session, roomCode: ' ab37x2 ' })

    expect(loadPlayerSession()).toEqual(session)
    expect(JSON.parse(values.get(PLAYER_SESSION_STORAGE_KEY)!)).toEqual(session)
  })

  it('clears a saved session', () => {
    const removeItem = vi.fn()
    useStorage({ removeItem })

    clearPlayerSession()

    expect(removeItem).toHaveBeenCalledWith(PLAYER_SESSION_STORAGE_KEY)
  })

  it('safely discards invalid JSON', () => {
    useStorage({ getItem: () => '{invalid' })
    expect(loadPlayerSession()).toBeNull()
  })

  it('discards data with missing required fields', () => {
    useStorage({ getItem: () => JSON.stringify({ roomCode: 'AB37X2', playerId: 'player-1' }) })
    expect(loadPlayerSession()).toBeNull()
  })

  it('does not crash when window is unavailable', () => {
    vi.stubGlobal('window', undefined)
    expect(() => savePlayerSession(session)).not.toThrow()
    expect(loadPlayerSession()).toBeNull()
    expect(() => clearPlayerSession()).not.toThrow()
  })

  it('does not crash when localStorage access fails', () => {
    const unavailableWindow = Object.defineProperty({}, 'localStorage', {
      get: () => { throw new Error('denied') },
    })
    vi.stubGlobal('window', unavailableWindow)

    expect(() => savePlayerSession(session)).not.toThrow()
    expect(loadPlayerSession()).toBeNull()
    expect(() => clearPlayerSession()).not.toThrow()
  })
})
