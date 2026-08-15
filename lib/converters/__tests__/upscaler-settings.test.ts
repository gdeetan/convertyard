import { describe, expect, it } from 'vitest'

import {
  REALESRGAN_ANIME_X4,
  REALESRGAN_X4,
  SWIN2SR_CLASSICAL_X2,
  SWIN2SR_COMPRESSED_X2,
  SWIN2SR_REALWORLD_X4,
  blobEncodeOptions,
  illustrationRouting,
  modelRouting,
  resolveImageMode,
  swin2srFallbackRouting,
  tileSettings,
} from '../upscaler-settings'

describe('blobEncodeOptions', () => {
  it('encodes JPEG at 0.97 instead of a heavier recompress', () => {
    expect(blobEncodeOptions('image/jpeg')).toEqual({ type: 'image/jpeg', quality: 0.97 })
  })

  it('encodes WebP at 0.97', () => {
    expect(blobEncodeOptions('image/webp')).toEqual({ type: 'image/webp', quality: 0.97 })
  })

  it('encodes PNG without a quality knob', () => {
    expect(blobEncodeOptions('image/png')).toEqual({ type: 'image/png' })
  })
})

describe('tileSettings', () => {
  it('uses larger tiles and overlap on WebGPU', () => {
    expect(tileSettings('webgpu')).toEqual({ tilePx: 256, overlap: 16, dtype: 'fp16' })
  })

  it('keeps conservative tiles and q8 on WASM and CPU', () => {
    expect(tileSettings('wasm')).toEqual({ tilePx: 128, overlap: 8, dtype: 'q8' })
    expect(tileSettings('cpu')).toEqual({ tilePx: 128, overlap: 8, dtype: 'q8' })
  })
})

describe('modelRouting', () => {
  it('uses Swin2SR x2 variants for 2×', () => {
    expect(modelRouting('2x', 'photo').chains).toEqual([
      { modelId: SWIN2SR_CLASSICAL_X2, scale: 2, kind: 'swin2sr' },
    ])
    expect(modelRouting('2x', 'photo-compressed').chains).toEqual([
      { modelId: SWIN2SR_COMPRESSED_X2, scale: 2, kind: 'swin2sr' },
    ])
  })

  it('uses Real-ESRGAN v3 for 3× and 4×', () => {
    expect(modelRouting('3x', 'photo').chains).toEqual([
      { modelId: REALESRGAN_X4, scale: 4, kind: 'realesrgan' },
    ])
    expect(modelRouting('4x', 'photo-compressed').chains).toEqual([
      { modelId: REALESRGAN_X4, scale: 4, kind: 'realesrgan' },
    ])
  })

  it('chains Real-ESRGAN 4× then Swin2SR 2× for 8×', () => {
    expect(modelRouting('8x', 'photo').chains).toEqual([
      { modelId: REALESRGAN_X4, scale: 4, kind: 'realesrgan' },
      { modelId: SWIN2SR_CLASSICAL_X2, scale: 2, kind: 'swin2sr' },
    ])
    expect(modelRouting('8x', 'photo-compressed').chains).toEqual([
      { modelId: REALESRGAN_X4, scale: 4, kind: 'realesrgan' },
      { modelId: SWIN2SR_COMPRESSED_X2, scale: 2, kind: 'swin2sr' },
    ])
  })
})

describe('swin2srFallbackRouting', () => {
  it('uses the real-world 4× Swin2SR model when Real-ESRGAN is unavailable', () => {
    expect(swin2srFallbackRouting('4x', 'photo').chains[0]?.modelId).toBe(SWIN2SR_REALWORLD_X4)
    expect(swin2srFallbackRouting('4x', 'photo-compressed').chains[0]?.modelId).toBe(SWIN2SR_REALWORLD_X4)
  })

  it('still splits 2× clean vs compressed', () => {
    expect(swin2srFallbackRouting('2x', 'photo').chains[0]?.modelId).toBe(SWIN2SR_CLASSICAL_X2)
    expect(swin2srFallbackRouting('2x', 'photo-compressed').chains[0]?.modelId).toBe(SWIN2SR_COMPRESSED_X2)
  })
})

describe('resolveImageMode', () => {
  it('sends auto-detected graphics to illustration, not Lanczos', () => {
    expect(resolveImageMode('auto', 'graphic')).toBe('illustration')
    expect(resolveImageMode('auto', 'photo')).toBe('photo')
    expect(resolveImageMode('auto', 'photo-compressed')).toBe('photo-compressed')
  })

  it('keeps explicit Graphic on Lanczos and Illustration on the 2D model', () => {
    expect(resolveImageMode('graphic')).toBe('graphic')
    expect(resolveImageMode('illustration')).toBe('illustration')
    expect(resolveImageMode('photo')).toBe('photo')
  })
})

describe('illustrationRouting', () => {
  it('uses AnimeVideo v3 at 4× for every scale; extra scale is Lanczos after', () => {
    for (const scale of ['2x', '3x', '4x', '8x'] as const) {
      expect(illustrationRouting(scale).chains).toEqual([
        { modelId: REALESRGAN_ANIME_X4, scale: 4, kind: 'realesrgan' },
      ])
    }
    expect(illustrationRouting('2x').actualScale).toBe(2)
    expect(illustrationRouting('4x').actualScale).toBe(4)
    expect(illustrationRouting('8x').actualScale).toBe(8)
  })
})
