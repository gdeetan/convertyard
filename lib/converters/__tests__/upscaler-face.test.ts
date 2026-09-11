import { describe, expect, it } from 'vitest'

import {
  decodeYunetHeads,
  decodeYunetRows,
  expandFaceBox,
  featherWeight,
  gfpganNchwToRgba,
  pasteFace,
  rgbaToGfpganNchw,
} from '../upscaler-face'

describe('expandFaceBox', () => {
  it('pads a detection and clamps it to the image', () => {
    expect(expandFaceBox({ x: 40, y: 40, w: 20, h: 20 }, 100, 100, 0.5)).toEqual({
      x: 30,
      y: 30,
      w: 40,
      h: 40,
    })
  })

  it('does not extend past the image edge', () => {
    expect(expandFaceBox({ x: 0, y: 90, w: 20, h: 20 }, 100, 100, 0.5)).toEqual({
      x: 0,
      y: 80,
      w: 30,
      h: 20,
    })
  })
})

describe('featherWeight', () => {
  it('is 1 at the centre and 0 at the rim', () => {
    expect(featherWeight(16, 16, 32, 32)).toBeCloseTo(1, 5)
    expect(featherWeight(0, 0, 32, 32)).toBe(0)
    expect(featherWeight(31, 31, 32, 32)).toBeLessThan(0.2)
  })
})

describe('GFPGAN tensor packing', () => {
  it('maps RGBA bytes onto NCHW in [-1, 1]', () => {
    const rgba = new Uint8ClampedArray([255, 0, 128, 255])
    const nchw = rgbaToGfpganNchw(rgba, 1, 1)
    expect(Array.from(nchw).map((v) => Number(v.toFixed(4)))).toEqual([1, -1, 0.0039])
  })

  it('round-trips a mid-grey face crop', () => {
    const rgba = new Uint8ClampedArray([64, 128, 192, 255])
    const out = gfpganNchwToRgba(rgbaToGfpganNchw(rgba, 1, 1), 1, 1)
    expect(Array.from(out.slice(0, 3))).toEqual([64, 128, 192])
  })
})

describe('decodeYunetHeads', () => {
  it('decodes a stride-8 centre prior into a box on the source image', () => {
    const cls = new Float32Array(4)
    const obj = new Float32Array(4)
    const bbox = new Float32Array(16)
    cls[3] = 1
    obj[3] = 1
    // idx 3 → row 1, col 1 on a 2×2 grid (16px / stride 8)
    const boxes = decodeYunetHeads(
      {
        cls_8: { data: cls },
        obj_8: { data: obj },
        bbox_8: { data: bbox },
      },
      16,
      16,
      32,
      32,
      0.5
    )
    expect(boxes).toHaveLength(1)
    expect(boxes[0].w).toBeCloseTo(16, 5)
    expect(boxes[0].h).toBeCloseTo(16, 5)
    expect(boxes[0].x).toBeCloseTo(8, 5)
    expect(boxes[0].y).toBeCloseTo(8, 5)
  })
})

describe('decodeYunetRows', () => {
  it('scales detector-space boxes onto the source image and drops low scores', () => {
    const data = [
      10, 10, 20, 20, 0.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 2, 2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]
    expect(decodeYunetRows(data, 15, 100, 100, 200, 200, 0.6)).toEqual([
      { x: 20, y: 20, w: 40, h: 40 },
    ])
  })
})

describe('pasteFace', () => {
  it('blends the restored face over the base using a feathered mask', () => {
    const base = new Uint8ClampedArray(8 * 8 * 4)
    for (let i = 0; i < 8 * 8; i++) {
      base[i * 4] = 10
      base[i * 4 + 1] = 10
      base[i * 4 + 2] = 10
      base[i * 4 + 3] = 255
    }
    const face = new Uint8ClampedArray(4 * 4 * 4)
    face.fill(255)
    const out = pasteFace(base, 8, 8, face, 4, 4, { x: 2, y: 2, w: 4, h: 4 })
    const centre = ((4 * 8) + 4) * 4
    expect(out[centre]).toBeGreaterThan(200)
    expect(out[0]).toBe(10)
  })
})
