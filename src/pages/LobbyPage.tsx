import { useEffect, useState } from 'react'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { PlayerListItem } from '../components/PlayerListItem'
import { RoomCodeBadge } from '../components/RoomCodeBadge'
import { SegmentedControl } from '../components/SegmentedControl'
import { GAME_CONFIG } from '../shared/constants'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { Button } from '../components/Button'

export function LobbyPage() {
  const { roomState, connectionStatus, error, setReady, startGame, session } = useRoomSocketContext()
  const [pendingReady, setPendingReady] = useState<boolean | null>(null)
  const players = roomState?.players ?? []
  const self = players.find((player) => player.id === session?.playerId)
  useEffect(() => { if (self && pendingReady === self.isReady) setPendingReady(null) }, [pendingReady, self])
  if (!session) return null
  const emptySlotCount = Math.max(0, GAME_CONFIG.maxPlayers - players.length)
  const startConditionsMet = Boolean(self?.isHost && players.length === GAME_CONFIG.maxPlayers && players.every((player) => player.isOnline && player.isReady))
  return (
    <PhoneScreen className="gap-4">
      <h1 className="text-lg font-bold text-neutral-900">ロビー</h1>
      <RoomCodeBadge roomCode={roomState?.roomCode ?? session.roomCode} />
      <div>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold text-neutral-700">参加者</h2><span className="text-xs font-bold text-neutral-400">{players.length}/{GAME_CONFIG.maxPlayers}人（空き{emptySlotCount}）</span></div>
        <ul className="flex flex-col gap-2">
          {players.map((player) => <PlayerListItem key={player.id} player={player} isSelf={player.id === session.playerId} />)}
          {Array.from({ length: emptySlotCount }).map((_, index) => <li key={`empty-${index}`} className="rounded-xl border border-dashed border-neutral-300 px-3 py-2.5 text-center text-xs text-neutral-400">参加者を待っています…</li>)}
        </ul>
      </div>
      {self && <Card><p className="mb-2 text-sm font-bold text-neutral-700">自分の準備状態 {pendingReady !== null && <span className="text-xs text-neutral-400">（送信中）</span>}</p><SegmentedControl value={(pendingReady ?? self.isReady) ? 'ready' : 'waiting'} onChange={(value) => { const ready = value === 'ready'; setPendingReady(ready); setReady(ready) }} options={[{ value: 'ready', label: '準備OK' }, { value: 'waiting', label: '待機中' }]} /></Card>}
      <div className="mt-auto flex flex-col gap-3">
        {self?.isHost && <Button variant="primary" disabled={!startConditionsMet || connectionStatus !== 'connected'} onClick={startGame}>ゲームを開始する</Button>}
        {!self?.isHost && <p className="text-center text-xs text-neutral-400">ホストがゲームを開始するのを待っています…</p>}
        {self?.isHost && <p className="text-center text-xs text-neutral-400">{startConditionsMet ? '開始条件を満たしました。' : 'ホスト・4人参加・全員オンライン・全員準備OKで開始できます。'}</p>}
        {error?.code && <p className="text-center text-xs text-rose-500">{error.message}</p>}
      </div>
    </PhoneScreen>
  )
}
