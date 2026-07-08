import { describe, expect, it } from 'vitest'

import { buildEditableOcrText } from '../review-text'
import type { OcrResultMeta } from '@/lib/types'

function makeMeta(partial: Partial<OcrResultMeta>): OcrResultMeta {
  return {
    kind: 'ocr',
    words: [],
    lines: [],
    sourceIndex: 0,
    ...partial,
  }
}

describe('buildEditableOcrText', () => {
  it('preserves OCR line breaks when lines are present', () => {
    const meta = makeMeta({
      words: [
        { text: 'Hey', confidence: -1 },
        { text: 'Reddit!', confidence: -1 },
        { text: 'This', confidence: -1 },
        { text: 'works.', confidence: -1 },
      ],
      lines: ['Hey Reddit!', 'This works.'],
    })

    expect(buildEditableOcrText(meta)).toBe('Hey Reddit!\nThis works.')
  })

  it('falls back to word reconstruction when lines are absent', () => {
    const meta = makeMeta({
      words: [
        { text: 'Hello', confidence: 90 },
        { text: 'world', confidence: 90 },
      ],
    })

    expect(buildEditableOcrText(meta)).toBe('Hello world')
  })

  it('uses corrected words in fallback reconstruction', () => {
    const meta = makeMeta({
      words: [
        { text: 'rnother', corrected: 'mother', confidence: 40 },
        { text: 'fox', confidence: 90 },
      ],
    })

    expect(buildEditableOcrText(meta)).toBe('mother fox')
  })
})
