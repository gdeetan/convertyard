import { describe, it, expect } from 'vitest'
import { clusterValues, detectHeadingLevel, detectTables, baseLeftMargin, isListItem } from '../pdf-to-word'

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

// Build a grid of blocks: colX x-positions, rowY y-positions, each block 80pt wide 14pt tall
function makeGrid(
  colX: number[],
  rowY: number[],
  texts?: string[][]
): import('../pdf-to-word').StBlockPublic[] {
  const blocks: import('../pdf-to-word').StBlockPublic[] = []
  rowY.forEach((y, r) => {
    colX.forEach((x, c) => {
      const text = texts?.[r]?.[c] ?? `r${r}c${c}`
      blocks.push({
        type: 'text',
        bbox: [x, y, x + 80, y + 14],
        lines: [{
          bbox: [x, y, x + 80, y + 14],
          spans: [{
            text,
            size: 12,
            font: { name: 'Arial', weight: 'normal', style: 'normal' },
          }],
        }],
      })
    })
  })
  return blocks
}

describe('baseLeftMargin', () => {
  it('returns the modal x1 across text blocks', () => {
    const blocks = [
      makeBlock({ text: 'a', bbox: [72, 100, 300, 120] }),
      makeBlock({ text: 'b', bbox: [72, 130, 300, 150] }),
      makeBlock({ text: 'c', bbox: [72, 160, 300, 180] }),
      makeBlock({ text: 'd', bbox: [144, 190, 300, 210] }), // outlier
    ]
    expect(baseLeftMargin(blocks)).toBe(72)
  })

  it('returns 0 for empty block list', () => {
    expect(baseLeftMargin([])).toBe(0)
  })

  it('ignores image blocks', () => {
    const imageBlock: import('../pdf-to-word').StBlockPublic = {
      type: 'image',
      bbox: [200, 50, 400, 90],
      lines: [],
    }
    const textBlock = makeBlock({ text: 'a', bbox: [72, 100, 300, 120] })
    expect(baseLeftMargin([imageBlock, textBlock])).toBe(72)
  })
})

describe('isListItem', () => {
  const BASE = 72

  it('detects indent beyond base margin as list item', () => {
    const block = makeBlock({ text: 'Item one', bbox: [100, 100, 300, 120] }) // 100 > 72 + 15
    expect(isListItem(block, BASE)).toBe(true)
  })

  it('does not flag block at base margin as list item', () => {
    const block = makeBlock({ text: 'Normal paragraph', bbox: [72, 100, 300, 120] })
    expect(isListItem(block, BASE)).toBe(false)
  })

  it('detects bullet prefix as list item even without indent', () => {
    const block = makeBlock({ text: '• Bullet item', bbox: [72, 100, 300, 120] })
    expect(isListItem(block, BASE)).toBe(true)
  })

  it('detects numbered prefix as list item', () => {
    const block = makeBlock({ text: '1. First item', bbox: [72, 100, 300, 120] })
    expect(isListItem(block, BASE)).toBe(true)
  })

  it('does not flag a heading-level indent block when already heading (caller guards)', () => {
    // isListItem doesn't know about headings — the caller skips it for headings.
    // Verify it still returns true so the caller's guard is meaningful.
    const block = makeBlock({ text: 'SECTION TITLE', bbox: [90, 100, 300, 120] })
    expect(isListItem(block, BASE)).toBe(true)
  })
})

describe('detectTables', () => {
  it('detects a 3-column 2-row table', () => {
    const blocks = makeGrid([72, 220, 368], [100, 120])
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(1)
    expect(tables[0].consumedIndices.size).toBe(6)
  })

  it('detects a 2-column 3-row table', () => {
    const blocks = makeGrid([72, 300], [100, 120, 140])
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(1)
    expect(tables[0].consumedIndices.size).toBe(6)
  })

  it('does NOT detect a 2-column 2-row layout (too ambiguous)', () => {
    const blocks = makeGrid([72, 300], [100, 120])
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(0)
  })

  it('does NOT detect a single column of blocks', () => {
    const blocks = makeGrid([72], [100, 120, 140, 160])
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(0)
  })

  it('ignores image blocks', () => {
    const textBlocks = makeGrid([72, 220, 368], [100, 120])
    const imageBlock: import('../pdf-to-word').StBlockPublic = {
      type: 'image',
      bbox: [72, 50, 400, 90],
      lines: [],
    }
    const tables = detectTables([imageBlock, ...textBlocks])
    expect(tables).toHaveLength(1)
    expect(tables[0].consumedIndices.has(0)).toBe(false) // image block (index 0) not consumed
  })

  it('returns correct row and col counts', () => {
    const texts = [['Alpha', 'Beta', 'Gamma'], ['One', 'Two', 'Three']]
    const blocks = makeGrid([72, 220, 368], [100, 120], texts)
    const tables = detectTables(blocks)
    expect(tables).toHaveLength(1)
    expect(tables[0].rows).toBe(2)
    expect(tables[0].cols).toBe(3)
  })

  it('returns empty array for fewer than 3 blocks total', () => {
    const blocks = makeGrid([72, 220], [100])
    expect(detectTables(blocks)).toHaveLength(0)
  })
})
