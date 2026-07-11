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
    ? 'border-[#8d6f00] bg-[#fff8cc] shadow-[0_5px_0_rgba(141,111,0,0.22)]'
    : isRevealAi
      ? 'border-[#08798b] bg-[#e8fbfd] shadow-[0_5px_0_rgba(8,121,139,0.2)]'
      : selected
        ? 'border-[#17191f] bg-[#fff8cc] shadow-[0_5px_0_#17191f]'
        : 'border-[#d8d3c9] bg-[#fffdf8] shadow-[0_5px_0_rgba(37,36,32,0.07)]'

  const Wrapper = onClick && !disabled ? 'button' : 'div'

  return (
    <Wrapper
      type={Wrapper === 'button' ? 'button' : undefined}
      onClick={onClick && !disabled ? onClick : undefined}
      disabled={Wrapper === 'button' ? disabled : undefined}
      className={`w-full rounded-[18px] border-2 p-4 text-left transition ${borderClass} ${
        onClick && !disabled ? 'active:scale-[0.98]' : ''
      } ${disabled && !revealTag && !selected ? 'opacity-60' : ''}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-black tracking-[0.12em] text-[#686d78]">
          回答{label}
          {revealTag && (isRevealHuman ? ' - 人類 👤' : ' - AI 🤖')}
        </span>
        <div className="flex items-center gap-1.5">
          {selected && !revealTag && (
            <span className="rounded-full border border-[#08798b] bg-[#46d6e7] px-2 py-0.5 text-[10px] font-black text-[#17191f]">
              投票済み
            </span>
          )}
          {typeof voteCount === 'number' && (
            <span className="rounded-full bg-[#17191f] px-2 py-0.5 text-[10px] font-black text-white">
              {voteCount}票
            </span>
          )}
        </div>
      </div>
      <p className="text-base font-black leading-snug text-[#17191f]">{text}</p>
      {attributionName && <p className="mt-1 text-xs text-neutral-400">by {attributionName}</p>}
    </Wrapper>
  )
}
