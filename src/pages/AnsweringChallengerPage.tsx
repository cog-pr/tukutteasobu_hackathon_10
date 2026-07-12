import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { TimerBar } from '../components/TimerBar'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { validateAnswer } from '../lib/validateAnswer'
import { GAME_CONFIG } from '../shared/constants'

export function AnsweringChallengerPage() {
  const { roomState, connectionStatus, submitAnswer } = useRoomSocketContext()
  const [answer, setAnswer] = useState('')
  const remaining = useCountdown(roomState?.deadlineAt ?? null)
  const round = roomState?.round
  const hasSubmitted = round && !round.isRevealed && round.hasHumanAnswer
  const validation = validateAnswer(answer)
  const canSubmit = validation.valid && connectionStatus === 'connected' && !hasSubmitted

  if (hasSubmitted) {
    return (
      <PhoneScreen className="items-center justify-center gap-4 text-center">
        <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />
        <Card>
          <p className="text-base font-bold text-neutral-900">回答を送信しました。</p>
          <p className="mt-2 text-sm text-neutral-500">AIの回答を待っています…</p>
        </Card>
      </PhoneScreen>
    )
  }

  return (
    <PhoneScreen className="gap-4">
      <ScoreBoard score={roomState?.score ?? { human: 0, ai: 0 }} />
      <div className="flex justify-end"><CountdownBadge remainingSeconds={remaining} /></div>
      <TimerBar remainingSeconds={remaining} totalSeconds={GAME_CONFIG.answerTimeMs / 1000} />
      <Card><p className="text-xs font-bold text-neutral-400">お題</p><p className="mt-1 text-lg font-bold">「{round && !round.isRevealed ? round.prompt.text : ''}」</p></Card>
      <div>
        <span className="mb-1 block text-sm font-bold">あなたの回答</span>
        <textarea
          value={answer}
          rows={2}
          maxLength={GAME_CONFIG.maxAnswerLength}
          disabled={remaining === 0 || connectionStatus !== 'connected'}
          onChange={(event) => setAnswer(event.target.value.replace(/[\r\n]/g, ''))}
          className="w-full resize-none rounded-[13px] border-2 border-[#c7c2b8] bg-white px-4 py-3 disabled:bg-neutral-100"
        />
        <p className="mt-1 text-right text-xs text-neutral-400">{Array.from(answer).length}/{GAME_CONFIG.maxAnswerLength}</p>
        {!validation.valid && answer.length > 0 && <p className="text-xs text-rose-500">{validation.message}</p>}
      </div>
      <div className="mt-auto"><Button disabled={!canSubmit} onClick={() => submitAnswer(answer)}>回答を確定する</Button></div>
    </PhoneScreen>
  )
}
