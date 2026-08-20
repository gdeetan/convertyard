import { describe, expect, it } from 'vitest'
import { microSnapToAttacks, snapWordsToOnsets } from '../caption-align'
import type { WordChunk } from '../caption-types'

function toneBurst(sampleRate: number, startSec: number, durSec: number, totalSec: number): Float32Array {
  const audio = new Float32Array(Math.round(totalSec * sampleRate))
  const start = Math.round(startSec * sampleRate)
  const end = Math.min(audio.length, start + Math.round(durSec * sampleRate))
  for (let i = start; i < end; i++) {
    audio[i] = Math.sin((2 * Math.PI * 220 * i) / sampleRate) * 0.8
  }
  return audio
}

describe('snapWordsToOnsets', () => {
  it('moves evenly-split words onto speech bursts', () => {
    const sampleRate = 16000
    const audio = toneBurst(sampleRate, 0.5, 0.2, 3)
    // second and third bursts
    const b2 = toneBurst(sampleRate, 1.2, 0.2, 3)
    const b3 = toneBurst(sampleRate, 2.0, 0.2, 3)
    for (let i = 0; i < audio.length; i++) audio[i] += b2[i] + b3[i]

    const words: WordChunk[] = [
      { text: 'one', start: 0, end: 1 },
      { text: 'two', start: 1, end: 2 },
      { text: 'three', start: 2, end: 3 },
    ]
    const snapped = snapWordsToOnsets(words, audio, sampleRate)
    expect(snapped[0].start).toBeGreaterThanOrEqual(0.4)
    expect(snapped[0].start).toBeLessThan(0.65)
    expect(snapped[1].start).toBeGreaterThanOrEqual(1.1)
    expect(snapped[1].start).toBeLessThan(1.35)
    expect(snapped[2].start).toBeGreaterThanOrEqual(1.9)
    expect(snapped[2].start).toBeLessThan(2.15)
    expect(snapped[0].end).toBe(snapped[1].start)
    expect(snapped[1].end).toBe(snapped[2].start)
  })

  it('snaps segment-distributed words to real onsets across the full segment', () => {
    const sampleRate = 16000
    // One Whisper segment spans 0..5s. Three words were evenly split to
    // starts 0.0 / 1.67 / 3.33, but the real speech bursts are at
    // 0.3 / 2.4 / 4.5 — far beyond the ±0.75 s window used for real
    // word timestamps.
    const audio = toneBurst(sampleRate, 0.3, 0.2, 5)
    const b2 = toneBurst(sampleRate, 2.4, 0.2, 5)
    const b3 = toneBurst(sampleRate, 4.5, 0.2, 5)
    for (let i = 0; i < audio.length; i++) audio[i] += b2[i] + b3[i]

    const words: WordChunk[] = [
      { text: 'one',   start: 0.00, end: 1.67, anchorStart: 0, anchorEnd: 5 },
      { text: 'two',   start: 1.67, end: 3.33, anchorStart: 0, anchorEnd: 5 },
      { text: 'three', start: 3.33, end: 5.00, anchorStart: 0, anchorEnd: 5 },
    ]
    const snapped = snapWordsToOnsets(words, audio, sampleRate)
    expect(snapped[0].start).toBeGreaterThanOrEqual(0.25)
    expect(snapped[0].start).toBeLessThan(0.45)
    expect(snapped[1].start).toBeGreaterThanOrEqual(2.3)
    expect(snapped[1].start).toBeLessThan(2.55)
    expect(snapped[2].start).toBeGreaterThanOrEqual(4.4)
    expect(snapped[2].start).toBeLessThan(4.65)
  })

  it('spreads words across the segment when fewer onsets than words are detected', () => {
    const sampleRate = 16000
    // Segment 0..6s with 5 words but only 2 detected onsets (0.4s and 3.5s).
    // Old greedy snap piled words at the onsets and MIN_SPAN-cascaded the rest.
    const audio = toneBurst(sampleRate, 0.4, 0.2, 6)
    const b2 = toneBurst(sampleRate, 3.5, 0.2, 6)
    for (let i = 0; i < audio.length; i++) audio[i] += b2[i]

    const anchor = { anchorStart: 0, anchorEnd: 6 }
    const words: WordChunk[] = [
      { text: 'one',   start: 0.0, end: 1.2, ...anchor },
      { text: 'two',   start: 1.2, end: 2.4, ...anchor },
      { text: 'three', start: 2.4, end: 3.6, ...anchor },
      { text: 'four',  start: 3.6, end: 4.8, ...anchor },
      { text: 'five',  start: 4.8, end: 6.0, ...anchor },
    ]
    const snapped = snapWordsToOnsets(words, audio, sampleRate)
    // First half pins to onset 0.4, second half pins to onset 3.5.
    // Neither group bunches at MIN_SPAN — words spread across their group span.
    expect(snapped[0].start).toBeGreaterThanOrEqual(0.3)
    expect(snapped[0].start).toBeLessThan(0.5)
    expect(snapped[2].start).toBeGreaterThanOrEqual(3.3)
    expect(snapped[2].start).toBeLessThan(3.7)
    // Words within each group have real spacing, not the 50 ms MIN_SPAN.
    expect(snapped[1].start - snapped[0].start).toBeGreaterThan(0.5)
    expect(snapped[3].start - snapped[2].start).toBeGreaterThan(0.5)
    expect(snapped[4].start - snapped[3].start).toBeGreaterThan(0.5)
  })

  it('leaves timings alone when the audio is silent', () => {
    const words: WordChunk[] = [
      { text: 'one', start: 0.2, end: 0.5 },
      { text: 'two', start: 0.5, end: 0.9 },
    ]
    const out = snapWordsToOnsets(words, new Float32Array(16000), 16000)
    expect(out).toEqual(words)
  })
})

