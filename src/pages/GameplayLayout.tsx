import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ConnectionStatusBanner } from '../components/ConnectionStatusBanner'
import { PhoneScreen } from '../components/PhoneScreen'
import { RoomSocketProvider, useRoomSocketContext } from '../client/context/RoomSocketContext'
import { loadPlayerSession } from '../client/services/playerSession'
import { resolveGameplayRoute } from '../client/lib/gameplayRouting'

function PhaseRouteSync() {
  const { roomState, session } = useRoomSocketContext()
  const location = useLocation()
  const navigate = useNavigate()

  const isChallenger = roomState?.round?.challengerId === session?.playerId

  useEffect(() => {
    if (!roomState) return
    const target = resolveGameplayRoute({ phase: roomState.phase, isChallenger })
    if (location.pathname !== target) navigate(target, { replace: true })
  }, [roomState, isChallenger, location.pathname, navigate])

  return null
}

function GameplayShell() {
  const { roomState, connectionStatus, error, reconnect } = useRoomSocketContext()
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-[460px] p-2">
        <ConnectionStatusBanner connectionStatus={connectionStatus} error={error} onReconnect={reconnect} />
      </div>
      <PhaseRouteSync />
      {roomState ? (
        <Outlet />
      ) : (
        <PhoneScreen className="items-center justify-center text-center">
          <p className="text-sm text-neutral-500">サーバーに接続しています…</p>
        </PhoneScreen>
      )}
    </>
  )
}

/** Owns the shared room WebSocket connection and drives navigation from server-pushed phase changes. */
export function GameplayLayout() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!loadPlayerSession()) navigate('/', { replace: true, state: { message: '参加情報が見つかりません。ルームを作成または参加してください。' } })
  }, [navigate])

  if (!loadPlayerSession()) return null

  return (
    <RoomSocketProvider>
      <GameplayShell />
    </RoomSocketProvider>
  )
}
