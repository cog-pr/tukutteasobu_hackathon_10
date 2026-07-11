import type { Player } from '../types/game'
import { Avatar } from './Avatar'
import { StatusBadge } from './StatusBadge'

type PlayerListItemProps = {
  player: Player
  isSelf?: boolean
}

export function PlayerListItem({ player, isSelf = false }: PlayerListItemProps) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Avatar name={player.name} />
        <span className="font-bold text-neutral-900">{player.name}</span>
        {isSelf && <span className="text-xs text-neutral-400">（あなた）</span>}
        {player.isHost && <StatusBadge tone="dark">ホスト</StatusBadge>}
      </div>
      <StatusBadge tone={player.isOnline && player.isReady ? 'success' : 'neutral'}>
        {player.isOnline ? (player.isReady ? '準備OK' : '待機中') : 'オフライン'}
      </StatusBadge>
    </li>
  )
}
