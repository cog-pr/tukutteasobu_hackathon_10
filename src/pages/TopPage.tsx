import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'

export function TopPage() {
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  return (
    <PhoneScreen className="justify-between gap-6 bg-[radial-gradient(circle_at_100%_0%,rgba(70,214,231,0.16),transparent_16rem),linear-gradient(160deg,transparent_0_48%,rgba(244,209,63,0.2)_48%_50%,transparent_50%),#f5f1e8] text-[#17191f]">
      <div className="relative mt-4 overflow-hidden text-left">
        <h1 className="relative mt-4 text-[clamp(42px,12vw,58px)] font-black leading-[1.02] tracking-[-0.07em] text-[#17191f]">
          <span className="yellow-marker">たかが<span className="text-[#0a9bb0]">AI</span>、</span>
          <br />
          <span className="yellow-marker">あがけ<span className="text-[#d93843]">人類</span>。</span>
        </h1>
        <Card className="relative mt-5 border-[#d8d3c9] bg-[#fffdf8]/90 text-left text-sm leading-relaxed text-[#3e4149] backdrop-blur">
          4~5人のプレイヤーで遊ぶ大喜利バトル。
          <br />
          人間とAIが同じお題に答え、みんなで一番面白い回答に投票！
          <br />
          AIに負けても「挽回チャレンジ」で逆転できる。
        </Card>

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
          className="mt-1 text-sm font-black text-[#0a9bb0] underline decoration-2 underline-offset-4"
        >
          遊び方を見る {showHowToPlay ? '▲' : '▼'}
        </button>

        {showHowToPlay && (
          <Card className="border-[#d8d3c9] bg-[#fffdf8] text-left text-sm leading-relaxed text-[#3e4149]">
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
