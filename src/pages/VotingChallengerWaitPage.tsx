import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { TimerBar } from '../components/TimerBar'
import { DUMMY_SCORE } from '../data/dummyData'

export function VotingChallengerWaitPage() {
  const navigate = useNavigate()

  return (
    <PhoneScreen className="items-center justify-between text-center gap-4">
      <ScoreBoard score={DUMMY_SCORE} />

      <div className="w-full">
        <div className="mb-2 flex justify-end">
          <CountdownBadge remainingSeconds={18} />
        </div>
        <TimerBar remainingSeconds={18} totalSeconds={20} />
      </div>

      <Card className="w-full">
        <p className="text-base font-bold leading-relaxed text-neutral-900">みんなが審査中です</p>
        <p className="mt-2 text-sm text-neutral-500">祈って待て</p>
      </Card>

      <div className="flex w-full flex-col gap-3">
        <Button variant="primary" onClick={() => navigate('/reveal')}>
          回答公開画面へ進む（確認用）
        </Button>
      </div>
    </PhoneScreen>
  )
}
