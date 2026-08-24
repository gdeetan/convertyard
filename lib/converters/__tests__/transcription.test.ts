import { describe, expect, it } from 'vitest'

import { buildSRT, selectTranscriptionOutput, transcriptionAudioWindows } from '@/lib/converters/transcription'

describe('transcription output helpers', () => {
  it('builds SRT and selects the active output format', () => {
    const text = 'hello world'
    const srt = buildSRT({
      text,
      chunks: [
        { text: 'hello', timestamp: [0, 1.25] },
        { text: 'world', timestamp: [1.25, 2.5] },
      ],
    })

    expect(srt).toContain('00:00:00,000 --> 00:00:01,250')
    expect(srt).toContain('hello')
    expect(selectTranscriptionOutput({ text, srt }, 'txt')).toBe(text)
    expect(selectTranscriptionOutput({ text, srt }, 'srt')).toBe(srt)
  })
})

describe('transcriptionAudioWindows', () => {
  it('keeps clips under 30s as a single window on desktop', () => {
    expect(transcriptionAudioWindows(16000 * 20, 16000, 'desktop')).toEqual([
      { start: 0, end: 16000 * 20, offsetSec: 0 },
    ])
  })

  it('slices desktop audio into 30s windows with 3s overlap so each Whisper call can finish sooner', () => {
    const windows = transcriptionAudioWindows(16000 * 75, 16000, 'desktop')
    expect(windows.length).toBe(3)
    expect(windows[0]).toEqual({ start: 0, end: 16000 * 30, offsetSec: 0 })
    expect(windows[1].offsetSec).toBe(27)
    expect(windows[2].end).toBe(16000 * 75)
  })

  it('uses the iPhone 15s memory-safe slices', () => {
    const windows = transcriptionAudioWindows(16000 * 45, 16000, 'ios')
    expect(windows[0]).toEqual({ start: 0, end: 16000 * 15, offsetSec: 0 })
    expect(windows[1].offsetSec).toBe(12)
  })
})
