import { describe, it, expect } from 'vitest'
import { estimateSavings } from '../savings-estimator'
import type { PdfAnalysis } from '../analyzer'

const baseAnalysis: PdfAnalysis = {
  pageCount: 5,
  fileSize: 6_000_000,
  pdfVersion: '1.7',
  isLinearized: false,
  images: {
    count: 10,
    totalEstimatedBytes: 5_000_000,
    avgDpi: 300,
    highDpiCount: 10,
    byColorSpace: { color: 8, grayscale: 2, monochrome: 0 },
  },
  fonts: {
    count: 4,
    unsubsettedCount: 2,
    estimatedBytes: 120_000,
    fontsList: [
      { name: 'Arial', isSubset: false },
      { name: 'ABCDEF+TimesNewRoman', isSubset: true },
    ],
  },
  hasMetadata: true,
  hasAnnotations: false,
  annotationCount: 0,
  hasBookmarks: false,
  hasJS: false,
  hasEmbeddedFiles: false,
  formFieldCount: 0,
}

describe('estimateSavings', () => {
  it('returns estimates sorted by estimatedBytes descending', () => {
    const results = estimateSavings(baseAnalysis, { stripMetadata: true })
    const bytes = results.map(r => r.estimatedBytes)
    expect(bytes).toEqual([...bytes].sort((a, b) => b - a))
  })

  it('marks downsample as enabled when image avgDpi > 150', () => {
    const results = estimateSavings(baseAnalysis, {})
    const downsample = results.find(r => r.technique.includes('Downsample'))
    expect(downsample).toBeDefined()
    expect(downsample!.enabled).toBe(true)
  })

  it('marks metadata strip as disabled when stripMetadata is false', () => {
    const results = estimateSavings(baseAnalysis, { stripMetadata: false })
    const meta = results.find(r => r.technique.includes('metadata'))
    expect(meta).toBeDefined()
    expect(meta!.enabled).toBe(false)
  })

  it('includes grayscale estimate only when grayscale option is true', () => {
    const without = estimateSavings(baseAnalysis, { grayscale: false })
    const with_ = estimateSavings(baseAnalysis, { grayscale: true })
    expect(without.find(r => r.technique.includes('grayscale'))).toBeUndefined()
    expect(with_.find(r => r.technique.includes('grayscale'))).toBeDefined()
  })

  it('returns empty array for text-only PDF with no extras', () => {
    const textOnly: PdfAnalysis = {
      ...baseAnalysis,
      images: { count: 0, totalEstimatedBytes: 0, avgDpi: 0, highDpiCount: 0, byColorSpace: { color: 0, grayscale: 0, monochrome: 0 } },
      fonts: { count: 2, unsubsettedCount: 0, estimatedBytes: 0, fontsList: [] },
      hasMetadata: false,
      hasAnnotations: false,
    }
    const results = estimateSavings(textOnly, {})
    expect(results.length).toBe(0)
  })
})
