import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'

const INFO_TAGS = ['4~5人', 'スマホで', '無料']

export function TopPage() {
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  return (
    <PhoneScreen className="justify-between gap-6 bg-[linear-gradient(160deg,transparent_0_48%,rgba(244,209,63,0.08)_48%_50%,transparent_50%),#11131a] text-white">
      <div className="relative mt-4 overflow-hidden text-left">
        <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 top-12 h-36 w-36 rounded-full border border-white/10" />
        <p className="relative text-[10px] font-black tracking-[0.18em] text-white/45">
          HUMANITY COMEBACK BATTLE
        </p>
        <h1 className="relative mt-4 text-[clamp(42px,12vw,58px)] font-black leading-[1.02] tracking-[-0.07em] text-white">
          みたか<span className="text-[#46d6e7]">AI</span>！
          <br />
          これが<span className="text-[#f4d13f]">人類</span>だ！
        </h1>
        <p className="relative mt-4 max-w-[310px] text-sm font-bold leading-7 text-white/65">「知能で負けても、肉体で勝て。」</p>

        <Card className="relative mt-5 border-white/10 bg-white/[0.04] text-left text-sm leading-relaxed text-white/70 shadow-none backdrop-blur">
          4~5人のプレイヤーで遊ぶ大喜利バトル。
          <br />
          人間とAIが同じお題に答え、みんなで一番面白い回答に投票！
          <br />
          AIに負けても「挽回チャレンジ」で逆転できる。
        </Card>

        <div className="relative mt-4 flex gap-2">
          {INFO_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/55"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col gap-3">
        <Link to="/rooms/new">
          <Button variant="primary">ルームを作る</Button>
        </Link>
        <Link to="/rooms/join">
          <Button variant="secondary">ルームに参加</Button>
        </Link>

        <button
          type="button"
          onClick={() => setShowHowToPlay((prev) => !prev)}
          className="mt-1 text-sm font-bold text-[#46d6e7] underline underline-offset-4"
        >
          遊び方を見る {showHowToPlay ? '▲' : '▼'}
        </button>

        {showHowToPlay && (
          <Card className="border-white/10 bg-[#1a1d25] text-left text-sm leading-relaxed text-white/70 shadow-none">
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
