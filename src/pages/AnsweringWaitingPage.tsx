import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { StatusBadge } from '../components/StatusBadge'
import { TimerBar } from '../components/TimerBar'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { GAME_CONFIG } from '../shared/constants'

export function AnsweringWaitingPage() {
  const { roomState } = useRoomSocketContext()
  const round = roomState?.round
  const remaining = useCountdown(roomState?.deadlineAt ?? null)
  const challengerName = roomState?.players.find((player) => player.id === round?.challengerId)?.name ?? ''
  const hasHumanAnswer = round && !round.isRevealed && round.hasHumanAnswer
  const hasAiAnswer = round && !round.isRevealed && round.hasAiAnswer

  return (
    <PhoneScreen className="gap-4">
      <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />

      <div className="flex items-center justify-between">
        <StatusBadge tone="neutral">待機中</StatusBadge>
        <CountdownBadge remainingSeconds={remaining} />
      </div>
      <TimerBar remainingSeconds={remaining} totalSeconds={GAME_CONFIG.answerTimeMs / 1000} />

      <Card>
        <p className="text-xs font-bold text-neutral-400">お題</p>
        <p className="mt-1 text-lg font-bold leading-snug text-neutral-900">「{round && !round.isRevealed ? round.prompt.text : ''}」</p>
      </Card>

      <Card className="border-[#e5484d] bg-[#fff0f1]">
        <p className="text-sm font-black text-[#a62f35]">
          {hasHumanAnswer ? '✅ 回答済み' : '🎤 挑戦中'}
          <br />
          {hasHumanAnswer ? `${challengerName}の回答が届きました` : `${challengerName}が人類の意地を見せています……`}
        </p>
      </Card>

      <Card className="border-[#46d6e7] bg-[#e8fbfd]">
        <p className="text-sm font-black text-[#08798b]">{hasAiAnswer ? '✅ 生成完了' : '🤖 生成中'}</p>
        {!hasAiAnswer && (
          <p className="mt-1 flex items-center gap-1 text-sm text-[#08798b]">
            AIも回答を生成しています
            <span className="inline-flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-[#46d6e7]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-[#46d6e7] [animation-delay:0.15s]" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-[#46d6e7] [animation-delay:0.3s]" />
            </span>
          </p>
        )}
      </Card>

      <div className="rounded-xl border border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-400">
        回答が確定するまでしばらくお待ちください（あなたは待機プレイヤーです）
      </div>
    </PhoneScreen>
  )
}
