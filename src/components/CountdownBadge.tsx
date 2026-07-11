type CountdownBadgeProps = {
  remainingSeconds: number
}

/**
 * 残り時間を表す黒背景の丸みを帯びたバッジ。
 * サーバーのdeadlineAtによる制御は行わず、見た目のダミー表示に留める。
 */
export function CountdownBadge({ remainingSeconds }: CountdownBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#17191f] px-3 py-1.5 text-sm font-black text-white shadow-[0_3px_0_#aaa59b]">
      <span aria-hidden>⏱</span>
      {remainingSeconds}秒
    </span>
  )
}
