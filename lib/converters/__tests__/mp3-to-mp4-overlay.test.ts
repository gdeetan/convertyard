import { describe, expect, it } from 'vitest'
import {
  computeAmplitudeBuckets,
  wordAtTime,
} from '../mp3-to-mp4-overlay'

describe('computeAmplitudeBuckets', () => {
  it('returns `buckets` values in [0, 1] with correct length', () => {
    const sr = 48_000
    const pcm = new Float32Array(sr * 2) // 2s of silence then a pulse
    for (let i = sr; i < sr + 100; i++) pcm[i] = 0.9
    const out = computeAmplitudeBuckets(pcm, sr, 0, 2, 50)
    expect(out).toHaveLength(50)
    for (const v of out) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
    // bucket covering the pulse should be louder than a silent one
    expect(out[25]).toBeGreaterThan(out[0])
  })

  it('handles zero-length window without NaN', () => {
    const out = computeAmplitudeBuckets(new Float32Array(0), 48_000, 0, 0, 10)
    expect(out).toHaveLength(10)
    expect(out.every((v) => Number.isFinite(v))).toBe(true)
  })
})

describe('wordAtTime', () => {
  const words = [
    { text: 'hello', start: 0.0, end: 0.4 },
    { text: 'world', start: 0.5, end: 0.9 },
  ]

  it('returns the word active at a given time', () => {
    expect(wordAtTime(words, 0.2).word?.text).toBe('hello')
    expect(wordAtTime(words, 0.6).word?.text).toBe('world')
  })

  it('returns null word in a gap', () => {
    expect(wordAtTime(words, 0.45).word).toBeNull()
  })

  it('returns null word past the end', () => {
    expect(wordAtTime(words, 5).word).toBeNull()
  })

  it('is `[start, end)` — includes start, excludes end', () => {
    expect(wordAtTime(words, 0.0).word?.text).toBe('hello')
    expect(wordAtTime(words, 0.4).word).toBeNull()
  })

  it('resumes from a cursor hint', () => {
    const first = wordAtTime(words, 0.2)
    expect(first.word?.text).toBe('hello')
    const next = wordAtTime(words, 0.6, first.index)
    expect(next.word?.text).toBe('world')
    expect(next.index).toBe(1)
  })
})
