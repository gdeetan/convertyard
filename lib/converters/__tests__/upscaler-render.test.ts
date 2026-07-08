import { describe, expect, it } from 'vitest'

import {
  detectFlatOutputMismatch,
  normalizeTensorShape,
  rgbaFromTensorFloats,
  sampleChannelVariance,
} from '../upscaler-render'

describe('normalizeTensorShape', () => {
  it('accepts rank-3 HWC tensors', () => {
    expect(normalizeTensorShape([2, 3, 3])).toEqual({
      height: 2,
      width: 3,
      channels: 3,
    })
  })

  it('accepts rank-4 NHWC tensors with batch size 1', () => {
    expect(normalizeTensorShape([1, 2, 3, 3])).toEqual({
      height: 2,
      width: 3,
      channels: 3,
    })
  })

  it('rejects unsupported tensor shapes', () => {
    expect(() => normalizeTensorShape([2, 3])).toThrow(/unsupported tensor shape/i)
    expect(() => normalizeTensorShape([2, 3, 4])).toThrow(/rgb tensor/i)
    expect(() => normalizeTensorShape([2, 2, 3, 3])).toThrow(/batch size 1/i)
  })
})

describe('rgbaFromTensorFloats', () => {
  it('converts rank-3 tensor floats into non-uniform RGBA output', () => {
    const rgba = rgbaFromTensorFloats(
      new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
        1, 1, 1,
      ]),
      [2, 2, 3]
    )

    expect(Array.from(rgba)).toEqual([
      255, 0, 0, 255,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 255, 255,
    ])
  })

  it('converts rank-4 tensor floats into identical RGBA output', () => {
    const floats = new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
      1, 1, 1,
    ])

    expect(Array.from(rgbaFromTensorFloats(floats, [1, 2, 2, 3]))).toEqual(
      Array.from(rgbaFromTensorFloats(floats, [2, 2, 3]))
    )
  })
})

describe('flat output detection', () => {
  it('detects a flat output tile when the source tile has visible variance', () => {
    const source = new Uint8ClampedArray([
      0, 0, 0, 255,
      255, 255, 255, 255,
      64, 64, 64, 255,
      192, 192, 192, 255,
    ])
    const flat = new Uint8ClampedArray([
      128, 128, 128, 255,
      128, 128, 128, 255,
      128, 128, 128, 255,
      128, 128, 128, 255,
    ])

    expect(sampleChannelVariance(source, 4)).toBeGreaterThan(0)
    expect(sampleChannelVariance(flat, 4)).toBe(0)
    expect(detectFlatOutputMismatch(source, flat)).toBe(true)
  })

  it('does not flag uniformly flat output for uniformly flat source tiles', () => {
    const flat = new Uint8ClampedArray([
      32, 32, 32, 255,
      32, 32, 32, 255,
      32, 32, 32, 255,
      32, 32, 32, 255,
    ])

    expect(detectFlatOutputMismatch(flat, flat)).toBe(false)
  })
})
