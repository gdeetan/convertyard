import { describe, expect, it } from 'vitest'
import {
  leftoverLineBoxes,
  leftoverTextNotInBody,
  rightRemainderBoxes,
  leftRemainderBoxes,
  appendRemainderToOverlappingRow,
  attachRemainderToOverlappingRow,
  stitchRemainder,
  insertTextAtY,
  looksLeftTruncated,
  looksRightTruncated,
  mergeTruncatedLine,
  belowBlockBox,
} from '../leftover-lines'

describe('leftoverLineBoxes', () => {
  it('returns a caption line below Florence boxes', () => {
    const lines = [
      { x: 10, y: 20, w: 200, h: 24 },
      { x: 10, y: 50, w: 200, h: 24 },
      { x: 80, y: 140, w: 90, h: 18 },
    ]
    const quads = [
      [10, 20, 210, 20, 210, 44, 10, 44],
      [10, 50, 210, 50, 210, 74, 10, 74],
    ]
    expect(leftoverLineBoxes(lines, quads, 220)).toEqual([
      { x: 80, y: 140, w: 90, h: 18 },
    ])
  })

  it('returns nothing when Florence already covers the page', () => {
    const lines = [
      { x: 10, y: 20, w: 200, h: 24 },
      { x: 10, y: 50, w: 200, h: 24 },
    ]
    const quads = [[0, 0, 220, 0, 220, 200, 0, 200]]
    expect(leftoverLineBoxes(lines, quads, 200)).toEqual([])
  })

  it('uses a large gap under the main block when Florence has no boxes', () => {
    const lines = [
      { x: 10, y: 10, w: 200, h: 20 },
      { x: 10, y: 36, w: 200, h: 20 },
      { x: 10, y: 62, w: 200, h: 20 },
      { x: 80, y: 150, w: 90, h: 18 },
    ]
    expect(leftoverLineBoxes(lines, null, 200)).toEqual([
      { x: 80, y: 150, w: 90, h: 18 },
    ])
  })

  it('returns nothing for evenly spaced notebook lines', () => {
    const lines = [
      { x: 10, y: 10, w: 200, h: 18 },
      { x: 10, y: 36, w: 200, h: 18 },
      { x: 10, y: 62, w: 200, h: 18 },
      { x: 10, y: 88, w: 200, h: 18 },
    ]
    expect(leftoverLineBoxes(lines, null, 200)).toEqual([])
  })

  it('returns a strip under Florence text for a missed caption', () => {
    const quads = [
      [10, 20, 210, 20, 210, 50, 10, 50],
      [10, 55, 200, 55, 200, 90, 10, 90],
    ]
    const box = belowBlockBox(quads, 400, 300)
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(90)
    expect(box!.y + box!.h).toBeLessThanOrEqual(300)
  })

  it('ignores full-width ruled lines below the main block', () => {
    const lines = [
      { x: 10, y: 20, w: 200, h: 24 },
      { x: 10, y: 50, w: 200, h: 24 },
      { x: 10, y: 120, w: 200, h: 16 },
      { x: 10, y: 145, w: 200, h: 16 },
      { x: 10, y: 170, w: 200, h: 16 },
      { x: 10, y: 195, w: 200, h: 16 },
    ]
    const quads = [
      [10, 20, 210, 20, 210, 44, 10, 44],
      [10, 50, 210, 50, 210, 74, 10, 74],
    ]
    expect(leftoverLineBoxes(lines, quads, 220)).toEqual([])
  })
})

describe('leftoverTextNotInBody', () => {
  it('keeps attribution text that Florence missed', () => {
    expect(
      leftoverTextNotInBody(
        'May the saddest day of your future be no worse',
        '- Irish blessing',
      ),
    ).toBe('- Irish blessing')
  })

  it('drops leftover text already in the body', () => {
    expect(
      leftoverTextNotInBody('May the saddest day of your future', 'saddest day'),
    ).toBe('')
  })

  it('drops long leftover lines that look like hallucination', () => {
    expect(
      leftoverTextNotInBody(
        'Hope everyone is having a good day.',
        'to establish the Government of Australia Print export',
      ),
    ).toBe('')
  })
})

