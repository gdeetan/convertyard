import { describe, expect, it } from 'vitest'
import {
  CLASSIFIER_SIZE,
  classifierLoadAttempts,
  combineVerdict,
  metadataImpliesAi,
  pendingVerdict,
  pickAiScore,
  rgbaToRgb,
} from '../ai-detector-logic'
import { verdictFromProbability } from '../ai-detector.types'

describe('classifierLoadAttempts', () => {
  it('only loads q8, preferring WebGPU then WASM', () => {
    expect(classifierLoadAttempts(true)).toEqual([
      { dtype: 'q8', device: 'webgpu' },
      { dtype: 'q8', device: 'wasm' },
    ])
  })

  it('skips WebGPU when unavailable and never falls back to fp32', () => {
    const attempts = classifierLoadAttempts(false)
    expect(attempts).toEqual([{ dtype: 'q8', device: 'wasm' }])
    expect(attempts.every(a => a.dtype === 'q8')).toBe(true)
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
