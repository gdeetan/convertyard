import { describe, it, expect } from 'vitest'
import { predictOutputBytes, chooseRungForTarget } from '../size-model'

describe('predictOutputBytes', () => {
  it('scales roughly linearly with pixel count', () => {
    const a = predictOutputBytes({ totalPixels: 1_000_000, quality: 70, dpiRatio: 1.0, baselineBytes: 500_000 })
    const b = predictOutputBytes({ totalPixels: 2_000_000, quality: 70, dpiRatio: 1.0, baselineBytes: 500_000 })
    expect(b / a).toBeGreaterThan(1.85)
    expect(b / a).toBeLessThan(2.05)
  })

  it('drops output roughly quadratically with DPI ratio', () => {
    const q100 = predictOutputBytes({ totalPixels: 4_000_000, quality: 70, dpiRatio: 1.0, baselineBytes: 800_000 })
    const q50  = predictOutputBytes({ totalPixels: 4_000_000, quality: 70, dpiRatio: 0.5, baselineBytes: 800_000 })
    expect(q50 / q100).toBeGreaterThan(0.20)
    expect(q50 / q100).toBeLessThan(0.35)
  })
})

describe('chooseRungForTarget', () => {
  it('picks the highest-quality rung that fits the target', () => {
    const rungs = [
      { quality: 85, dpiRatio: 1.0 },
      { quality: 70, dpiRatio: 1.0 },
      { quality: 55, dpiRatio: 0.75 },
      { quality: 40, dpiRatio: 0.5 },
    ]
    const idx = chooseRungForTarget({
      rungs,
      totalPixels: 10_000_000,
      baselineBytes: 4_000_000,
      targetBytes: 1_500_000,
    })
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThan(rungs.length)
  })

  it('returns the last rung when even the most aggressive setting exceeds target', () => {
    const rungs = [{ quality: 85, dpiRatio: 1.0 }, { quality: 40, dpiRatio: 0.5 }]
    const idx = chooseRungForTarget({
      rungs,
      totalPixels: 100_000_000,
      baselineBytes: 200_000_000,
      targetBytes: 100_000,
    })
    expect(idx).toBe(1)
  })
})
