import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { StatusBadge } from '../components/StatusBadge'
import { TimerBar } from '../components/TimerBar'
import { DUMMY_CHALLENGER_NAME, DUMMY_PROMPT, DUMMY_SCORE } from '../data/dummyData'

export function AnsweringWaitingPage() {
  const navigate = useNavigate()

  return (
    <PhoneScreen className="gap-4">
      <ScoreBoard score={DUMMY_SCORE} />

      <div className="flex items-center justify-between">
        <StatusBadge tone="neutral">待機中</StatusBadge>
        <CountdownBadge remainingSeconds={27} />
      </div>
      <TimerBar remainingSeconds={27} totalSeconds={45} />

      <Card>
        <p className="text-xs font-bold text-neutral-400">お題</p>
        <p className="mt-1 text-lg font-bold leading-snug text-neutral-900">「{DUMMY_PROMPT}」</p>
      </Card>

      <Card className="border-[#d4b91e] bg-[#fff8cc]">
        <p className="text-sm font-black text-[#6f5900]">
          🎤 挑戦中
          <br />
          {DUMMY_CHALLENGER_NAME}が人類の意地を見せています……
        </p>
      </Card>

      <Card className="border-[#46d6e7] bg-[#e8fbfd]">
        <p className="text-sm font-black text-[#08798b]">🤖 生成中</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-[#08798b]">
          AIも回答を生成しています
          <span className="inline-flex gap-0.5">
            <span className="h-1 w-1 animate-bounce rounded-full bg-[#46d6e7]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-[#46d6e7] [animation-delay:0.15s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-[#46d6e7] [animation-delay:0.3s]" />
          </span>
        </p>
      </Card>

      <div className="rounded-xl border border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-400">
        回答が確定するまでしばらくお待ちください（あなたは待機プレイヤーです）
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="primary" onClick={() => navigate('/voting')}>
          投票画面へ進む（確認用）
        </Button>
      </div>
    </PhoneScreen>
  )
}
