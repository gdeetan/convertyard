import { describe, expect, it } from 'vitest'
import { splitWord, mergeWordWithNext, insertWordAfter, setWordTiming, nudgeWord } from '../caption-edit'
import type { WordChunk } from '../caption-types'

const words: WordChunk[] = [
  { text: 'Hello there', start: 0, end: 1 },
  { text: 'world', start: 1, end: 1.5 },
]

describe('caption edit ops', () => {
  it('splits a multi-word chip on the time midpoint', () => {
    const out = splitWord(words, 0)
    expect(out).toHaveLength(3)
    expect(out[0]).toEqual({ text: 'Hello', start: 0, end: 0.5 })
    expect(out[1]).toEqual({ text: 'there', start: 0.5, end: 1 })
    expect(out[2].text).toBe('world')
  })

  it('merges a word with the next', () => {
    const out = mergeWordWithNext(words, 0)
    expect(out).toEqual([{ text: 'Hello there world', start: 0, end: 1.5 }])
  })

  it('inserts a placeholder in the gap after a word', () => {
    const out = insertWordAfter(words, 0)
    expect(out).toHaveLength(3)
    expect(out[1].text).toBe('…')
    expect(out[1].start).toBe(1)
    expect(out[1].end).toBeLessThanOrEqual(1.5)
  })

  it('nudges start and end together', () => {
    const out = nudgeWord(words, 1, -0.2)
    expect(out[1].start).toBeCloseTo(0.8)
    expect(out[1].end).toBeCloseTo(1.3)
  })

  it('rejects inverted timings', () => {
    const out = setWordTiming(words, 1, 2, 1)
    expect(out[1].end).toBeGreaterThan(out[1].start)
  })
})
