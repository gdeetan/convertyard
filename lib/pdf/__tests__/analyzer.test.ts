import { describe, it, expect } from 'vitest'
import { isSubsettedFont, estimateAvgDpi, extractPdfVersion, isPdfLinearized, detectImageColorSpaces } from '../analyzer'

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

describe('extractPdfVersion', () => {
  it('returns version string from PDF header', () => {
    expect(extractPdfVersion('%PDF-1.7\n...')).toBe('1.7')
  })
  it('returns version string for PDF 2.0', () => {
    expect(extractPdfVersion('%PDF-2.0\n')).toBe('2.0')
  })
  it('returns empty string when header missing', () => {
    expect(extractPdfVersion('not a pdf')).toBe('')
  })
})

describe('isPdfLinearized', () => {
  it('returns true when /Linearized appears near start', () => {
    expect(isPdfLinearized('%PDF-1.7\n1 0 obj\n<</Linearized 1>>')).toBe(true)
  })
  it('returns false when /Linearized is absent', () => {
    expect(isPdfLinearized('%PDF-1.7\n1 0 obj\n<<>>')).toBe(false)
  })
})

describe('detectImageColorSpaces', () => {
  it('counts color images correctly', () => {
    const text = '/Subtype /Image /ColorSpace /DeviceRGB\n/Subtype /Image /ColorSpace /DeviceGray'
    expect(detectImageColorSpaces(text)).toEqual({ color: 1, grayscale: 1, monochrome: 0 })
  })
  it('treats DeviceCMYK as color', () => {
    const text = '/Subtype /Image /ColorSpace /DeviceCMYK'
    expect(detectImageColorSpaces(text)).toEqual({ color: 1, grayscale: 0, monochrome: 0 })
  })
  it('returns all zeros for text with no images', () => {
    expect(detectImageColorSpaces('/Type /Page')).toEqual({ color: 0, grayscale: 0, monochrome: 0 })
  })
})
