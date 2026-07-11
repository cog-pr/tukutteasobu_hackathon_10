import { useState } from 'react'

type RoomCodeBadgeProps = {
  roomCode: string
}

/**
 * ルームコードを1文字ずつのボックスで表示し、コピー操作を提供する。
 */
export function RoomCodeBadge({ roomCode }: RoomCodeBadgeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-500">ルームコード</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-bold text-neutral-700 transition hover:bg-neutral-100"
        >
          {copied ? 'コピーしました' : 'コピー'}
        </button>
      </div>
      <div className="flex justify-center gap-1.5">
        {roomCode.split('').map((char, index) => (
          <span
            key={index}
            className="grid h-11 w-9 place-items-center rounded-lg border border-neutral-300 bg-neutral-50 text-xl font-black text-neutral-900"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  )
}
