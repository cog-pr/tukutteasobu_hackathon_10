type StatusBadgeTone = 'success' | 'warning' | 'neutral' | 'danger' | 'info' | 'dark'

type StatusBadgeProps = {
  children: string
  tone?: StatusBadgeTone
}

const TONE_CLASSES: Record<StatusBadgeTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-[#fff8cc] text-[#8d6f00] border-[#e2c72f]',
  neutral: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  danger: 'bg-rose-50 text-rose-600 border-rose-200',
  info: 'bg-[#e8fbfd] text-[#08798b] border-[#46d6e7]',
  dark: 'bg-[#17191f] text-white border-[#17191f]',
}

/**
 * 入力済み・無効・投票済み・待機中などの状態表示に使う共通バッジ。
 */
export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  )
}
