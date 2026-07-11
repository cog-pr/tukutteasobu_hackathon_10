import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnswerCard } from '../components/AnswerCard'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import {
  DUMMY_ANSWER_A,
  DUMMY_ANSWER_B,
  DUMMY_ANSWER_ORDER,
  DUMMY_CHALLENGER_NAME,
  DUMMY_PROMPT,
  DUMMY_SCORE,
  DUMMY_VOTE_COUNT,
} from '../data/dummyData'
import { countVotes } from '../shared/game/countVotes'

const REVEAL_STEPS = ['answerA', 'answerB', 'votes', 'winner'] as const

export function RevealPage() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)

  const voteResult = countVotes({ voter_1: 'A', voter_2: 'B', voter_3: 'B' })
  const winnerLetter = voteResult.winner === 'draw' ? 'A' : voteResult.winner
  const winnerSide = DUMMY_ANSWER_ORDER[winnerLetter]

  const scoreAfter =
    winnerSide === 'human'
      ? { human: DUMMY_SCORE.human + 1, ai: DUMMY_SCORE.ai }
      : { human: DUMMY_SCORE.human, ai: DUMMY_SCORE.ai + 1 }

  const step = REVEAL_STEPS[Math.min(stepIndex, REVEAL_STEPS.length - 1)]
  const showAnswerA = stepIndex >= REVEAL_STEPS.indexOf('answerA')
  const showAnswerB = stepIndex >= REVEAL_STEPS.indexOf('answerB')
  const showVotes = stepIndex >= REVEAL_STEPS.indexOf('votes')
  const showWinner = stepIndex >= REVEAL_STEPS.indexOf('winner')

  return (
    <PhoneScreen className="gap-4">
      <ScoreBoard score={DUMMY_SCORE} />

      <Card className="bg-neutral-50">
        <p className="text-sm font-bold text-neutral-700">Q. {DUMMY_PROMPT}</p>
        <p className="mt-1 text-xs text-neutral-400">順番に公開されます</p>
      </Card>

      <div className="flex flex-col gap-3">
        <AnswerCard
          label="A"
          text={DUMMY_ANSWER_A}
          revealTag={showAnswerA ? DUMMY_ANSWER_ORDER.A : undefined}
          attributionName={
            showAnswerA && DUMMY_ANSWER_ORDER.A === 'human' ? DUMMY_CHALLENGER_NAME : undefined
          }
          voteCount={showVotes ? DUMMY_VOTE_COUNT.A : undefined}
        />
        <AnswerCard
          label="B"
          text={DUMMY_ANSWER_B}
          revealTag={showAnswerB ? DUMMY_ANSWER_ORDER.B : undefined}
          attributionName={
            showAnswerB && DUMMY_ANSWER_ORDER.B === 'human' ? DUMMY_CHALLENGER_NAME : undefined
          }
          voteCount={showVotes ? DUMMY_VOTE_COUNT.B : undefined}
        />
      </div>

      {showWinner && (
        <Card className={winnerSide === 'human' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'}>
          <p className="text-center text-xs font-bold text-neutral-500">このラウンドの勝者</p>
          <p
            className={`mt-1 text-center text-2xl font-black ${
              winnerSide === 'human' ? 'text-amber-600' : 'text-blue-600'
            }`}
          >
            {winnerSide === 'human' ? '人類！🎉' : 'AI！'}
          </p>
          <p className="mt-2 text-center text-sm font-bold text-neutral-500">
            人類{scoreAfter.human}-{scoreAfter.ai}AI
          </p>
        </Card>
      )}

      <div className="mt-auto flex flex-col gap-3">
        {step !== 'winner' ? (
          <Button variant="primary" onClick={() => setStepIndex((prev) => prev + 1)}>
            次へ
          </Button>
        ) : winnerSide === 'ai' ? (
          <Button variant="primary" onClick={() => navigate('/revenge')}>
            挽回チャレンジへ（確認用）
          </Button>
        ) : (
          <Button variant="primary" onClick={() => navigate('/result')}>
            次のラウンドへ / 最終結果画面へ（確認用）
          </Button>
        )}
      </div>
    </PhoneScreen>
  )
}
