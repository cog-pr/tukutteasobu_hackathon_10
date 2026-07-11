type CountdownBadgeProps = {
  remainingSeconds: number
}

/**
 * 残り時間を表す黒背景の丸みを帯びたバッジ。
 * サーバーのdeadlineAtによる制御は行わず、見た目のダミー表示に留める。
 */
export function CountdownBadge({ remainingSeconds }: CountdownBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-bold text-white">
      <span aria-hidden>⏱</span>
      {remainingSeconds}秒
    </span>
  )
}
