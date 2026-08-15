import { describe, expect, it } from 'vitest'
import { looksLikeSegments, wordsFromTranscription } from '../caption-words'

describe('wordsFromTranscription', () => {
  it('keeps real word timestamps', () => {
    const { words, timestampsEstimated } = wordsFromTranscription({
      text: 'Hello world',
      chunks: [
        { text: ' Hello', timestamp: [0.1, 0.4] },
        { text: ' world', timestamp: [0.4, 0.9] },
      ],
    })
    expect(timestampsEstimated).toBe(false)
    expect(words).toEqual([
      { text: 'Hello', start: 0.1, end: 0.4 },
      { text: 'world', start: 0.4, end: 0.9 },
    ])
  })

  it('splits segment chunks across their real time range', () => {
    const { words, timestampsEstimated } = wordsFromTranscription({
      text: 'Hello there world',
      chunks: [
        { text: 'Hello there world', timestamp: [1, 4] },
      ],
    })
    expect(timestampsEstimated).toBe(false)
    expect(words).toHaveLength(3)
    expect(words[0].start).toBe(1)
    expect(words[2].end).toBe(4)
    expect(words.map((w) => w.text)).toEqual(['Hello', 'there', 'world'])
  })

  it('does not invent a 2-second grid when timestamps are missing', () => {
    const { words, timestampsEstimated } = wordsFromTranscription({
      text: 'Hello there world today',
    })
    expect(timestampsEstimated).toBe(true)
    expect(words).toHaveLength(4)
    expect(words.every((w) => w.start === 0 && w.end === 0)).toBe(true)
  })
})

describe('looksLikeSegments', () => {
  it('detects phrase-level chunks', () => {
    expect(looksLikeSegments([{ text: 'Hello there world' }])).toBe(true)
    expect(looksLikeSegments([{ text: 'Hello' }, { text: 'world' }])).toBe(false)
  })
})
