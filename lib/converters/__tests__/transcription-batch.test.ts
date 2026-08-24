import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  decodeAudioViaWebAudio,
  extractAudio,
  releaseCaptionExtractRuntime,
  loadTranscriptionModel,
  transcribeAudio,
} = vi.hoisted(() => ({
  decodeAudioViaWebAudio: vi.fn(async () => new Float32Array([0.1])),
  extractAudio: vi.fn(async () => new Float32Array([0.2])),
  releaseCaptionExtractRuntime: vi.fn(async () => {}),
  loadTranscriptionModel: vi.fn(async (_q: string, onProgress?: (n: number) => void) => {
    onProgress?.(100)
  }),
  transcribeAudio: vi.fn(async () => ({
    text: 'hello convertyard',
    chunks: [{ text: 'hello convertyard', timestamp: [0, 1.25] as [number, number] }],
  })),
}))

vi.mock('@/lib/converters/audio-decode', () => ({
  decodeAudioViaWebAudio,
}))

vi.mock('@/lib/converters/caption-transcribe', () => ({
  extractAudio,
  releaseCaptionExtractRuntime,
}))

vi.mock('@/lib/converters/transcription-client', () => ({
  loadTranscriptionModel,
  transcribeAudio,
}))

import { transcribeBatch } from '@/lib/converters/transcription'

describe('transcribeBatch vocab and audio path', () => {
  beforeEach(() => {
    decodeAudioViaWebAudio.mockClear()
    extractAudio.mockClear()
    releaseCaptionExtractRuntime.mockClear()
    loadTranscriptionModel.mockClear()
    transcribeAudio.mockClear()
    transcribeAudio.mockResolvedValue({
      text: 'hello convertyard',
      chunks: [{ text: 'hello convertyard', timestamp: [0, 1.25] }],
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('decodes audio files with Web Audio and glosses TXT output', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'talk.mp3', { type: 'audio/mpeg' })
    const results = await transcribeBatch(
      [file],
      { quality: 'balanced', language: 'en', outputFormat: 'txt', terms: 'ConvertYard' },
      () => {},
      () => {},
      () => {},
    )

    expect(decodeAudioViaWebAudio).toHaveBeenCalledTimes(1)
    expect(extractAudio).not.toHaveBeenCalled()
    expect(transcribeAudio).toHaveBeenCalledWith(
      expect.any(Float32Array),
      16000,
      'en',
      true,
      expect.any(Function),
      undefined,
      'ConvertYard.',
    )
    expect(results[0].text).toBe('hello ConvertYard')
    expect(results[0].output).toBe('hello ConvertYard')
    expect(results[0].error).toBeUndefined()
  })

  it('extracts video via captions path, releases ffmpeg, and glosses SRT cues', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'clip.mp4', { type: 'video/mp4' })
    const results = await transcribeBatch(
      [file],
      { quality: 'balanced', language: null, outputFormat: 'srt', terms: 'ConvertYard' },
      () => {},
      () => {},
      () => {},
    )

    expect(extractAudio).toHaveBeenCalledTimes(1)
    expect(releaseCaptionExtractRuntime).toHaveBeenCalled()
    expect(decodeAudioViaWebAudio).not.toHaveBeenCalled()
    expect(transcribeAudio.mock.calls[0]?.[3]).toBe(true)
    expect(results[0].srt).toContain('00:00:00,000 --> 00:00:01,250')
    expect(results[0].srt).toContain('hello ConvertYard')
    expect(results[0].srt).not.toMatch(/-->.*ConvertYard/)
    expect(results[0].output).toBe(results[0].srt)
  })

  it('skips prompt and glossary when terms are empty', async () => {
    const file = new File([new Uint8Array([1])], 'talk.wav', { type: 'audio/wav' })
    const results = await transcribeBatch(
      [file],
      { quality: 'fast', language: null, outputFormat: 'txt', terms: '' },
      () => {},
      () => {},
      () => {},
    )
    expect(transcribeAudio.mock.calls[0]?.[6]).toBeUndefined()
    expect(results[0].text).toBe('hello convertyard')
  })

  it('transcribes long audio in windows, streams partial text, and offsets SRT times', async () => {
    decodeAudioViaWebAudio.mockResolvedValueOnce(new Float32Array(16000 * 75))
    transcribeAudio
      .mockResolvedValueOnce({
        text: 'one',
        chunks: [{ text: 'one', timestamp: [0, 1] }],
      })
      .mockResolvedValueOnce({
        text: 'two',
        chunks: [{ text: 'two', timestamp: [0, 1] }],
      })
      .mockResolvedValueOnce({
        text: 'three',
        chunks: [{ text: 'three', timestamp: [0, 1] }],
      })

    const file = new File([new Uint8Array([1])], 'long.wav', { type: 'audio/wav' })
    const partials: string[] = []
    const finals: boolean[] = []
    const results = await transcribeBatch(
      [file],
      { quality: 'fast', language: null, outputFormat: 'srt', terms: '' },
      () => {},
      () => {},
      (_i, result, isFinal) => {
        partials.push(result.text)
        finals.push(Boolean(isFinal))
      },
    )

    expect(transcribeAudio).toHaveBeenCalledTimes(3)
    expect((transcribeAudio.mock.calls[0]?.[0] as Float32Array).length).toBe(16000 * 30)
    expect(partials).toEqual(['one', 'one two', 'one two three'])
    expect(finals).toEqual([false, false, true])
    expect(results[0].srt).toContain('00:00:27,000 --> 00:00:28,000')
    expect(results[0].text).toBe('one two three')
  })

  it('does not send long silence to Whisper and keeps SRT offsets on the original timeline', async () => {
    const sr = 16000
    const speech = new Float32Array(sr * 2)
    for (let i = 0; i < speech.length; i++) speech[i] = 0.3 * Math.sin((i * 440 * 2 * Math.PI) / sr)
    const pcm = new Float32Array(sr * 44)
    pcm.set(speech, 0)
    pcm.set(speech, sr * 42)
    decodeAudioViaWebAudio.mockResolvedValueOnce(pcm)
    transcribeAudio
      .mockResolvedValueOnce({
        text: 'hello',
        chunks: [{ text: 'hello', timestamp: [0, 1] }],
      })
      .mockResolvedValueOnce({
        text: 'world',
        chunks: [{ text: 'world', timestamp: [0, 1] }],
      })

    const file = new File([new Uint8Array([1])], 'gaps.wav', { type: 'audio/wav' })
    const results = await transcribeBatch(
      [file],
      { quality: 'fast', language: null, outputFormat: 'srt', terms: '' },
      () => {},
      () => {},
      () => {},
    )

    expect(transcribeAudio).toHaveBeenCalledTimes(2)
    const firstLen = (transcribeAudio.mock.calls[0]?.[0] as Float32Array).length
    const secondLen = (transcribeAudio.mock.calls[1]?.[0] as Float32Array).length
    expect(firstLen).toBeLessThan(sr * 5)
    expect(secondLen).toBeLessThan(sr * 5)
    expect(results[0].text).toBe('hello world')
    expect(results[0].srt).toContain('00:00:41')
  })
})
