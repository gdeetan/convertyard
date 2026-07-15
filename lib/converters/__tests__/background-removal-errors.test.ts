import { describe, expect, it } from 'vitest'

import {
  BackgroundRemovalError,
  normalizeRgbaData,
  serializeBackgroundRemovalError,
  validateCanvasRgbaLength,
  validateMaskLength,
} from '../background-removal-errors'

describe('background removal image data guards', () => {
  it('accepts exact RGBA data', () => {
    const rgba = normalizeRgbaData(new Uint8Array(16), 2, 2)

    expect(rgba).toBeInstanceOf(Uint8ClampedArray)
    expect(rgba).toHaveLength(16)
  })

  it('copies only the typed-array view, not the whole backing buffer', () => {
    const backing = new Uint8Array(32)
    backing.fill(9)
    backing.set([1, 2, 3, 4], 8)

    const view = new Uint8Array(backing.buffer, 8, 4)
    const rgba = normalizeRgbaData(view, 1, 1)

    expect(Array.from(rgba)).toEqual([1, 2, 3, 4])
    expect(rgba.buffer.byteLength).toBe(4)
  })

  it('rejects short or long RGBA data before ImageData construction', () => {
    expect(() => normalizeRgbaData(new Uint8Array(15), 2, 2)).toThrow(BackgroundRemovalError)
    expect(() => normalizeRgbaData(new Uint8Array(17), 2, 2)).toThrow(/expected 16/i)
  })

  it('rejects mask data that does not match image dimensions', () => {
    expect(() => validateMaskLength(new Uint8Array(3), 2, 2)).toThrow(/Mask length mismatch/i)
  })

  it('rejects canvas RGBA data that does not match image dimensions', () => {
    expect(() => validateCanvasRgbaLength(new Uint8ClampedArray(15), 2, 2)).toThrow(
      /Canvas RGBA length mismatch/i
    )
  })

  it('serializes native ImageData length errors as RGBA length mismatches', () => {
    const serialized = serializeBackgroundRemovalError(
      new Error("Failed to construct 'ImageData': The input data length is not equal to (4 * width * height)."),
      'MODEL_INFERENCE_FAILED',
      'inference'
    )

    expect(serialized).toEqual({
      code: 'IMAGE_RGBA_LENGTH_MISMATCH',
      phase: 'composite',
      message: "Failed to construct 'ImageData': The input data length is not equal to (4 * width * height).",
    })
  })
})
