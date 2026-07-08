import { describe, expect, it } from 'vitest'

import { choosePrimaryAiRoute, type AiRouteStats } from '../ai-route'

function stats(partial: Partial<AiRouteStats>): AiRouteStats {
  return {
    lineCount: 0,
    avgWidthRatio: 0,
    medianWidthRatio: 0,
    maxWidthRatio: 0,
    avgHeightPx: 0,
    ...partial,
  }
}

describe('choosePrimaryAiRoute', () => {
  it('routes cursive multi-line pages to trocr first', () => {
    expect(choosePrimaryAiRoute('cursive', stats({
      lineCount: 8,
      avgWidthRatio: 0.72,
      medianWidthRatio: 0.75,
      maxWidthRatio: 0.9,
      avgHeightPx: 84,
    }))).toBe('trocr')
  })

  it('routes mixed line-rich notes to trocr first', () => {
    expect(choosePrimaryAiRoute('mixed', stats({
      lineCount: 6,
      avgWidthRatio: 0.68,
      medianWidthRatio: 0.7,
      maxWidthRatio: 0.88,
      avgHeightPx: 78,
    }))).toBe('trocr')
  })

  it('keeps sparse or form-like layouts on florence first', () => {
    expect(choosePrimaryAiRoute('mixed', stats({
      lineCount: 1,
      avgWidthRatio: 0.22,
      medianWidthRatio: 0.22,
      maxWidthRatio: 0.22,
      avgHeightPx: 42,
    }))).toBe('florence')
  })

  it('keeps print style on florence first by default', () => {
    expect(choosePrimaryAiRoute('print', stats({
      lineCount: 10,
      avgWidthRatio: 0.8,
      medianWidthRatio: 0.82,
      maxWidthRatio: 0.95,
      avgHeightPx: 56,
    }))).toBe('florence')
  })
})
