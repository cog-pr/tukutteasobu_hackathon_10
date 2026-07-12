import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { StatusBadge } from '../components/StatusBadge'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { clearPlayerSession } from '../client/services/playerSession'
import { getGameResult } from '../shared/game/getGameResult'

export function FinalResultPage() {
  const navigate = useNavigate()
  const { roomState, session, rematch } = useRoomSocketContext()
  const score = roomState?.score ?? { human: 0, ai: 0 }
  const result = getGameResult(score)
  const humanWon = result.winner === 'human'
  const self = roomState?.players.find((player) => player.id === session?.playerId)

  return (
    <PhoneScreen className="gap-4">
      <div className="mt-2 text-center"><p className="text-xs font-bold text-neutral-400">最終スコア</p><ScoreBoard score={score} /></div>
      <Card className={humanWon ? 'border-[#e5484d] bg-[#fff0f1]' : 'border-[#46d6e7] bg-[#e8fbfd]'}>
        <p className="text-center text-xs font-bold">勝者</p>
        <p className="mt-1 text-center text-xl font-black">{humanWon ? '人類の勝利！' : 'AIの勝利'}</p>
      </Card>
      {roomState?.mvp && (
        <Card>
          <p className="text-xs font-bold text-neutral-400">MVP回答</p>
          <p className="mt-1 text-base font-black">{roomState.mvp.playerName}「{roomState.mvp.answer}」</p>
          <p className="mt-1 text-xs text-neutral-400">Round {roomState.mvp.roundNumber} / {roomState.mvp.voteCount}票</p>
        </Card>
      )}
      <div>
        <h2 className="mb-2 text-sm font-bold">各ラウンドの結果</h2>
        <ul className="flex flex-col gap-2">
          {(roomState?.history ?? []).map((round) => (
            <li key={round.roundNumber} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
              <span>Round {round.roundNumber} — {round.challengerName}</span>
              <div className="flex gap-2">
                {round.wentToRevenge && <StatusBadge tone="warning">挽回</StatusBadge>}
                <StatusBadge tone={round.winner === 'human' ? 'success' : 'info'}>{round.winner === 'human' ? '人類' : 'AI'}</StatusBadge>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        {self?.isHost ? (
          <Button onClick={rematch}>もう一度遊ぶ</Button>
        ) : (
          <p className="text-center text-xs text-neutral-400">ホストが再戦を選ぶのを待っています…</p>
        )}
        <Button variant="secondary" onClick={() => { clearPlayerSession(); navigate('/') }}>トップへ戻る</Button>
      </div>
    </PhoneScreen>
  )
}
