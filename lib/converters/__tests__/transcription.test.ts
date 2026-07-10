import { describe, expect, it } from 'vitest'

import { buildSRT, selectTranscriptionOutput } from '@/lib/converters/transcription'

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
