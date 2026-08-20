import { describe, expect, it } from 'vitest'
import {
  applyWhisperWordLead,
  looksLikeSegments,
  WHISPER_WORD_LEAD_SEC,
  wordsFromTranscription,
} from '../caption-words'

describe('wordsFromTranscription', () => {
  it('keeps real word timestamps and marks them non-interpolated', () => {
    const { words, timestampsEstimated, wordsInterpolated } = wordsFromTranscription({
      text: 'Hello world',
      chunks: [
        { text: ' Hello', timestamp: [0.1, 0.4] },
        { text: ' world', timestamp: [0.4, 0.9] },
      ],
    })
    expect(timestampsEstimated).toBe(false)
    expect(wordsInterpolated).toBe(false)
    expect(words).toEqual([
      { text: 'Hello', start: 0.1, end: 0.4 },
      { text: 'world', start: 0.4, end: 0.9 },
    ])
  })

  it('splits segment chunks across their real time range and flags interpolation', () => {
    const { words, timestampsEstimated, wordsInterpolated } = wordsFromTranscription({
      text: 'Hello there world',
      chunks: [
        { text: 'Hello there world', timestamp: [1, 4] },
      ],
    })
    expect(timestampsEstimated).toBe(false)
    expect(wordsInterpolated).toBe(true)
    expect(words).toHaveLength(3)
    expect(words[0].start).toBe(1)
    expect(words[2].end).toBe(4)
    expect(words.map((w) => w.text)).toEqual(['Hello', 'there', 'world'])
  })

  it('does not invent a 2-second grid when timestamps are missing', () => {
    const { words, timestampsEstimated, wordsInterpolated } = wordsFromTranscription({
      text: 'Hello there world today',
    })
    expect(timestampsEstimated).toBe(true)
    expect(wordsInterpolated).toBe(false)
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

describe('applyWhisperWordLead', () => {
  it('is 120 ms', () => {
    expect(WHISPER_WORD_LEAD_SEC).toBe(0.12)
  })

  it('shifts interpolated timings earlier by 120 ms', () => {
    const out = applyWhisperWordLead({
      timestampsEstimated: false,
      wordsInterpolated: true,
      words: [
        { text: 'Hello', start: 0.5, end: 0.8 },
        { text: 'world', start: 0.8, end: 1.2 },
      ],
    })
    expect(out.words).toEqual([
      { text: 'Hello', start: 0.38, end: 0.68 },
      { text: 'world', start: 0.68, end: 1.08 },
    ])
  })

  it('leaves real (non-interpolated) word timings alone so highlights do not fire early', () => {
    const transcript = {
      timestampsEstimated: false,
      wordsInterpolated: false,
      words: [
        { text: 'Hello', start: 0.5, end: 0.8 },
        { text: 'world', start: 0.8, end: 1.2 },
      ],
    }
    expect(applyWhisperWordLead(transcript)).toEqual(transcript)
  })

  it('clamps start to 0 and keeps a 0.05 s minimum span', () => {
    const out = applyWhisperWordLead({
      timestampsEstimated: false,
      wordsInterpolated: true,
      words: [{ text: 'Hi', start: 0.05, end: 0.2 }],
    })
    expect(out.words[0].start).toBe(0)
    expect(out.words[0].end).toBeCloseTo(0.08)
  })

  it('does not change estimated or zero-span transcripts', () => {
    const estimated = {
      timestampsEstimated: true,
      wordsInterpolated: false,
      words: [
        { text: 'Hello', start: 0, end: 0 },
        { text: 'world', start: 0, end: 0 },
      ],
    }
    expect(applyWhisperWordLead(estimated)).toEqual(estimated)

    const zeros = {
      timestampsEstimated: false,
      wordsInterpolated: true,
      words: [{ text: 'Hello', start: 0, end: 0 }],
    }
    expect(applyWhisperWordLead(zeros)).toEqual(zeros)
  })
})
