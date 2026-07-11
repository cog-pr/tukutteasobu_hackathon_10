import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnswerCard } from '../components/AnswerCard'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { TimerBar } from '../components/TimerBar'
import { DUMMY_ANSWER_A, DUMMY_ANSWER_B, DUMMY_PROMPT, DUMMY_SCORE } from '../data/dummyData'
import type { VoteChoice } from '../shared/game/countVotes'

const ONLINE_VOTER_COUNT = 4

export function VotingPage() {
  const navigate = useNavigate()
  const [votedFor, setVotedFor] = useState<VoteChoice | null>(null)

  const votedCount = votedFor ? 3 : 2

  return (
    <PhoneScreen className="gap-4">
      <ScoreBoard score={DUMMY_SCORE} />

      <p className="text-center text-lg font-black text-neutral-900">どっちが面白い？</p>

      <Card className="bg-neutral-50">
        <p className="text-sm font-bold text-neutral-700">Q. {DUMMY_PROMPT}</p>
      </Card>
      <p className="text-xs text-neutral-400">
        カード全体をタップして投票できます。回答者は誰か？は結果発表後に公開。
      </p>

      <div className="flex items-center justify-between">
        <span />
        <CountdownBadge remainingSeconds={18} />
      </div>
      <TimerBar remainingSeconds={18} totalSeconds={20} />

      <div className="flex flex-col gap-3">
        <AnswerCard
          label="A"
          text={DUMMY_ANSWER_A}
          selected={votedFor === 'A'}
          disabled={votedFor !== null}
          onClick={() => setVotedFor('A')}
        />
        <AnswerCard
          label="B"
          text={DUMMY_ANSWER_B}
          selected={votedFor === 'B'}
          disabled={votedFor !== null}
          onClick={() => setVotedFor('B')}
        />
      </div>

      {votedFor && (
        <div className="rounded-xl border border-[#46d6e7] bg-[#e8fbfd] px-3 py-2 text-center text-sm font-black text-[#08798b]">
          ✓ 投票済み — 他の人の投票を待っています
        </div>
      )}
      <p className="text-center text-xs text-neutral-400">
        投票済み {votedCount} / {ONLINE_VOTER_COUNT}
      </p>

      <div className="mt-auto flex flex-col gap-3">
        <Button variant="primary" disabled={!votedFor} onClick={() => navigate('/reveal')}>
          回答公開画面へ進む（確認用）
        </Button>
      </div>
    </PhoneScreen>
  )
}
