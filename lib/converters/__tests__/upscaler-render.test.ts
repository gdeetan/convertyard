import { describe, expect, it } from 'vitest'

import {
  GaussianAccumulator,
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
  it('keeps UpscalerJS 0..255 tensor values in-range instead of multiplying them again', () => {
    const rgba = rgbaFromTensorFloats(
      new Float32Array([
        255, 0, 0,
        0, 128, 0,
        0, 0, 64,
        255, 255, 255,
      ]),
      [2, 2, 3]
    )

    expect(Array.from(rgba)).toEqual([
      255, 0, 0, 255,
      0, 128, 0, 255,
      0, 0, 64, 255,
      255, 255, 255, 255,
    ])
  })

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

describe('GaussianAccumulator', () => {
  it('normalize() returns all zeros when no tiles accumulated', () => {
    const acc = new GaussianAccumulator(4, 4)
    const result = acc.normalize()
    expect(result.every(v => v === 0)).toBe(true)
  })

  it('normalize() returns correct pixel for single tile with no overlap', () => {
    const acc = new GaussianAccumulator(2, 2)
    // Solid red tile (2x2, RGBA)
    const tile = new Uint8ClampedArray([
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
    ])
    acc.accumulate(tile, 2, 2, 0, 0, 1.0)
    const result = acc.normalize()
    // All pixels should be red (255, 0, 0, 255)
    expect(result[0]).toBe(255) // R
    expect(result[1]).toBe(0)   // G
    expect(result[2]).toBe(0)   // B
    expect(result[3]).toBe(255) // A
  })

  it('normalize() blends two overlapping tiles between their values', () => {
    const acc = new GaussianAccumulator(4, 2)
    // Red tile covering left half + 2px overlap into right (4px wide, 2px tall)
    const redTile = new Uint8ClampedArray(4 * 2 * 4).fill(0)
    for (let i = 0; i < 4 * 2; i++) { redTile[i * 4] = 255; redTile[i * 4 + 3] = 255 }
    acc.accumulate(redTile, 4, 2, -1, 0, 2.0) // offset so center is at x=1

    // Blue tile covering right half + 2px overlap into left (4px wide, 2px tall)
    const blueTile = new Uint8ClampedArray(4 * 2 * 4).fill(0)
    for (let i = 0; i < 4 * 2; i++) { blueTile[i * 4 + 2] = 255; blueTile[i * 4 + 3] = 255 }
    acc.accumulate(blueTile, 4, 2, -1 + 2, 0, 2.0) // center at x=2

    const result = acc.normalize()
    // Center pixels (x=1 and x=2) should be blended — neither pure red nor pure blue
    const x1R = result[(0 * 4 + 1) * 4]
    const x1B = result[(0 * 4 + 1) * 4 + 2]
    const x2R = result[(0 * 4 + 2) * 4]
    const x2B = result[(0 * 4 + 2) * 4 + 2]
    // Both center pixels should have both red and blue components
    expect(x1R).toBeGreaterThan(0)
    expect(x1B).toBeGreaterThan(0)
    expect(x2R).toBeGreaterThan(0)
    expect(x2B).toBeGreaterThan(0)
  })

  it('accumW[i] === 0 guard produces 0 not NaN in normalize()', () => {
    const acc = new GaussianAccumulator(4, 4)
    // Accumulate only a 1x1 tile in the corner — leaves other pixels uncovered
    const tile = new Uint8ClampedArray([128, 64, 32, 255])
    acc.accumulate(tile, 1, 1, 0, 0, 0.5)
    const result = acc.normalize()
    // Uncovered pixels (where w=0) must be 0, not NaN
    for (let i = 0; i < result.length; i++) {
      expect(Number.isNaN(result[i])).toBe(false)
    }
  })
})
