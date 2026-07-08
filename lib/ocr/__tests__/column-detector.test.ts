import { describe, expect, it } from 'vitest'
import {
  gaussianSmooth,
  findPeaks,
  findValleys,
  clusterPositions,
  detectHoughColumns,
  detectProjectionColumns,
} from '../column-detector'

describe('gaussianSmooth', () => {
  it('returns same length as input', () => {
    const input = new Float32Array([0, 0, 10, 0, 0])
    const out = gaussianSmooth(input, 1)
    expect(out.length).toBe(5)
  })

  it('spreads a spike across neighbours', () => {
    const input = new Float32Array([0, 0, 100, 0, 0])
    const out = gaussianSmooth(input, 1)
    expect(out[2]).toBeLessThan(100)
    expect(out[1]).toBeGreaterThan(0)
    expect(out[3]).toBeGreaterThan(0)
  })

  it('preserves a flat signal', () => {
    const input = new Float32Array(10).fill(5)
    const out = gaussianSmooth(input, 2)
    for (const v of out) expect(v).toBeCloseTo(5, 1)
  })
})

describe('findPeaks', () => {
  it('finds the tallest element as a peak', () => {
    const arr = new Float32Array([1, 3, 1, 5, 1, 2, 1])
    const peaks = findPeaks(arr, 2)
    expect(peaks).toContain(3)
  })

  it('returns empty when all values below threshold', () => {
    const arr = new Float32Array([1, 2, 1, 2, 1])
    expect(findPeaks(arr, 5)).toEqual([])
  })

  it('does not return endpoints', () => {
    const arr = new Float32Array([10, 1, 1, 1, 10])
    const peaks = findPeaks(arr, 5)
    expect(peaks).not.toContain(0)
    expect(peaks).not.toContain(4)
  })
})

describe('findValleys', () => {
  it('finds the lowest element as a valley', () => {
    const arr = new Float32Array([5, 5, 0.01, 5, 5])
    const valleys = findValleys(arr, 0.05)
    expect(valleys).toContain(2)
  })

  it('returns empty when all values above threshold', () => {
    const arr = new Float32Array([5, 6, 5, 6, 5])
    expect(findValleys(arr, 0.1)).toEqual([])
  })
})

describe('clusterPositions', () => {
  it('returns empty array for empty input', () => {
    expect(clusterPositions([], 5)).toEqual([])
  })

  it('merges positions within tolerance', () => {
    const result = clusterPositions([100, 102, 103, 200, 202], 5)
    expect(result).toHaveLength(2)
    expect(result[0]).toBeCloseTo(101.67, 0)
    expect(result[1]).toBeCloseTo(201, 0)
  })

  it('keeps positions outside tolerance separate', () => {
    const result = clusterPositions([10, 100], 5)
    expect(result).toHaveLength(2)
  })
})

describe('detectHoughColumns', () => {
  it('returns null for a blank image', () => {
    const W = 100, H = 50
    const binary = new Uint8Array(W * H).fill(0)
    expect(detectHoughColumns(binary, W, H)).toBeNull()
  })

  it('detects two vertical black lines', () => {
    const W = 200, H = 100
    const binary = new Uint8Array(W * H).fill(0)
    for (let y = 0; y < H; y++) {
      binary[y * W + 50]  = 1
      binary[y * W + 150] = 1
    }
    const result = detectHoughColumns(binary, W, H)
    expect(result).not.toBeNull()
    expect(result!.length).toBeGreaterThanOrEqual(2)
    expect(result!.some(x => Math.abs(x - 50) <= 4)).toBe(true)
    expect(result!.some(x => Math.abs(x - 150) <= 4)).toBe(true)
  })

  it('returns null for a single short vertical stroke (not a gridline)', () => {
    const W = 200, H = 100
    const binary = new Uint8Array(W * H).fill(0)
    for (let y = 0; y < 10; y++) binary[y * W + 100] = 1
    expect(detectHoughColumns(binary, W, H)).toBeNull()
  })
})

describe('detectProjectionColumns', () => {
  it('returns null for a blank image', () => {
    const W = 100, H = 50
    const binary = new Uint8Array(W * H).fill(0)
    expect(detectProjectionColumns(binary, W, H)).toBeNull()
  })

  it('detects a clear gap between two dense text regions', () => {
    const W = 200, H = 100
    const binary = new Uint8Array(W * H).fill(0)
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < 80; x++)  binary[y * W + x] = 1
      for (let x = 120; x < W; x++) binary[y * W + x] = 1
    }
    const result = detectProjectionColumns(binary, W, H)
    expect(result).not.toBeNull()
    expect(result!.some(x => x >= 80 && x <= 120)).toBe(true)
  })
})
