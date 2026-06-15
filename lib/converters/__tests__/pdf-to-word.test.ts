import { describe, it, expect } from 'vitest'
import { clusterValues, detectHeadingLevel } from '../pdf-to-word'

describe('clusterValues', () => {
  it('groups values within tolerance', () => {
    const result = clusterValues([10, 12, 50, 53, 100], 5)
    expect(result).toEqual([[10, 12], [50, 53], [100]])
  })

  it('returns empty array for empty input', () => {
    expect(clusterValues([], 10)).toEqual([])
  })

  it('single value makes one cluster', () => {
    expect(clusterValues([42], 10)).toEqual([[42]])
  })

  it('all values in one cluster when within tolerance', () => {
    expect(clusterValues([1, 3, 5], 5)).toEqual([[1, 3, 5]])
  })

  it('exact tolerance boundary: values exactly tolerance apart are in same cluster', () => {
    expect(clusterValues([0, 10], 10)).toEqual([[0, 10]])
  })

  it('values tolerance+1 apart are in different clusters', () => {
    expect(clusterValues([0, 11], 10)).toEqual([[0], [11]])
  })

  it('sorts input before clustering', () => {
    const result = clusterValues([100, 10, 50], 5)
    expect(result).toEqual([[10], [50], [100]])
  })
})

// Helper to build a minimal StBlock for testing
function makeBlock(opts: {
  text: string
  size?: number
  weight?: string
  bbox?: [number, number, number, number]
}): import('../pdf-to-word').StBlockPublic {
  return {
    type: 'text',
    bbox: opts.bbox ?? [72, 100, 400, 120],
    lines: [{
      bbox: opts.bbox ?? [72, 100, 400, 120],
      spans: [{
        text: opts.text,
        size: opts.size ?? 12,
        font: { name: 'Arial', weight: opts.weight ?? 'normal', style: 'normal' },
        bbox: opts.bbox ?? [72, 100, 400, 120],
      }],
    }],
  }
}

describe('detectHeadingLevel', () => {
  const BODY = 12
  const PAGE_W = 612 // US Letter width in points

  it('returns H1 for font size ≥1.8× body', () => {
    const block = makeBlock({ text: 'Big Title', size: 22 })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading1')
  })

  it('returns H2 for font size ≥1.35× body', () => {
    const block = makeBlock({ text: 'Section', size: 17 })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading2')
  })

  it('returns H3 for font size ≥1.15× body', () => {
    const block = makeBlock({ text: 'Subsection', size: 14 })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading3')
  })

  it('returns null for body-size non-heading paragraph', () => {
    const block = makeBlock({ text: 'This is a normal paragraph with several words in it.' })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBeNull()
  })

  it('returns H3 for short all-caps text at body size', () => {
    const block = makeBlock({ text: 'INTRODUCTION' })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading3')
  })

  it('returns null for long all-caps text (>12 words)', () => {
    const block = makeBlock({ text: 'THIS IS A VERY LONG SENTENCE THAT SHOULD NOT BE A HEADING AT ALL' })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBeNull()
  })

  it('returns H3 for short centered bold text at body size', () => {
    // Centered on 612pt page: block x1=206, x2=406, center=306 ≈ page center 306
    const block = makeBlock({ text: 'Summary', weight: 'bold', bbox: [206, 100, 406, 120] })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBe('Heading3')
  })

  it('returns null for body-size bold text that is too long', () => {
    const block = makeBlock({
      text: 'This bold sentence is too long to be a heading because it has many many words',
      weight: 'bold',
    })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBeNull()
  })

  it('returns null for text with more than 20 words regardless of size', () => {
    const text = 'word '.repeat(21).trim()
    const block = makeBlock({ text, size: 24 })
    expect(detectHeadingLevel(block, BODY, PAGE_W)).toBeNull()
  })
})
