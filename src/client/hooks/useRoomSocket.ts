import { useCallback, useEffect, useRef, useState } from 'react'
import { GAME_CONFIG } from '../../shared/constants'
import type { PublicRoomState } from '../../shared/types/game'
import { buildRoomSocketUrl, parseServerMessage, selectNewerRoomState } from '../services/roomSocket'
import { loadPlayerSession } from '../services/playerSession'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'
const MAX_RECONNECT_ATTEMPTS = 5

export function useRoomSocket() {
  const sessionRef = useRef(loadPlayerSession())
  const socketRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(true)
  const attemptsRef = useRef(0)
  const versionRef = useRef(-1)
  const [roomState, setRoomState] = useState<PublicRoomState | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(sessionRef.current ? 'connecting' : 'error')
  const [error, setError] = useState<string | null>(sessionRef.current ? null : '参加情報が見つかりません。ルームを作成または参加してください。')

  const connectRef = useRef<() => void>(() => {})
  connectRef.current = () => {
    const session = sessionRef.current
    if (!activeRef.current || !session) return
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    setConnectionStatus(attemptsRef.current ? 'reconnecting' : 'connecting')
    let socket: WebSocket
    try { socket = new WebSocket(buildRoomSocketUrl(session)) } catch {
      setConnectionStatus('error'); setError('WebSocket接続に失敗しました。'); return
    }
    socketRef.current = socket
    socket.onopen = () => { attemptsRef.current = 0; setConnectionStatus('connected'); setError(null) }
    socket.onmessage = (event) => {
      const message = parseServerMessage(event.data)
      if (!message) { setError('サーバーから不正なメッセージを受信しました。'); return }
      if (message.type === 'ERROR') { setError(message.message); return }
      if (message.type === 'STATE_SYNC' && message.state.version > versionRef.current) {
        versionRef.current = message.state.version
        setRoomState((current) => selectNewerRoomState(current, message.state))
      }
    }
    socket.onerror = () => setError('WebSocket接続に失敗しました。')
    socket.onclose = () => {
      if (socketRef.current === socket) socketRef.current = null
      if (!activeRef.current) return
      if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) { setConnectionStatus('disconnected'); setError('接続が切断されました。'); return }
      attemptsRef.current += 1
      setConnectionStatus('reconnecting')
      if (!timerRef.current) timerRef.current = setTimeout(() => { timerRef.current = null; connectRef.current() }, GAME_CONFIG.reconnectDelayMs)
    }
  }

  useEffect(() => {
    activeRef.current = true
    connectRef.current()
    return () => {
      activeRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = null
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [])

  const setReady = useCallback((ready: boolean) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) { setError('接続されていません。'); return }
    socketRef.current.send(JSON.stringify({ type: 'READY', ready }))
  }, [])
  const reconnect = useCallback(() => {
    attemptsRef.current = 0
    socketRef.current?.close()
    if (!socketRef.current) connectRef.current()
  }, [])

  return { roomState, connectionStatus, error, setReady, reconnect, session: sessionRef.current }
}
