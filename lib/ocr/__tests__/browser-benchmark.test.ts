import { describe, expect, it } from 'vitest'

import { inferRouteFromLogs } from '../browser-benchmark'

describe('inferRouteFromLogs', () => {
  it('prefers explicit AI route logs when present', () => {
    expect(inferRouteFromLogs([
      '[AI Route] primary=trocr lines=8 avgWidth=0.72 style=cursive',
    ])).toBe('trocr')
  })

  it('defaults to florence when no fallback logs appear', () => {
    expect(inferRouteFromLogs([])).toBe('florence')
  })

  it('detects trocr when florence fails but tesseract fallback does not happen', () => {
    expect(inferRouteFromLogs([
      '[Florence-2] OCR failed, falling back to TrOCR: Error: x',
      '[TrOCR] Loaded trocr-base (fp32)',
    ])).toBe('trocr')
  })

  it('detects tesseract when TrOCR falls through to final fallback', () => {
    expect(inferRouteFromLogs([
      '[Florence-2] Empty OCR result — falling back to TrOCR',
      '[TrOCR] Model unavailable, falling back to Tesseract: Error: x',
    ])).toBe('tesseract')
  })
})
