import { describe, it, expect } from 'vitest'
import { isSubsettedFont, estimateAvgDpi } from '../analyzer'

describe('isSubsettedFont', () => {
  it('returns true for 6-uppercase-char prefixed fonts', () => {
    expect(isSubsettedFont('ABCDEF+Arial')).toBe(true)
    expect(isSubsettedFont('XYZABC+TimesNewRoman')).toBe(true)
  })

  it('returns false for non-subsetted fonts', () => {
    expect(isSubsettedFont('Arial')).toBe(false)
    expect(isSubsettedFont('abcdef+Arial')).toBe(false)
    expect(isSubsettedFont('ABCDE+Arial')).toBe(false)
  })
})

describe('estimateAvgDpi', () => {
  it('returns 0 when imageCount is 0', () => {
    expect(estimateAvgDpi(0, 100_000, 595)).toBe(0)
  })

  it('clamps DPI between 72 and 600', () => {
    expect(estimateAvgDpi(1, 50_000, 595)).toBeGreaterThanOrEqual(72)
    expect(estimateAvgDpi(1, 50_000, 595)).toBeLessThanOrEqual(600)
  })
})
