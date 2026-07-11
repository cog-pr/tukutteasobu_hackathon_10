import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { StatusBadge } from '../components/StatusBadge'
import { DUMMY_MVP_ANSWER, DUMMY_ROUND_HISTORY, DUMMY_SCORE } from '../data/dummyData'
import { getGameResult } from '../shared/game/getGameResult'

type RevengeResult = 'success' | 'failure' | undefined

export function FinalResultPage() {
  const location = useLocation()
  const revengeResult = (location.state as { revengeResult?: RevengeResult } | null)?.revengeResult ?? 'success'

  const scoreAfterRound = { human: DUMMY_SCORE.human, ai: DUMMY_SCORE.ai + 1 }
  const finalScore =
    revengeResult === 'success'
      ? { human: scoreAfterRound.human + 1, ai: scoreAfterRound.ai }
      : { human: scoreAfterRound.human, ai: scoreAfterRound.ai + 1 }

  const gameResult = getGameResult(finalScore)
  const humanWon = gameResult.winner === 'human'

  return (
    <PhoneScreen className="gap-4">
      <div className="mt-2 text-center">
        <p className="text-xs font-bold text-neutral-400">最終スコア</p>
        <div className="mt-2">
          <ScoreBoard score={finalScore} />
        </div>
      </div>

      <Card className={humanWon ? 'border-[#e5484d] bg-[#fff0f1]' : 'border-[#46d6e7] bg-[#e8fbfd]'}>
        <p className="text-center text-xs font-bold text-neutral-500">勝者</p>
        <p className={`mt-1 text-center text-xl font-black ${humanWon ? 'text-[#a62f35]' : 'text-[#08798b]'}`}>
          {humanWon ? '人類の勝利！' : 'AIの勝利'}
        </p>
        <p className="mt-2 text-center text-sm font-bold text-neutral-500">「頭で負けたら、肉体で勝てばええねん。」</p>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-bold text-neutral-700">各ラウンドの結果</h2>
        <ul className="flex flex-col gap-2">
          {DUMMY_ROUND_HISTORY.map((round) => (
            <li
              key={round.roundNumber}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2"
            >
              <span className="text-sm text-neutral-600">Round{round.roundNumber}</span>
              <div className="flex items-center gap-2">
                {round.wentToRevenge && <StatusBadge tone="warning">挽回</StatusBadge>}
                <StatusBadge tone={round.winner === 'human' ? 'success' : 'info'}>
                  {round.winner === 'human' ? '人類' : 'AI'}
                </StatusBadge>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Card>
        <p className="text-xs font-bold text-neutral-400">最多票 人類回答</p>
        <p className="mt-1 text-base font-bold text-neutral-900">「{DUMMY_MVP_ANSWER.text}」</p>
        <p className="mt-1 text-xs text-neutral-400">
          by {DUMMY_MVP_ANSWER.playerName} ー {DUMMY_MVP_ANSWER.votes}票獲得
        </p>
      </Card>

      <div className="mt-auto flex flex-col gap-3">
        <Link to="/lobby">
          <Button variant="primary">もう一度遊ぶ</Button>
        </Link>
        <Link to="/">
          <Button variant="secondary">トップへ戻る</Button>
        </Link>
      </div>
    </PhoneScreen>
  )
}
