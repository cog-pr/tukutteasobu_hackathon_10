import type { Player } from '../types/game'
import { Avatar } from './Avatar'
import { StatusBadge } from './StatusBadge'

type PlayerListItemProps = {
  player: Player
  isSelf?: boolean
}

export function PlayerListItem({ player, isSelf = false }: PlayerListItemProps) {
  return (
    <li className="flex items-center justify-between rounded-[13px] border border-[#e2ddd4] bg-white px-3 py-2.5 shadow-[0_2px_0_rgba(37,36,32,0.05)]">
      <div className="flex items-center gap-2">
        <Avatar name={player.name} />
        <span className="font-black text-[#17191f]">{player.name}</span>
        {isSelf && <span className="text-xs text-neutral-400">（あなた）</span>}
        {player.isHost && <StatusBadge tone="dark">ホスト</StatusBadge>}
      </div>
      <StatusBadge tone={player.isOnline && player.isReady ? 'success' : 'neutral'}>
        {player.isOnline ? (player.isReady ? '準備OK' : '待機中') : 'オフライン'}
      </StatusBadge>
    </li>
  )
}
