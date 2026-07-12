import { describe, expect, it } from 'vitest'

import { validateRevengeProgress } from './validateRevengeProgress'

describe('validateRevengeProgress', () => {
  it('accepts a plausible monotonic increment', () => {
    expect(validateRevengeProgress({ previousValue: 5, nextValue: 8, elapsedMs: 500, maxTapsPerSecond: 12 })).toBe(true)
  })

  it('rejects a decreasing value', () => {
    expect(validateRevengeProgress({ previousValue: 10, nextValue: 9, elapsedMs: 500, maxTapsPerSecond: 12 })).toBe(false)
  })

  it('rejects a jump faster than the allowed tap rate', () => {
    expect(validateRevengeProgress({ previousValue: 0, nextValue: 35, elapsedMs: 200, maxTapsPerSecond: 12 })).toBe(false)
  })

  it('accepts the boundary at exactly the allowed rate', () => {
    // 12 taps/sec over 1000ms = 12, +1 slack = 13
    expect(validateRevengeProgress({ previousValue: 0, nextValue: 13, elapsedMs: 1_000, maxTapsPerSecond: 12 })).toBe(true)
    expect(validateRevengeProgress({ previousValue: 0, nextValue: 14, elapsedMs: 1_000, maxTapsPerSecond: 12 })).toBe(false)
  })

  it('rejects non-integer or negative values', () => {
    expect(validateRevengeProgress({ previousValue: 0, nextValue: 1.5, elapsedMs: 1_000 })).toBe(false)
    expect(validateRevengeProgress({ previousValue: 0, nextValue: -1, elapsedMs: 1_000 })).toBe(false)
  })
})
