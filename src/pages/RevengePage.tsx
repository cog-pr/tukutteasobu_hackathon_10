import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { SegmentedControl } from '../components/SegmentedControl'
import { TimerBar } from '../components/TimerBar'
import { DUMMY_CHALLENGER_NAME } from '../data/dummyData'

type ViewRole = 'challenger' | 'audience'

const REQUIRED_TAPS = 35
const TIME_LIMIT_SECONDS = 5

export function RevengePage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<ViewRole>('challenger')
  const [tapCount, setTapCount] = useState(28)

  const remainingSeconds = 3
  const progressRatio = Math.min(1, tapCount / REQUIRED_TAPS)

  return (
    <PhoneScreen className="gap-4">
      <SegmentedControl
        value={role}
        onChange={setRole}
        options={[
          { value: 'challenger', label: '挑戦者として見る' },
          { value: 'audience', label: 'ほかのプレイヤーとして見る' },
        ]}
      />

      <Card className="border-blue-200 bg-blue-50 text-center">
        <p className="text-sm font-bold text-blue-800">AIの勝利！ しかし……</p>
        <p className="mt-1 text-lg font-black text-neutral-900">人類には肉体がある</p>
      </Card>

      <Card className="text-center">
        <p className="text-sm font-bold text-neutral-800">超連打チャレンジ</p>
        <span className="mt-2 inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-500">
          {TIME_LIMIT_SECONDS}秒以内に{REQUIRED_TAPS}タップ
        </span>
      </Card>

      {role === 'challenger' ? (
        <>
          <div className="flex gap-3">
            <Card className="flex-1 text-center">
              <p className="text-xs font-bold text-neutral-400">残り時間</p>
              <p className="mt-1 text-lg font-black text-rose-500">⏱ {remainingSeconds}秒</p>
            </Card>
            <Card className="flex-1 text-center">
              <p className="text-xs font-bold text-neutral-400">回数</p>
              <p className="mt-1 text-lg font-black text-neutral-900">
                {tapCount} / {REQUIRED_TAPS}
              </p>
            </Card>
          </div>

          <TimerBar remainingSeconds={progressRatio * TIME_LIMIT_SECONDS} totalSeconds={TIME_LIMIT_SECONDS} />

          <div className="grid place-items-center py-2">
            <button
              type="button"
              onPointerDown={() => setTapCount((prev) => Math.min(REQUIRED_TAPS, prev + 1))}
              className="grid h-40 w-40 place-items-center rounded-full bg-amber-400 text-xl font-black text-neutral-900 shadow-lg shadow-amber-300/50 transition active:scale-95"
            >
              👊
              <br />
              タップ！
            </button>
          </div>
        </>
      ) : (
        <Card className="text-center">
          <p className="text-sm text-neutral-700">
            <span className="font-black text-amber-500">{DUMMY_CHALLENGER_NAME}</span>
            が超連打チャレンジに挑戦中！
          </p>
          <div className="mt-3">
            <TimerBar remainingSeconds={progressRatio * TIME_LIMIT_SECONDS} totalSeconds={TIME_LIMIT_SECONDS} />
          </div>
          <p className="mt-2 text-xs text-neutral-400">
            現在：{tapCount}回 / {REQUIRED_TAPS}回
          </p>
          <p className="mt-3 text-sm font-bold text-blue-600">がんばれ！</p>
        </Card>
      )}

      <div className="rounded-xl border border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-400">
        成功/失敗の結果がここに表示されます
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <p className="text-center text-xs text-neutral-400">確認用：結果を選択して最終結果画面へ</p>
        <Button variant="primary" onClick={() => navigate('/result', { state: { revengeResult: 'success' } })}>
          成功として次へ
        </Button>
        <Button variant="secondary" onClick={() => navigate('/result', { state: { revengeResult: 'failure' } })}>
          失敗として次へ
        </Button>
      </div>
    </PhoneScreen>
  )
}
