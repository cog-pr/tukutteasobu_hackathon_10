import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'

const INFO_TAGS = ['4~5人', 'スマホで', '無料']

export function TopPage() {
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  return (
    <PhoneScreen className="justify-between gap-6">
      <div className="mt-4 text-center">
        <p className="text-xs font-bold tracking-widest text-neutral-400">
          ● VARIETY BATTLE GAME ●
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-neutral-900">
          みたかAI！
          <br />
          これが人類だ！
        </h1>
        <div className="mx-auto mt-4 h-px w-16 bg-neutral-300" />

        <Card className="mt-4 text-sm font-bold text-neutral-700">
          「知能で負けても、肉体で勝て。」
        </Card>

        <Card className="mt-3 text-left text-sm leading-relaxed text-neutral-600">
          4~5人のプレイヤーで遊ぶ大喜利バトル。
          <br />
          人間とAIが同じお題に答え、みんなで一番面白い回答に投票！
          <br />
          AIに負けても「挽回チャレンジ」で逆転できる。
        </Card>

        <div className="mt-4 flex justify-center gap-2">
          {INFO_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-bold text-neutral-500"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/rooms/new">
          <Button variant="primary">ルームを作る</Button>
        </Link>
        <Link to="/rooms/join">
          <Button variant="secondary">ルームに参加</Button>
        </Link>

        <button
          type="button"
          onClick={() => setShowHowToPlay((prev) => !prev)}
          className="mt-1 text-sm font-bold text-blue-600 underline underline-offset-4"
        >
          遊び方を見る {showHowToPlay ? '▲' : '▼'}
        </button>

        {showHowToPlay && (
          <Card className="text-left text-sm leading-relaxed text-neutral-600">
            <ol className="list-decimal space-y-1 pl-4">
              <li>挑戦者1人がお題に回答し、AIも同じお題に回答する</li>
              <li>ほかのプレイヤーはどちらの回答が面白いか投票する</li>
              <li>人間が勝てば人類に1点、AIが勝てば挽回チャレンジへ</li>
              <li>挽回に成功すれば人類に1点、失敗ならAIに1点</li>
              <li>先に3点を取った方が勝利</li>
            </ol>
          </Card>
        )}
      </div>
    </PhoneScreen>
  )
}
