import { describe, expect, it } from 'vitest'

import { estimateRemainingMs, formatPct, formatRemaining } from '../conversion-eta'

describe('estimateRemainingMs', () => {
  it('scales remaining time from elapsed / percent done', () => {
    // 10% done after 60s → 9× that still to go
    expect(estimateRemainingMs(60_000, 10)).toBe(540_000)
  })

  it('does not guess during warmup', () => {
    expect(estimateRemainingMs(500, 20)).toBeNull()
    expect(estimateRemainingMs(60_000, 1)).toBeNull()
  })
})

describe('formatRemaining', () => {
  it('uses minutes once the wait is over a minute', () => {
    expect(formatRemaining(540_000)).toBe('about 9 min remaining')
  })
})

describe('formatPct', () => {
  it('shows one decimal below 20% so a long 360p encode is not stuck on 5%', () => {
    expect(formatPct(5.14)).toBe('5.1')
    expect(formatPct(48.6)).toBe('49')
  })
})
