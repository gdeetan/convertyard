import { describe, expect, it } from 'vitest'
import {
  CLASSIFIER_CROP,
  CLASSIFIER_RESIZE,
  CLASSIFIER_SIZE,
  DETECTOR_LOGIT_OFFSET,
  DETECTOR_ONNX_KEY,
  aiScoreFromLogits,
  rgbToNchwFloat32,
  aiScoreFromLogitList,
  centerCropOrigin,
  cropHwc,
  detectorOnnxUrl,
  detectorOnnxUrls,
  detectorQuantizedOnnxUrl,
  fiveCropOrigins,
  classifierLoadAttempts,
  combineVerdict,
  detectorWasmThreads,
  friendlyImageError,
  looksLikeHeicHeader,
  metadataImpliesAi,
  pendingVerdict,
  pickAiScore,
  rgbaToRgb,
  shortestEdgeSize,
  sigmoid,
} from '../ai-detector-logic'
import { verdictFromProbability } from '../ai-detector.types'

describe('classifierLoadAttempts', () => {
  it('loads fp32 WASM only (skips WebGPU shader compile)', () => {
    expect(classifierLoadAttempts()).toEqual([{ dtype: 'fp32', device: 'wasm' }])
  })
})

describe('detectorOnnxUrls', () => {
  it('loads the re-fit fp32 ONNX from R2 first, GitHub as fallback', () => {
    const urls = detectorOnnxUrls('https://example.r2.dev/')
    expect(urls[0]).toBe(`https://example.r2.dev/${DETECTOR_ONNX_KEY}`)
    expect(urls[1]).toMatch(/pixilated730\/local-ai-image-detector/)
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
  it('uses a 0.65 / 0.35 band', () => {
    expect(verdictFromProbability(0.65)).toBe('likely-ai')
    expect(verdictFromProbability(0.35)).toBe('likely-human')
    expect(verdictFromProbability(0.5)).toBe('inconclusive')
  })
})

describe('re-fit ViT-S preprocess + logit', () => {
  it('resizes the shortest edge to 440 then center-crops 384', () => {
    expect(CLASSIFIER_RESIZE).toBe(440)
    expect(CLASSIFIER_CROP).toBe(384)
    expect(CLASSIFIER_SIZE).toBe(384)
    expect(shortestEdgeSize(1920, 1080, 440)).toEqual({ w: 782, h: 440 })
    expect(centerCropOrigin(782, 440, 384)).toEqual({ sx: 199, sy: 28, side: 384 })
  })

  it('five-crops center + four corners and dedupes a square crop', () => {
    const crops = fiveCropOrigins(782, 440, 384)
    expect(crops).toHaveLength(5)
    expect(crops[0]).toEqual({ sx: 199, sy: 28, side: 384 })
    expect(fiveCropOrigins(384, 384, 384)).toHaveLength(1)
    expect(DETECTOR_LOGIT_OFFSET).toBe(1.67)
    expect(aiScoreFromLogitList([0, 0])).toBeCloseTo(1 / (1 + Math.exp(-1.67)))
  })

  it('copies a 2x2 crop out of a 4-wide RGB row', () => {
    // 3x2 RGB, crop 2x2 from (1,0)
    const rgb = [
      1, 0, 0, 2, 0, 0, 3, 0, 0,
      4, 0, 0, 5, 0, 0, 6, 0, 0,
    ]
    expect(Array.from(cropHwc(rgb, 3, 2, 3, { sx: 1, sy: 0, side: 2 }))).toEqual([
      2, 0, 0, 3, 0, 0,
      5, 0, 0, 6, 0, 0,
    ])
  })

  it('points preload at the R2 fp32 ONNX', () => {
    expect(detectorOnnxUrl('https://example.r2.dev/')).toBe(
      `https://example.r2.dev/${DETECTOR_ONNX_KEY}`,
    )
    expect(detectorQuantizedOnnxUrl('https://example.r2.dev/')).toBe(detectorOnnxUrl('https://example.r2.dev/'))
  })

  it('maps a single fake-logit through sigmoid', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5)
    expect(aiScoreFromLogits([0])).toBeCloseTo(0.5)
    expect(aiScoreFromLogits([10])).toBeGreaterThan(0.99)
    expect(aiScoreFromLogits([-10])).toBeLessThan(0.01)
  })

  it('packs 2x2 RGB into NCHW float32 of length 12', () => {
    const rgb = [255, 0, 0, 0, 255, 0, 0, 0, 255, 128, 128, 128]
    const t = rgbToNchwFloat32(rgb, 2, 2, 3)
    expect(t.length).toBe(12)
    expect(t[0]).toBeCloseTo((1 - 0.485) / 0.229)
  })
})

describe('rgbaToRgb', () => {
  it('drops alpha and keeps RGB in order', () => {
    const rgba = new Uint8ClampedArray([10, 20, 30, 255, 40, 50, 60, 128])
    expect(Array.from(rgbaToRgb(rgba, 2, 1))).toEqual([10, 20, 30, 40, 50, 60])
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

  it('maps ONNX broadcast failures', () => {
    expect(friendlyImageError(new Error('failed to call OrtRun(). ERROR_CODE: 1'))).toMatch(/size mismatch/)
  })
})
