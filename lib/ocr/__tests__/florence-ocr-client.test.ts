import { describe, expect, it } from 'vitest'

import {
  buildFlorenceReadingText,
  normalizeOcrText,
  sortRegionsToReadingOrder,
  type OcrRegions,
} from '../florence-ocr-client'

describe('sortRegionsToReadingOrder', () => {
  it('groups nearby regions onto the same line and sorts left-to-right', () => {
    const regions: OcrRegions = {
      labels: ['world', 'Hello', 'Second line'],
      quad_boxes: [
        [60, 12, 110, 12, 110, 32, 60, 32],
        [10, 10, 50, 10, 50, 30, 10, 30],
        [12, 50, 120, 50, 120, 70, 12, 70],
      ],
    }

    expect(sortRegionsToReadingOrder(regions)).toEqual(['Hello world', 'Second line'])
  })

  it('inserts a paragraph break when vertical gap is much larger than line height', () => {
    const regions: OcrRegions = {
      labels: ['First line', 'Second paragraph'],
      quad_boxes: [
        [10, 10, 110, 10, 110, 30, 10, 30],
        [10, 90, 140, 90, 140, 110, 10, 110],
      ],
    }

    expect(sortRegionsToReadingOrder(regions)).toEqual(['First line', '', 'Second paragraph'])
  })
})

describe('normalizeOcrText', () => {
  it('removes spaces before punctuation and collapses repeated spaces', () => {
    expect(normalizeOcrText('Hello  ,   world !')).toBe('Hello, world!')
  })

  it('keeps intentional line breaks while trimming noisy blank lines', () => {
    expect(normalizeOcrText('Line one \n\n\n Line two  ')).toBe('Line one\n\nLine two')
  })
})

describe('buildFlorenceReadingText', () => {
  it('builds normalized multi-line text from boxed regions', () => {
    const regions: OcrRegions = {
      labels: ['world !', 'Hello', 'Second   line'],
      quad_boxes: [
        [60, 12, 110, 12, 110, 32, 60, 32],
        [10, 10, 50, 10, 50, 30, 10, 30],
        [12, 50, 120, 50, 120, 70, 12, 70],
      ],
    }

    expect(buildFlorenceReadingText(regions)).toBe('Hello world!\nSecond line')
  })
})
