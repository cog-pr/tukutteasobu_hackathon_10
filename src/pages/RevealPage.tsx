import { AnswerCard } from '../components/AnswerCard'
import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { GAME_CONFIG } from '../shared/constants'

export function RevealPage() {
  const { roomState } = useRoomSocketContext()
  const round = roomState?.round
  const remaining = useCountdown(roomState?.deadlineAt ?? null)
  if (!round || !round.isRevealed) return null

  return (
    <PhoneScreen className="gap-4">
      <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />
      <div className="flex justify-end"><CountdownBadge remainingSeconds={remaining} /></div>
      <Card><p className="text-sm font-bold">Q. {round.prompt.text}</p></Card>
      {round.isForfeit ? (
        <Card className="border-[#e5484d] bg-[#fff0f1] text-center"><p className="text-sm font-bold text-[#a62f35]">未回答による不戦敗</p></Card>
      ) : (
        <>
          <AnswerCard label="A" text={round.answerA ?? ''} revealTag={round.answerOrder?.A} attributionName={round.answerOrder?.A === 'human' ? round.challengerName : undefined} voteCount={round.voteCounts.A} />
          <AnswerCard label="B" text={round.answerB ?? ''} revealTag={round.answerOrder?.B} attributionName={round.answerOrder?.B === 'human' ? round.challengerName : undefined} voteCount={round.voteCounts.B} />
        </>
      )}
      <Card className={round.winner === 'human' ? 'border-[#e5484d] bg-[#fff0f1]' : 'border-[#46d6e7] bg-[#e8fbfd]'}>
        <p className="text-center text-xs font-bold">このラウンドの勝者</p>
        <p className="mt-1 text-center text-2xl font-black">{round.winner === 'human' ? '人類！' : 'AI！'}</p>
      </Card>
      <p className="text-center text-xs text-neutral-400">{GAME_CONFIG.revealDwellMs / 1000}秒後に自動で進みます</p>
    </PhoneScreen>
  )
}
