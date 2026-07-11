type AnswerCardProps = {
  label: 'A' | 'B'
  text: string
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  revealTag?: 'human' | 'ai'
  attributionName?: string
  voteCount?: number
}

/**
 * 投票画面・回答公開画面の両方で使う回答表示カード。
 * revealTagがある場合は人間/AIの正体を表示する。
 */
export function AnswerCard({
  label,
  text,
  onClick,
  selected = false,
  disabled = false,
  revealTag,
  attributionName,
  voteCount,
}: AnswerCardProps) {
  const isRevealHuman = revealTag === 'human'
  const isRevealAi = revealTag === 'ai'

  const borderClass = isRevealHuman
    ? 'border-amber-300 bg-amber-50'
    : isRevealAi
      ? 'border-blue-300 bg-blue-50'
      : selected
        ? 'border-neutral-900'
        : 'border-neutral-200 bg-white'

  const Wrapper = onClick && !disabled ? 'button' : 'div'

  return (
    <Wrapper
      type={Wrapper === 'button' ? 'button' : undefined}
      onClick={onClick && !disabled ? onClick : undefined}
      disabled={Wrapper === 'button' ? disabled : undefined}
      className={`w-full rounded-2xl border p-4 text-left shadow-sm transition ${borderClass} ${
        onClick && !disabled ? 'active:scale-[0.98]' : ''
      } ${disabled && !revealTag && !selected ? 'opacity-60' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold tracking-wide text-neutral-500">
          回答{label}
          {revealTag && (isRevealHuman ? ' - 人類 👤' : ' - AI 🤖')}
        </span>
        <div className="flex items-center gap-1.5">
          {selected && !revealTag && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
              投票済み
            </span>
          )}
          {typeof voteCount === 'number' && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600">
              {voteCount}票
            </span>
          )}
        </div>
      </div>
      <p className="text-base font-bold leading-snug text-neutral-900">{text}</p>
      {attributionName && <p className="mt-1 text-xs text-neutral-400">by {attributionName}</p>}
    </Wrapper>
  )
}
