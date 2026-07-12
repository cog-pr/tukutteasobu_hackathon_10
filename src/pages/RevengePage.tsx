import { useEffect, useRef, useState } from 'react'
import { Card } from '../components/Card'
import { PhoneScreen } from '../components/PhoneScreen'
import { TimerBar } from '../components/TimerBar'
import { useCountdown } from '../client/hooks/useCountdown'
import { useRoomSocketContext } from '../client/context/RoomSocketContext'
import { CHALLENGE_CONFIG } from '../shared/constants'

const REQUIRED_TAPS = CHALLENGE_CONFIG.rapidTap.requiredCount
const FLUSH_INTERVAL_MS = 150

export function RevengePage() {
  const { sendRevengeProgress, sendRevengeResult, roomState } = useRoomSocketContext()
  const [taps, setTaps] = useState(0)
  const remaining = useCountdown(roomState?.deadlineAt ?? null)
  const tapsRef = useRef(0)
  const sentRef = useRef(0)
  const finishedRef = useRef(false)

  useEffect(() => {
    const id = window.setInterval(() => {
      if (tapsRef.current !== sentRef.current) {
        sentRef.current = tapsRef.current
        sendRevengeProgress(sentRef.current)
        if (sentRef.current >= REQUIRED_TAPS && !finishedRef.current) {
          finishedRef.current = true
          sendRevengeResult('success')
        }
      }
    }, FLUSH_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [sendRevengeProgress, sendRevengeResult])

  const tap = (event: React.PointerEvent) => {
    if (!event.isPrimary || tapsRef.current >= REQUIRED_TAPS) return
    tapsRef.current += 1
    setTaps(tapsRef.current)
  }

  return (
    <PhoneScreen className="gap-4">
      <Card className="border-[#46d6e7] bg-[#e8fbfd] text-center"><p className="text-sm font-black">AIの勝利！ しかし……</p><p className="mt-1 text-lg font-black">人類には肉体がある</p></Card>
      <Card className="text-center"><p className="text-lg font-black">超連打チャレンジ</p><p className="text-xs">{CHALLENGE_CONFIG.rapidTap.durationMs / 1000}秒以内に{REQUIRED_TAPS}タップ</p></Card>
      <div className="flex gap-3">
        <Card className="flex-1 text-center"><p className="text-xs">残り時間</p><p className="text-lg font-black text-rose-500">{remaining}秒</p></Card>
        <Card className="flex-1 text-center"><p className="text-xs">回数</p><p className="text-lg font-black">{taps} / {REQUIRED_TAPS}</p></Card>
      </div>
      <TimerBar remainingSeconds={remaining} totalSeconds={CHALLENGE_CONFIG.rapidTap.durationMs / 1000} />
      <div className="grid place-items-center py-4">
        <button type="button" onPointerDown={tap} className="grid h-40 w-40 place-items-center rounded-full border-[3px] border-[#17191f] bg-[#f4d13f] text-xl font-black shadow-[9px_8px_0_#17191f] active:translate-y-1 active:shadow-none">連打<br />TAP!</button>
      </div>
    </PhoneScreen>
  )
}
