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
    <div className="rounded-[17px] border-2 border-[#17191f] bg-[#f4d13f] p-4 shadow-[0_5px_0_#17191f]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[9px] font-black tracking-[0.14em] text-[#17191f]">ROOM CODE</span>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-[#17191f] bg-white/50 px-3 py-1 text-xs font-black text-[#17191f] transition hover:bg-white/80"
        >
          {copied ? 'コピーしました' : 'コピー'}
        </button>
      </div>
      <div className="flex justify-center gap-1.5">
        {roomCode.split('').map((char, index) => (
          <span
            key={index}
            className="grid h-11 w-9 place-items-center rounded-lg border border-[#17191f] bg-white/65 text-xl font-black text-[#17191f]"
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  )
}
