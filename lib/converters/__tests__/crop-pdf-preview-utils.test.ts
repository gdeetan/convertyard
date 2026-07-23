import { describe, it, expect } from 'vitest'
import { resolveCropMargins, calcOverlayPct, MM_TO_PT } from '../crop-pdf-preview-utils'

describe('resolveCropMargins', () => {
  it('resolves preset mm string to all four sides', () => {
    expect(resolveCropMargins({ preset: '10mm' })).toEqual(
      { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 }
    )
  })

  it('handles 5mm preset', () => {
    expect(resolveCropMargins({ preset: '5mm' })).toEqual(
      { topMm: 5, rightMm: 5, bottomMm: 5, leftMm: 5 }
    )
  })

  it('handles 15mm and 20mm presets', () => {
    expect(resolveCropMargins({ preset: '15mm' })).toEqual(
      { topMm: 15, rightMm: 15, bottomMm: 15, leftMm: 15 }
    )
    expect(resolveCropMargins({ preset: '20mm' })).toEqual(
      { topMm: 20, rightMm: 20, bottomMm: 20, leftMm: 20 }
    )
  })

  it('uses individual values when preset is custom', () => {
    expect(
      resolveCropMargins({ preset: 'custom', topMm: 5, rightMm: 10, bottomMm: 15, leftMm: 20 })
    ).toEqual({ topMm: 5, rightMm: 10, bottomMm: 15, leftMm: 20 })
  })

  it('defaults to 10 for missing custom values', () => {
    expect(resolveCropMargins({ preset: 'custom' })).toEqual(
      { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 }
    )
  })

  it('defaults to 10mm when preset is missing', () => {
    expect(resolveCropMargins({})).toEqual(
      { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 }
    )
  })
})

describe('calcOverlayPct', () => {
  it('computes correct percentages for an A4 page (595 × 842 pt)', () => {
    const result = calcOverlayPct(
      { topMm: 10, rightMm: 10, bottomMm: 10, leftMm: 10 },
      595,
      842
    )
    expect(result.leftPct).toBeCloseTo((10 * MM_TO_PT) / 595 * 100, 3)
    expect(result.rightPct).toBeCloseTo((10 * MM_TO_PT) / 595 * 100, 3)
    expect(result.topPct).toBeCloseTo((10 * MM_TO_PT) / 842 * 100, 3)
    expect(result.bottomPct).toBeCloseTo((10 * MM_TO_PT) / 842 * 100, 3)
  })

  it('handles asymmetric margins', () => {
    const result = calcOverlayPct(
      { topMm: 5, rightMm: 10, bottomMm: 15, leftMm: 20 },
      595,
      842
    )
    expect(result.topPct).toBeCloseTo((5  * MM_TO_PT) / 842 * 100, 3)
    expect(result.rightPct).toBeCloseTo((10 * MM_TO_PT) / 595 * 100, 3)
    expect(result.bottomPct).toBeCloseTo((15 * MM_TO_PT) / 842 * 100, 3)
    expect(result.leftPct).toBeCloseTo((20 * MM_TO_PT) / 595 * 100, 3)
  })

  it('returns zero percentages when all margins are 0', () => {
    const result = calcOverlayPct({ topMm: 0, rightMm: 0, bottomMm: 0, leftMm: 0 }, 595, 842)
    expect(result).toEqual({ topPct: 0, rightPct: 0, bottomPct: 0, leftPct: 0 })
  })
})
