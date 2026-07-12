import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'

export function RoundResultPage() {
  const { roomState } = useRoomSocketContext()
  const round = roomState?.round
  const remaining = useCountdown(roomState?.deadlineAt ?? null)
  if (!round || !round.isRevealed) return null

  const humanWon = round.winner === 'human'

  return (
    <PhoneScreen className="items-center justify-between text-center gap-6">
      <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />
      <div>
        <p className="text-sm text-neutral-500">ROUND {round.roundNumber} の結果</p>
        <Card className={`mt-4 ${humanWon ? 'border-[#e5484d] bg-[#fff0f1]' : 'border-[#46d6e7] bg-[#e8fbfd]'}`}>
          <p className="text-xs font-bold">このラウンドの勝者</p>
          <p className="mt-1 text-2xl font-black">{humanWon ? '人類！' : 'AI！'}</p>
          {round.isForfeit && <p className="mt-1 text-xs">未回答による不戦敗</p>}
          {round.challengeResult && <p className="mt-2 text-xs font-bold">超連打チャレンジ: {round.challengeResult === 'success' ? '成功' : '失敗'}</p>}
        </Card>
      </div>
      <p className="text-sm text-neutral-400">まもなく次へ……（{remaining}）</p>
    </PhoneScreen>
  )
}
