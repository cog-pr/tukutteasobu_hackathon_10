import { CHALLENGE_CONFIG } from '../constants'

export type ValidateRevengeProgressInput = {
  previousValue: number
  nextValue: number
  elapsedMs: number
  maxTapsPerSecond?: number
}

/**
 * Guards a REVENGE_PROGRESS tap count against tampering: it must never
 * decrease, and it must not grow faster than a plausible human tap rate.
 */
export function validateRevengeProgress({
  previousValue,
  nextValue,
  elapsedMs,
  maxTapsPerSecond = CHALLENGE_CONFIG.rapidTap.maxTapsPerSecond,
}: ValidateRevengeProgressInput): boolean {
  if (!Number.isInteger(nextValue) || nextValue < 0) return false
  if (nextValue < previousValue) return false

  const maxAllowedIncrease = (maxTapsPerSecond * Math.max(elapsedMs, 0)) / 1000 + 1
  return nextValue - previousValue <= maxAllowedIncrease
}