describe('rightRemainderBoxes', () => {
  it('returns the uncovered right edge of a truncated line', () => {
    const lines = [{ x: 10, y: 20, w: 200, h: 24 }]
    const quads = [[10, 20, 140, 20, 140, 44, 10, 44]]
    expect(rightRemainderBoxes(lines, quads)).toEqual([
      { x: 140, y: 20, w: 70, h: 24 },
    ])
  })

  it('returns nothing when Florence already covers the ink', () => {
    const lines = [{ x: 10, y: 20, w: 200, h: 24 }]
    const quads = [[8, 18, 214, 18, 214, 46, 8, 46]]
    expect(rightRemainderBoxes(lines, quads)).toEqual([])
  })
})

describe('leftRemainderBoxes', () => {
  it('returns the uncovered left edge of a truncated line', () => {
    const lines = [{ x: 10, y: 50, w: 200, h: 24 }]
    const quads = [[50, 50, 210, 50, 210, 74, 50, 74]]
    expect(leftRemainderBoxes(lines, quads)).toEqual([
      { x: 10, y: 50, w: 40, h: 24 },
    ])
  })
})

describe('stitchRemainder', () => {
  it('prepends a clipped first letter without a space', () => {
    expect(stitchRemainder('orse than the happiest', 'w', 'left')).toBe('worse than the happiest')
  })

  it('stitches overlapping And onto d may', () => {
    expect(stitchRemainder('d may the most', 'And', 'left')).toBe('And may the most')
  })
})

describe('insertTextAtY', () => {
  it('inserts a signature above a later P.S. line', () => {
    const body = 'Anyway, thanks for reading!\nP.S. THIS IS WRITTEN WITH A MICRON 05.'
    const rows = [
      { y0: 10, y1: 40 },
      { y0: 80, y1: 110 },
    ]
    expect(insertTextAtY(body, rows, 50, '- Traddington Bear')).toBe(
      'Anyway, thanks for reading!\n- Traddington Bear\nP.S. THIS IS WRITTEN WITH A MICRON 05.',
    )
  })
})

describe('appendRemainderToOverlappingRow', () => {
  it('appends missing end words onto the overlapping Florence line', () => {
    const body = 'This is a handwriting test to see how it lo\non lined paper. For the past two weeks I hav'
    const rows = [
      { y0: 10, y1: 40 },
      { y0: 42, y1: 70 },
    ]
    expect(
      appendRemainderToOverlappingRow(body, rows, { x: 180, y: 12, w: 40, h: 22 }, 'looks'),
    ).toBe('This is a handwriting test to see how it looks\non lined paper. For the past two weeks I hav')
  })

  it('prepends a clipped line start onto the overlapping Florence line', () => {
    const body = 'orse than the happiest day of your past.'
    const rows = [{ y0: 48, y1: 76 }]
    expect(
      attachRemainderToOverlappingRow(
        body,
        rows,
        { x: 10, y: 50, w: 40, h: 22 },
        'w',
        'left',
      ),
    ).toBe('worse than the happiest day of your past.')
  })
})

describe('truncated line repair', () => {
  it('detects clipped line starts', () => {
    expect(looksLeftTruncated('orse than the happiest day')).toBe(true)
    expect(looksLeftTruncated('d may the most you wish for')).toBe(true)
    expect(looksLeftTruncated('May the saddest day')).toBe(false)
  })

  it('detects clipped line ends', () => {
    expect(looksRightTruncated('you wish for be th')).toBe(true)
    expect(looksRightTruncated('of your future be')).toBe(false)
  })

  it('only replaces a Florence line when TrOCR contains that line', () => {
    expect(
      mergeTruncatedLine(
        'May the saddest day of your future be',
        'worse than the happiest day of your past.',
      ),
    ).toBe('May the saddest day of your future be')
    expect(
      mergeTruncatedLine(
        'orse than the happiest',
        'worse than the happiest day of your past.',
      ),
    ).toBe('worse than the happiest day of your past.')
  })
})
