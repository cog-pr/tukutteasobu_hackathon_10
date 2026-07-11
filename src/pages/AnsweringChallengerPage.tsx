import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { StatusBadge } from '../components/StatusBadge'
import { TimerBar } from '../components/TimerBar'
import { DUMMY_PROMPT, DUMMY_SCORE } from '../data/dummyData'
import { validateAnswer } from '../lib/validateAnswer'

const MAX_ANSWER_LENGTH = 60

export function AnsweringChallengerPage() {
  const navigate = useNavigate()
  const [answer, setAnswer] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const validation = validateAnswer(answer)
  const canConfirm = validation.valid && !confirmed

  return (
    <PhoneScreen className="gap-4">
      <ScoreBoard score={DUMMY_SCORE} />

      <div className="flex items-center justify-between">
        <StatusBadge tone="dark">あなたが挑戦者</StatusBadge>
        <CountdownBadge remainingSeconds={27} />
      </div>
      <TimerBar remainingSeconds={27} totalSeconds={45} />

      <Card>
        <p className="text-xs font-bold text-neutral-400">お題</p>
        <p className="mt-1 text-lg font-bold leading-snug text-neutral-900">「{DUMMY_PROMPT}」</p>
      </Card>

      <div>
        <span className="mb-1 block text-sm font-bold text-neutral-700">あなたの回答</span>
        <textarea
          value={answer}
          disabled={confirmed}
          rows={2}
          onChange={(event) => setAnswer(event.target.value.replace(/[\r\n]/g, ''))}
          placeholder="ここに入力…"
          className="w-full resize-none rounded-[13px] border-2 border-[#c7c2b8] bg-white px-4 py-3 text-base text-[#17191f] outline-none transition placeholder:text-neutral-400 focus:border-[#17191f] focus:shadow-[0_0_0_4px_rgba(244,209,63,0.18)] disabled:opacity-70"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
          <span>1行で簡潔に</span>
          <span className={Array.from(answer).length > MAX_ANSWER_LENGTH ? 'font-semibold text-rose-500' : ''}>
            {Array.from(answer).length}/{MAX_ANSWER_LENGTH}
          </span>
        </div>
        {!validation.valid && answer.length > 0 && (
          <p className="mt-1 text-xs text-rose-500">{validation.message}</p>
        )}
      </div>

      <Card className="border-[#d4b91e] bg-[#fff8cc] text-sm font-black text-[#6f5900]">
        💡 AIに負けるな！ユニークな回答を入力しよう
      </Card>

      <div className="mt-auto flex flex-col gap-3">
        {!confirmed ? (
          <Button variant="primary" disabled={!canConfirm} onClick={() => setConfirmed(true)}>
            回答を確定する
          </Button>
        ) : (
          <Button variant="primary" onClick={() => navigate('/voting/waiting')}>
            投票画面へ進む（確認用）
          </Button>
        )}
      </div>
    </PhoneScreen>
  )
}
