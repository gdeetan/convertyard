import { describe, expect, it } from 'vitest'

import {
  cer,
  lineBreakAccuracy,
  normalizeForBenchmark,
  summarizeBenchmarkResults,
  wer,
} from '../benchmark'

describe('normalizeForBenchmark', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeForBenchmark(' Hello \n  World ')).toBe('hello world')
  })
})

describe('cer', () => {
  it('returns zero for identical normalized strings', () => {
    expect(cer('Hello\nWorld', 'hello world')).toBe(0)
  })

  it('returns edit distance over ground truth length', () => {
    expect(cer('cot', 'cat')).toBeCloseTo(1 / 3, 5)
  })
})

describe('wer', () => {
  it('returns zero for exact token match', () => {
    expect(wer('this is text', 'this is text')).toBe(0)
  })

  it('uses word-level levenshtein instead of set overlap', () => {
    expect(wer('this text', 'this is text')).toBeCloseTo(1 / 3, 5)
  })
})

describe('lineBreakAccuracy', () => {
  it('returns one when line structure matches', () => {
    expect(lineBreakAccuracy('one\ntwo', 'one\ntwo')).toBe(1)
  })

  it('penalizes merged lines', () => {
    expect(lineBreakAccuracy('one two', 'one\ntwo')).toBe(0)
  })
})

describe('summarizeBenchmarkResults', () => {
  it('aggregates totals and per-category averages', () => {
    const summary = summarizeBenchmarkResults([
      { fixture: 'a', category: 'clean-print', cer: 0.1, wer: 0.2, lineBreakAccuracy: 1, route: 'florence' },
      { fixture: 'b', category: 'clean-print', cer: 0.3, wer: 0.4, lineBreakAccuracy: 0.5, route: 'trocr' },
      { fixture: 'c', category: 'cursive', cer: 0.5, wer: 0.6, lineBreakAccuracy: 0.25, route: 'florence' },
    ])

    expect(summary.fixtureCount).toBe(3)
    expect(summary.routeCounts).toEqual({ florence: 2, trocr: 1 })
    expect(summary.average.cer).toBeCloseTo(0.3, 5)
    expect(summary.byCategory['clean-print'].fixtureCount).toBe(2)
    expect(summary.byCategory['clean-print'].average.lineBreakAccuracy).toBeCloseTo(0.75, 5)
  })
})
