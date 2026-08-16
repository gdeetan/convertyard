import { describe, expect, it } from 'vitest'

import { nchwFloat01ToRgba, rgbaToNchwFloat01, srFloatsToRgba } from '../upscaler-render'

describe('rgbaToNchwFloat01', () => {
  it('packs RGB into NCHW [0,1] and drops alpha', () => {
    const rgba = new Uint8ClampedArray([
      255, 0, 0, 128,
      0, 255, 0, 255,
      0, 0, 255, 255,
      255, 255, 255, 255,
    ])
    const nchw = rgbaToNchwFloat01(rgba, 2, 2)
    expect(Array.from(nchw)).toEqual([
      1, 0, 0, 1,
      0, 1, 0, 1,
      0, 0, 1, 1,
    ])
  })
})

describe('nchwFloat01ToRgba', () => {
  it('round-trips NCHW float data back to opaque RGBA', () => {
    const rgba = new Uint8ClampedArray([
      10, 20, 30, 255,
      40, 50, 60, 255,
    ])
    const nchw = rgbaToNchwFloat01(rgba, 2, 1)
    const out = nchwFloat01ToRgba(nchw, 2, 1)
    expect(Array.from(out)).toEqual([10, 20, 30, 255, 40, 50, 60, 255])
  })

  it('clamps values outside 0–1', () => {
    const nchw = new Float32Array([-0.2, 1.4, 0.5])
    const out = nchwFloat01ToRgba(nchw, 1, 1)
    expect(Array.from(out)).toEqual([0, 255, 128, 255])
  })
})

describe('srFloatsToRgba', () => {
  it('reads NHWC WebGPU output instead of treating it as NCHW scanlines', () => {
    // One red pixel, one green pixel, packed RGBRGB (NHWC)
    const nhwc = new Float32Array([1, 0, 0, 0, 1, 0])
    const asNchw = nchwFloat01ToRgba(nhwc, 2, 1)
    expect(Array.from(asNchw)).not.toEqual([255, 0, 0, 255, 0, 255, 0, 255])

    const out = srFloatsToRgba(nhwc, 2, 1, [1, 1, 2, 3])
    expect(Array.from(out)).toEqual([255, 0, 0, 255, 0, 255, 0, 255])
  })

  it('still reads NCHW when dims say channel-first', () => {
    const nchw = new Float32Array([1, 0, 0, 1, 0, 0])
    const out = srFloatsToRgba(nchw, 2, 1, [1, 3, 1, 2])
    expect(Array.from(out)).toEqual([255, 0, 0, 255, 0, 255, 0, 255])
  })
})
