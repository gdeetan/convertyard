import { describe, it, expect } from 'vitest'
import { estimateSavings } from '../savings-estimator'
import type { PdfAnalysis } from '../analyzer'

const baseAnalysis: PdfAnalysis = {
  pageCount: 5,
  fileSize: 10_000_000,
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
      { name: 'ABCDEF+Times', isSubset: true },
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
  it('total estimated savings does not exceed fileSize', () => {
    const result = estimateSavings(baseAnalysis, {})
    expect(result.estimatedSavingsBytes).toBeLessThanOrEqual(baseAnalysis.fileSize)
  })

  it('estimatedFinalSize + estimatedSavingsBytes equals fileSize', () => {
    const result = estimateSavings(baseAnalysis, {})
    expect(result.estimatedFinalSize + result.estimatedSavingsBytes).toBe(baseAnalysis.fileSize)
  })

  it('imageDownsampling savings > 0 when avgDpi > 150', () => {
    const result = estimateSavings(baseAnalysis, {})
    expect(result.perTechnique.imageDownsampling.savingsBytes).toBeGreaterThan(0)
  })

  it('imageDownsampling savings is 0 when avgDpi <= 150', () => {
    const lowDpi = {
      ...baseAnalysis,
      images: { ...baseAnalysis.images, avgDpi: 72, highDpiCount: 0 },
    }
    const result = estimateSavings(lowDpi, {})
    expect(result.perTechnique.imageDownsampling.savingsBytes).toBe(0)
  })

  it('grayscaleConversion savings > 0 when grayscale is true', () => {
    const result = estimateSavings(baseAnalysis, { grayscale: true })
    expect(result.perTechnique.grayscaleConversion.savingsBytes).toBeGreaterThan(0)
  })

  it('grayscaleConversion savings is 0 when grayscale is false', () => {
    const result = estimateSavings(baseAnalysis, { grayscale: false })
    expect(result.perTechnique.grayscaleConversion.savingsBytes).toBe(0)
  })

  it('fontSubsetting savings > 0 when unsubsetted fonts exist', () => {
    const result = estimateSavings(baseAnalysis, { subsetFonts: true })
    expect(result.perTechnique.fontSubsetting.savingsBytes).toBeGreaterThan(0)
  })

  it('fontSubsetting savings is 0 when all fonts are subsetted', () => {
    const allSubset = { ...baseAnalysis, fonts: { ...baseAnalysis.fonts, unsubsettedCount: 0 } }
    const result = estimateSavings(allSubset, { subsetFonts: true })
    expect(result.perTechnique.fontSubsetting.savingsBytes).toBe(0)
  })

  it('estimatedSavingsPercent is 0 for fileSize 0', () => {
    const zeroSize = { ...baseAnalysis, fileSize: 0, images: { ...baseAnalysis.images, count: 0, totalEstimatedBytes: 0 } }
    const result = estimateSavings(zeroSize, {})
    expect(result.estimatedSavingsPercent).toBe(0)
  })

  it('contentStreamOptimization savings is always > 0 for non-zero files', () => {
    const result = estimateSavings(baseAnalysis, {})
    expect(result.perTechnique.contentStreamOptimization.savingsBytes).toBeGreaterThan(0)
  })
})
