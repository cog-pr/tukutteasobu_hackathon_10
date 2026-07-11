import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { CountdownBadge } from '../components/CountdownBadge'
import { PhoneScreen } from '../components/PhoneScreen'
import { ScoreBoard } from '../components/ScoreBoard'
import { DUMMY_CHALLENGER_NAME, DUMMY_ROUND_NUMBER, DUMMY_SCORE } from '../data/dummyData'

export function RoundIntroPage() {
  return (
    <PhoneScreen className="items-center justify-between text-center gap-6">
      <ScoreBoard score={DUMMY_SCORE} />

      <div>
        <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-bold text-white">
          ROUND {DUMMY_ROUND_NUMBER}
        </span>
        <p className="mt-6 text-base text-neutral-500">今回の挑戦者は……</p>
        <p className="mt-2 text-4xl font-black text-amber-500">{DUMMY_CHALLENGER_NAME}</p>
        <p className="text-sm text-neutral-500">さん！</p>
        <div className="mx-auto mt-6 h-px w-24 bg-neutral-200" />
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-xs text-neutral-400">回答画面に切り替わるまで</p>
          <CountdownBadge remainingSeconds={3} />
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <p className="text-center text-xs text-neutral-400">確認用：表示する画面を選択してください</p>
        <Link to="/answering/challenger">
          <Button variant="primary">挑戦者として回答画面を見る</Button>
        </Link>
        <Link to="/answering/waiting">
          <Button variant="secondary">ほかのプレイヤーとして見る</Button>
        </Link>
      </div>
    </PhoneScreen>
  )
}
