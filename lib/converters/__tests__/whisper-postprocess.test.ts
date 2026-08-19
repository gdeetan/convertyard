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
  it('uses whisper-small for accurate, not large-v3-turbo', () => {
    const ids = modelVariantsForQuality('accurate').map((v) => v.modelId)
    expect(ids[0]).toBe('Xenova/whisper-small')
    expect(ids.some((id) => id.includes('turbo'))).toBe(false)
  })

  it('uses whisper-tiny fp32 on constrained devices — q8 hits MatMulNBits and poisons the WASM heap', () => {
    for (const quality of ['fast', 'balanced', 'accurate'] as const) {
      const variants = modelVariantsForQuality(quality, { constrained: true })
      expect(variants[0]).toEqual({ modelId: 'Xenova/whisper-tiny', dtype: 'fp32' })
      expect(variants.every((v) => v.dtype !== 'q8' && v.dtype !== 'q4')).toBe(true)
      expect(variants.every((v) => v.modelId === 'Xenova/whisper-tiny')).toBe(true)
    }
  })

  it('never starts constrained accurate on whisper-small', () => {
    const variants = modelVariantsForQuality('accurate', { constrained: true })
    expect(variants[0].modelId).not.toBe('Xenova/whisper-small')
  })
})

describe('effectiveWhisperTimestamps', () => {
  it('maps word mode to segment timestamps so Xenova ONNX models do not throw', () => {
    expect(effectiveWhisperTimestamps('word')).toBe(true)
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
