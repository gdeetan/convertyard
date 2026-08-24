import { describe, expect, it } from 'vitest'
import { detectSpeechIntervals } from '@/lib/converters/transcript-vad'
import { transcriptionSpeechWindows } from '@/lib/converters/transcription'

const SR = 16000

function tone(seconds: number, amp = 0.25, freq = 220): Float32Array {
  const n = Math.round(seconds * SR)
  const out = new Float32Array(n)
  const step = (2 * Math.PI * freq) / SR
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin(i * step)
  return out
}

function concat(...parts: Float32Array[]): Float32Array {
  const n = parts.reduce((s, p) => s + p.length, 0)
  const out = new Float32Array(n)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

describe('detectSpeechIntervals', () => {
  it('returns no intervals for digital silence', () => {
    expect(detectSpeechIntervals(new Float32Array(SR * 3), SR)).toEqual([])
  })

  it('keeps a continuous speech clip as one interval covering the file', () => {
    const pcm = tone(2)
    const intervals = detectSpeechIntervals(pcm, SR)
    expect(intervals).toHaveLength(1)
    expect(intervals[0].start).toBe(0)
    expect(intervals[0].end).toBe(pcm.length)
  })

  it('drops a long silent gap between two speech bursts', () => {
    const pcm = concat(tone(1.5), new Float32Array(SR * 8), tone(1.5))
    const intervals = detectSpeechIntervals(pcm, SR)
    expect(intervals).toHaveLength(2)
    expect(intervals[0].start).toBe(0)
    expect(intervals[0].end / SR).toBeLessThan(3)
    expect(intervals[1].start / SR).toBeGreaterThan(8)
  })

  it('does not split a sentence-length pause', () => {
    const pcm = concat(tone(1), new Float32Array(Math.round(SR * 0.8)), tone(1))
    const intervals = detectSpeechIntervals(pcm, SR)
    expect(intervals).toHaveLength(1)
    expect(intervals[0].start).toBe(0)
    expect(intervals[0].end).toBe(pcm.length)
  })

  it('keeps quiet speech between louder sections', () => {
    const pcm = concat(tone(1, 0.3), tone(2, 0.012), tone(1, 0.3))
    const intervals = detectSpeechIntervals(pcm, SR)
    expect(intervals).toHaveLength(1)
    expect(intervals[0].start).toBe(0)
    expect(intervals[0].end).toBe(pcm.length)
  })
})

describe('transcriptionSpeechWindows', () => {
  it('falls back to full-file 30s windows when there is no speech', () => {
    const windows = transcriptionSpeechWindows(new Float32Array(SR * 75), SR, 'desktop')
    expect(windows).toHaveLength(3)
    expect(windows[0]).toEqual({ start: 0, end: SR * 30, offsetSec: 0 })
  })

  it('windows only the speech regions so silence is not sent to Whisper', () => {
    const pcm = concat(tone(2), new Float32Array(SR * 40), tone(2))
    const windows = transcriptionSpeechWindows(pcm, SR, 'desktop')
    expect(windows).toHaveLength(2)
    expect(windows[0].start).toBe(0)
    expect(windows[0].end).toBeLessThan(SR * 5)
    expect(windows[1].start).toBeGreaterThan(SR * 38)
    expect(windows[1].offsetSec).toBeGreaterThan(38)
  })
})
