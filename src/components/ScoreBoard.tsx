import type { Score } from '../shared/game/getGameResult'

type ScoreBoardProps = {
  score: Score
  winningScore?: number
}

export function ScoreBoard({ score, winningScore = 3 }: ScoreBoardProps) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[17px] border border-white/10 bg-[#171a22] px-4 py-3 text-white shadow-[0_5px_0_rgba(0,0,0,0.18)]">
      <div className="text-center">
        <p className="text-[9px] font-black tracking-[0.14em] text-[#f4d13f]">HUMAN</p>
        <p className="text-3xl font-black text-white">{score.human}</p>
      </div>
      <p className="text-[9px] font-black text-white/30">VS</p>
      <div className="text-center">
        <p className="text-3xl font-black text-white">{score.ai}</p>
        <p className="text-[9px] font-black tracking-[0.14em] text-[#46d6e7]">AI</p>
      </div>
      <p className="ml-2 text-[9px] font-bold text-white/40">{winningScore}点先取</p>
    </div>
  )
}
