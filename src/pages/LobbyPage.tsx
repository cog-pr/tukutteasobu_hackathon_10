import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { PlayerListItem } from '../components/PlayerListItem'
import { RoomCodeBadge } from '../components/RoomCodeBadge'
import { SegmentedControl } from '../components/SegmentedControl'
import { StatusBadge } from '../components/StatusBadge'
import { DUMMY_ROOM_CODE } from '../data/dummyData'
import { useLocalGame } from '../client/hooks/useLocalGame'

const MIN_PLAYERS = 4
const SELF_PLAYER_ID = 'player_1'

export function LobbyPage() {
  const navigate = useNavigate()
  const { state, actions } = useLocalGame()
  const [isSelfReady, setIsSelfReady] = useState(true)

  const players = state.players
  const maxPlayers = 4
  const onlineCount = players.filter((player) => player.isOnline).length
  const emptySlotCount = Math.max(0, maxPlayers - players.length)
  const allReady = players.every((player) => player.id === SELF_PLAYER_ID || !player.isOnline || player.isReady)
  const canStart = onlineCount >= MIN_PLAYERS && allReady && isSelfReady

  return (
    <PhoneScreen className="gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">ロビー</h1>
        <StatusBadge tone="success">接続中</StatusBadge>
      </div>

      <RoomCodeBadge roomCode={DUMMY_ROOM_CODE} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-700">参加者</h2>
          <span className="text-xs font-bold text-neutral-400">
            {'●'.repeat(players.length)}
            {'○'.repeat(emptySlotCount)} {players.length}/{maxPlayers}人
          </span>
        </div>
        <ul className="flex flex-col gap-2">
          {players.map((player) => (
            <PlayerListItem key={player.id} player={player} isSelf={player.id === SELF_PLAYER_ID} />
          ))}
          {Array.from({ length: emptySlotCount }).map((_, index) => (
            <li
              key={`empty-${index}`}
              className="rounded-xl border border-dashed border-neutral-300 px-3 py-2.5 text-center text-xs text-neutral-400"
            >
              参加者を待っています…
            </li>
          ))}
        </ul>
      </div>

      <Card>
        <p className="mb-2 text-sm font-bold text-neutral-700">自分の準備状態</p>
        <SegmentedControl
          value={isSelfReady ? 'ready' : 'waiting'}
          onChange={(value) => setIsSelfReady(value === 'ready')}
          options={[
            { value: 'ready', label: '準備OK' },
            { value: 'waiting', label: '待機中' },
          ]}
        />
      </Card>

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="primary" disabled={!canStart} onClick={async () => { await actions.startRound(); navigate('/round-intro') }}>
          ゲームを開始する（ホストのみ）
        </Button>
        <p className="text-center text-xs text-neutral-400">※4人以上・全員準備OKで開始できます</p>
      </div>
    </PhoneScreen>
  )
}
