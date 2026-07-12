import { Card } from './Card'
import { StatusBadge } from './StatusBadge'
import type { ConnectionStatus, RoomSocketError } from '../client/hooks/useRoomSocket'

type ConnectionStatusBannerProps = {
  connectionStatus: ConnectionStatus
  error: RoomSocketError | null
  onReconnect: () => void
}

const statusPresentation: Record<ConnectionStatus, { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' | 'info' }> = {
  connecting: { label: '接続中', tone: 'info' },
  connected: { label: '接続中', tone: 'success' },
  reconnecting: { label: '再接続中', tone: 'warning' },
  disconnected: { label: '切断', tone: 'neutral' },
  error: { label: '接続エラー', tone: 'danger' },
}

/** Shared connection/error banner shown above every gameplay screen so no page needs its own copy. */
export function ConnectionStatusBanner({ connectionStatus, error, onReconnect }: ConnectionStatusBannerProps) {
  const status = statusPresentation[connectionStatus]
  const canReconnect = connectionStatus === 'disconnected' || connectionStatus === 'error'
  // INVALID_MESSAGE covers expected transient rejections (e.g. rapid-tap rate limiting) that pages handle inline; don't surface them globally.
  const visibleError = error && error.code !== 'INVALID_MESSAGE' ? error : null
  return (
    <div className="flex flex-col gap-2">
      {connectionStatus !== 'connected' && (
        <div className="flex items-center justify-between">
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        </div>
      )}
      {visibleError && (
        <Card className="text-sm text-rose-600">
          <p>{visibleError.message}</p>
          {canReconnect && (
            <button type="button" className="mt-2 font-bold underline" onClick={onReconnect}>
              再接続する
            </button>
          )}
        </Card>
      )}
    </div>
  )
}
