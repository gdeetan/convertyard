import { describe, expect, it } from 'vitest'
import { leftoverLineBoxes, leftoverTextNotInBody } from '../leftover-lines'

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
})
