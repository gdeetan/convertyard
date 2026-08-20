import { describe, expect, it } from 'vitest'
import {
  decodeParamsForQuality,
  effectiveWhisperTimestamps,
  filterWhisperChunks,
  filterWhisperResult,
  dedupeStrideOverlaps,
  modelVariantsForQuality,
} from '../whisper-postprocess'

describe('modelVariantsForQuality', () => {
  it('tries a word-timestamped variant first for every quality so word timings are real', () => {
    for (const quality of ['fast', 'balanced', 'accurate'] as const) {
      const variants = modelVariantsForQuality(quality)
      expect(variants[0].supportsWord).toBe(true)
      expect(variants[0].modelId).toMatch(/onnx-community\/whisper-.*_timestamped/)
    }
  })

  it('keeps Xenova/whisper-* as a fallback for clients that cannot fetch the newer files', () => {
    const ids = modelVariantsForQuality('accurate').map((v) => v.modelId)
    expect(ids).toContain('Xenova/whisper-small')
    expect(ids.some((id) => id.includes('turbo'))).toBe(false)
    // Timestamped model comes before the equivalent legacy model.
    expect(ids.indexOf('onnx-community/whisper-small_timestamped'))
      .toBeLessThan(ids.indexOf('Xenova/whisper-small'))
  })

  it('uses whisper-tiny fp32 on constrained devices — q8 hits MatMulNBits and poisons the WASM heap', () => {
    for (const quality of ['fast', 'balanced', 'accurate'] as const) {
      const variants = modelVariantsForQuality(quality, { constrained: true })
      expect(variants[0].supportsWord).toBe(true)
      expect(variants.every((v) => v.dtype !== 'q8' && v.dtype !== 'q4')).toBe(true)
      expect(variants.every((v) => v.modelId.endsWith('whisper-tiny_timestamped') || v.modelId === 'Xenova/whisper-tiny')).toBe(true)
    }
  })

  it('never starts constrained accurate on a small model', () => {
    const variants = modelVariantsForQuality('accurate', { constrained: true })
    expect(variants[0].modelId).not.toContain('whisper-small')
  })
})

describe('effectiveWhisperTimestamps', () => {
  it('passes word mode through when the loaded model supports cross-attention word timings', () => {
    expect(effectiveWhisperTimestamps('word', true)).toBe('word')
  })

  it('downgrades word mode to segment timestamps for legacy Xenova ONNX exports', () => {
    expect(effectiveWhisperTimestamps('word', false)).toBe(true)
    expect(effectiveWhisperTimestamps('word')).toBe(true)
  })

  it('leaves boolean modes alone regardless of model capability', () => {
    expect(effectiveWhisperTimestamps(true, true)).toBe(true)
    expect(effectiveWhisperTimestamps(false, true)).toBe(false)
  })
})

describe('decodeParamsForQuality', () => {
  it('uses greedy decode for fast and balanced', () => {
    expect(decodeParamsForQuality('fast').num_beams).toBe(1)
    expect(decodeParamsForQuality('balanced').num_beams).toBe(1)
  })

  it('keeps beam search only for accurate', () => {
    expect(decodeParamsForQuality('accurate').num_beams).toBe(5)
  })

  it('never conditions on previous text', () => {
    expect(decodeParamsForQuality('balanced').condition_on_previous_text).toBe(false)
  })
})

describe('filterWhisperChunks', () => {
  it('drops empty and music-tag chunks', () => {
    const out = filterWhisperChunks([
      { text: ' Hello', timestamp: [0, 0.4] },
      { text: ' [Music]', timestamp: [0.4, 1] },
      { text: ' world', timestamp: [1, 1.4] },
    ])
    expect(out.map((c) => c.text.trim())).toEqual(['Hello', 'world'])
  })

  it('drops known outro phrases spanning several words', () => {
    const out = filterWhisperChunks([
      { text: ' Hello', timestamp: [0, 0.3] },
      { text: ' thanks', timestamp: [10, 10.2] },
      { text: ' for', timestamp: [10.2, 10.4] },
      { text: ' watching', timestamp: [10.4, 10.8] },
    ])
    expect(out.map((c) => c.text.trim())).toEqual(['Hello'])
  })

  it('collapses 3+ identical repeats', () => {
    const out = filterWhisperChunks([
      { text: ' you', timestamp: [0, 0.2] },
      { text: ' you', timestamp: [0.2, 0.4] },
      { text: ' you', timestamp: [0.4, 0.6] },
      { text: ' you', timestamp: [0.6, 0.8] },
      { text: ' later', timestamp: [0.8, 1.1] },
    ])
    expect(out.filter((c) => c.text.trim() === 'you')).toHaveLength(2)
    expect(out.at(-1)?.text.trim()).toBe('later')
  })
})

describe('dedupeStrideOverlaps', () => {
  it('drops a duplicate word from the next sliding window', () => {
    const out = dedupeStrideOverlaps([
      { text: ' country', timestamp: [29.6, 30.1] },
      { text: ' country', timestamp: [29.7, 30.2] },
      { text: ' next', timestamp: [30.2, 30.5] },
    ])
    expect(out).toHaveLength(2)
    expect(out[1].text.trim()).toBe('next')
  })
})

describe('filterWhisperResult', () => {
  it('rebuilds text from surviving chunks', () => {
    const result = filterWhisperResult({
      text: 'Hello [Music] world thanks for watching',
      chunks: [
        { text: ' Hello', timestamp: [0, 0.3] },
        { text: ' [Music]', timestamp: [0.3, 0.8] },
        { text: ' world', timestamp: [0.8, 1.1] },
        { text: ' thanks', timestamp: [1.1, 1.3] },
        { text: ' for', timestamp: [1.3, 1.4] },
        { text: ' watching', timestamp: [1.4, 1.8] },
      ],
    })
    expect(result.text).toBe('Hello world')
    expect(result.chunks).toHaveLength(2)
  })
})
