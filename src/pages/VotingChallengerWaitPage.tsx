import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { TimerBar } from '../components/TimerBar'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { GAME_CONFIG } from '../shared/constants'

export function VotingChallengerWaitPage() {
  const { roomState } = useRoomSocketContext()
  const remaining = useCountdown(roomState?.deadlineAt ?? null)

  return (
    <PhoneScreen className="items-center justify-between text-center gap-4">
      <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />

      <div className="w-full">
        <div className="mb-2 flex justify-end">
          <CountdownBadge remainingSeconds={remaining} />
        </div>
        <TimerBar remainingSeconds={remaining} totalSeconds={GAME_CONFIG.voteTimeMs / 1000} />
      </div>

      <Card className="w-full">
        <p className="text-base font-bold leading-relaxed text-neutral-900">みんなが審査中です</p>
        <p className="mt-2 text-sm text-neutral-500">祈って待て</p>
      </Card>
    </PhoneScreen>
  )
}