describe('microSnapToAttacks', () => {
  it('pulls each real-DTW word onto the nearest phoneme attack', () => {
    const sampleRate = 16000
    // Real speech attacks at 0.60 / 1.40 / 2.30 s. Whisper reported the words
    // ~150 ms early (0.45 / 1.25 / 2.15). Micro-snap should recover them.
    const audio = toneBurst(sampleRate, 0.60, 0.15, 3)
    const b2 = toneBurst(sampleRate, 1.40, 0.15, 3)
    const b3 = toneBurst(sampleRate, 2.30, 0.15, 3)
    for (let i = 0; i < audio.length; i++) audio[i] += b2[i] + b3[i]

    const words: WordChunk[] = [
      { text: 'one',   start: 0.45, end: 1.15 },
      { text: 'two',   start: 1.25, end: 2.05 },
      { text: 'three', start: 2.15, end: 2.95 },
    ]
    const out = microSnapToAttacks(words, audio, sampleRate)
    expect(out[0].start).toBeGreaterThanOrEqual(0.55)
    expect(out[0].start).toBeLessThan(0.66)
    expect(out[1].start).toBeGreaterThanOrEqual(1.35)
    expect(out[1].start).toBeLessThan(1.46)
    expect(out[2].start).toBeGreaterThanOrEqual(2.25)
    expect(out[2].start).toBeLessThan(2.36)
    // Preserves per-word span (offset applied to end too).
    expect(out[0].end - out[0].start).toBeCloseTo(0.70, 1)
  })

  it('leaves a word unchanged when no clear attack peak is nearby', () => {
    const sampleRate = 16000
    const audio = new Float32Array(sampleRate) // 1 s of silence
    const words: WordChunk[] = [{ text: 'hi', start: 0.4, end: 0.7 }]
    const out = microSnapToAttacks(words, audio, sampleRate)
    expect(out[0].start).toBe(0.4)
    expect(out[0].end).toBe(0.7)
  })

  it('does not drag words far — search window is bounded (±180 ms)', () => {
    const sampleRate = 16000
    // Attack at 2.0 s but the word claims it started at 0.5 s — too far, ignore.
    const audio = toneBurst(sampleRate, 2.0, 0.2, 3)
    const words: WordChunk[] = [{ text: 'stray', start: 0.5, end: 1.0 }]
    const out = microSnapToAttacks(words, audio, sampleRate)
    expect(out[0].start).toBe(0.5)
  })
})
