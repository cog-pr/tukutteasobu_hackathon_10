type TimerBarProps = {
  remainingSeconds: number
  totalSeconds: number
}

/**
 * 残り時間を表す静的なプログレスバー。
 * サーバーのdeadlineAtによる制御は行わず、見た目のダミー表示に留める。
 */
export function TimerBar({ remainingSeconds, totalSeconds }: TimerBarProps) {
  const ratio = Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
  const isUrgent = ratio < 0.25

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full border border-[#cbc6bc] bg-[#e4dfd5]">
      <div
        className={`h-full rounded-full transition-all ${isUrgent ? 'bg-[#ff5d55]' : 'bg-[#f4d13f]'}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  )
}
