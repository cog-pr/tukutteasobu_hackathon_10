import type { Score } from '../shared/game/getGameResult'

type ScoreBoardProps = {
  score: Score
  winningScore?: number
}

export function ScoreBoard({ score, winningScore = 3 }: ScoreBoardProps) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-center">
        <p className="text-[11px] font-bold tracking-widest text-amber-500">人類</p>
        <p className="text-3xl font-black text-amber-500">{score.human}</p>
      </div>
      <p className="text-xl font-bold text-neutral-300">─</p>
      <div className="text-center">
        <p className="text-3xl font-black text-blue-500">{score.ai}</p>
        <p className="text-[11px] font-bold tracking-widest text-blue-500">AI</p>
      </div>
      <p className="ml-2 text-[11px] text-neutral-400">{winningScore}点先取</p>
    </div>
  )
}
