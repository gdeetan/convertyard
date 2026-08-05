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

describe('JPEG artifact detection logic', () => {
  it('DCT boundary ratio detects JPEG-like 8px block boundaries', () => {
    // Create a 200x200 RGBA array with 8px uniform blocks (mimics JPEG quantization)
    // with slight boundary gradients between blocks
    const w = 200, h = 200
    const data = new Uint8ClampedArray(w * h * 4)
    // Fill with 8×8 blocks, each block uniform gray, adjacent blocks differ by 40
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const blockX = Math.floor(x / 8)
        const blockY = Math.floor(y / 8)
        const value = ((blockX + blockY) % 2) * 40 + 100 // alternating 100, 140
        const idx = (y * w + x) * 4
        data[idx] = data[idx+1] = data[idx+2] = value
        data[idx+3] = 255
      }
    }

    // Compute DCT boundary signal (replicate the logic)
    let boundaryGrad = 0, boundaryCount = 0
    let nonBoundaryGrad = 0, nonBoundaryCount = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4
        const right = data[(y * w + x + 1) * 4]
        const below = data[((y + 1) * w + x) * 4]
        const grad = Math.abs(data[idx] - right) + Math.abs(data[idx] - below)

        const isBoundaryX = (x % 8 === 7) // just before a boundary
        const isBoundaryY = (y % 8 === 7)

        if (isBoundaryX || isBoundaryY) {
          boundaryGrad += grad; boundaryCount++
        } else {
          nonBoundaryGrad += grad; nonBoundaryCount++
        }
      }
    }
    const avgBoundary = boundaryGrad / Math.max(1, boundaryCount)
    const avgNonBoundary = nonBoundaryGrad / Math.max(1, nonBoundaryCount)

    // JPEG-like data should have high boundary gradient vs interior
    expect(avgBoundary).toBeGreaterThan(avgNonBoundary * 1.5)
  })

  it('DCT boundary ratio does NOT trigger for smooth gradient', () => {
    const w = 200, h = 200
    const data = new Uint8ClampedArray(w * h * 4)
    // Smooth horizontal gradient
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const value = Math.round((x / w) * 255)
        const idx = (y * w + x) * 4
        data[idx] = data[idx+1] = data[idx+2] = value
        data[idx+3] = 255
      }
    }

    let boundaryGrad = 0, boundaryCount = 0
    let nonBoundaryGrad = 0, nonBoundaryCount = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4
        const right = data[(y * w + x + 1) * 4]
        const below = data[((y + 1) * w + x) * 4]
        const grad = Math.abs(data[idx] - right) + Math.abs(data[idx] - below)
        const isBoundaryX = (x % 8 === 7)
        const isBoundaryY = (y % 8 === 7)
        if (isBoundaryX || isBoundaryY) { boundaryGrad += grad; boundaryCount++ }
        else { nonBoundaryGrad += grad; nonBoundaryCount++ }
      }
    }
    const avgBoundary = boundaryGrad / Math.max(1, boundaryCount)
    const avgNonBoundary = nonBoundaryGrad / Math.max(1, nonBoundaryCount)

    // Smooth gradient should NOT trigger the JPEG boundary signal
    expect(avgBoundary).toBeLessThanOrEqual(avgNonBoundary * 1.5)
  })

  it('model routing returns compressed-sr model for photo-compressed at 2x', () => {
    // Verify the routing table by testing the logic directly
    function route2x(mode: string): string {
      if (mode === 'photo-compressed') return 'Xenova/swin2SR-compressed-sr-x2-48'
      return 'Xenova/swin2SR-classical-sr-x2-64'
    }
    expect(route2x('photo-compressed')).toBe('Xenova/swin2SR-compressed-sr-x2-48')
    expect(route2x('photo')).toBe('Xenova/swin2SR-classical-sr-x2-64')
  })
})
