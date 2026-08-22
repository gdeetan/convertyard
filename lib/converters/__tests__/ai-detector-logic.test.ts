import { describe, expect, it } from 'vitest'
import {
  CLASSIFIER_SIZE,
  classifierLoadAttempts,
  combineVerdict,
  detectorWasmThreads,
  friendlyImageError,
  looksLikeHeicHeader,
  metadataImpliesAi,
  pendingVerdict,
  pickAiScore,
  rgbaToRgb,
} from '../ai-detector-logic'
import { verdictFromProbability } from '../ai-detector.types'

describe('classifierLoadAttempts', () => {
  it('loads q8 WASM only (skips WebGPU shader compile and fp32)', () => {
    expect(classifierLoadAttempts()).toEqual([{ dtype: 'q8', device: 'wasm' }])
  })
})

describe('detectorWasmThreads', () => {
  it('uses a single thread on iOS and Android', () => {
    expect(detectorWasmThreads('ios', true, 6)).toBe(1)
    expect(detectorWasmThreads('android', true, 8)).toBe(1)
  })

  it('threads on desktop only when SharedArrayBuffer exists', () => {
    expect(detectorWasmThreads('desktop', true, 8)).toBe(4)
    expect(detectorWasmThreads('desktop', false, 8)).toBe(1)
  })
})

describe('pickAiScore', () => {
  it('reads the artificial class when present', () => {
    expect(pickAiScore([
      { label: 'human', score: 0.2 },
      { label: 'artificial', score: 0.8 },
    ])).toBe(0.8)
  })

  it('treats an unmatched top class as human and inverts', () => {
    expect(pickAiScore([{ label: 'real', score: 0.9 }])).toBeCloseTo(0.1)
  })
})

describe('metadata + verdict', () => {
  it('treats generator tags as AI and C2PA-only as not', () => {
    expect(metadataImpliesAi([{ generator: 'comfyui' }])).toBe(true)
    expect(metadataImpliesAi([{ generator: 'c2pa-only' }])).toBe(false)
    expect(metadataImpliesAi([])).toBe(false)
  })

  it('shows likely-ai immediately when generator metadata is present', () => {
    expect(pendingVerdict([{ generator: 'midjourney' }])).toBe('likely-ai')
    expect(pendingVerdict([])).toBe('inconclusive')
  })

  it('does not let the pixel score override generator metadata', () => {
    expect(combineVerdict([{ generator: 'stable-diffusion' }], 0.05)).toBe('likely-ai')
    expect(combineVerdict([], 0.05)).toBe('likely-human')
    expect(combineVerdict([], 0.9)).toBe('likely-ai')
  })
})

describe('verdictFromProbability', () => {
  it('keeps the existing thresholds', () => {
    expect(verdictFromProbability(0.75)).toBe('likely-ai')
    expect(verdictFromProbability(0.25)).toBe('likely-human')
    expect(verdictFromProbability(0.5)).toBe('inconclusive')
  })
})

describe('rgbaToRgb', () => {
  it('drops alpha and keeps RGB in order', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 128])
    expect(Array.from(rgbaToRgb(rgba, 2, 1))).toEqual([10, 20, 30, 40, 50, 60])
  })
})

describe('CLASSIFIER_SIZE', () => {
  it('matches the ONNX preprocessor (224)', () => {
    expect(CLASSIFIER_SIZE).toBe(224)
  })
})

describe('looksLikeHeicHeader', () => {
  it('detects ftypheic', () => {
    const buf = new Uint8Array(12)
    buf.set([0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], 4) // ftypheic
    expect(looksLikeHeicHeader(buf)).toBe(true)
  })

  it('rejects JPEG SOI', () => {
    const buf = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
    expect(looksLikeHeicHeader(buf)).toBe(false)
  })
})

describe('friendlyImageError', () => {
  it('maps browser decode failures to a short message', () => {
    expect(friendlyImageError(new Error('The source image could not be decoded.'))).toMatch(/Could not read this image/)
    expect(friendlyImageError(new Error('Unsupported input type: object'))).toMatch(/Could not read this image/)
  })

  it('maps OOM to a device message', () => {
    expect(friendlyImageError(new Error('out of memory'))).toMatch(/ran out of memory/)
  })
})
