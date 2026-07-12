import { useEffect, useState } from 'react'
import { getRemainingSeconds } from '../lib/time'

/** Re-derives remaining seconds from the authoritative absolute `deadlineAt` on every tick, so it never drifts from server truth. */
export function useCountdown(deadlineAt: number | null, intervalMs = 250): number {
  const [remainingSeconds, setRemainingSeconds] = useState(() => getRemainingSeconds(deadlineAt))

  useEffect(() => {
    setRemainingSeconds(getRemainingSeconds(deadlineAt))
    if (deadlineAt === null) return
    const id = window.setInterval(() => setRemainingSeconds(getRemainingSeconds(deadlineAt)), intervalMs)
    return () => window.clearInterval(id)
  }, [deadlineAt, intervalMs])

  return remainingSeconds
}
