export interface NormalizedTensorShape {
  height: number
  width: number
  channels: number
}

const FLAT_VARIANCE_EPSILON = 1e-3

export function normalizeTensorShape(shape: readonly number[]): NormalizedTensorShape {
  if (shape.length === 3) {
    const [height, width, channels] = shape
    if (channels !== 3) throw new Error(`Expected RGB tensor, got ${channels} channels`)
    return { height, width, channels }
  }

  if (shape.length === 4) {
    const [batch, height, width, channels] = shape
    if (batch !== 1) throw new Error(`Expected batch size 1, got ${batch}`)
    if (channels !== 3) throw new Error(`Expected RGB tensor, got ${channels} channels`)
    return { height, width, channels }
  }

  throw new Error(`Unsupported tensor shape: [${shape.join(', ')}]`)
}

export function rgbaFromTensorFloats(
  floats: Float32Array,
  shape: readonly number[]
): Uint8ClampedArray {
  const { height, width, channels } = normalizeTensorShape(shape)
  const expectedLength = width * height * channels
  if (floats.length !== expectedLength) {
    throw new Error(`Tensor data length mismatch: expected ${expectedLength}, got ${floats.length}`)
  }

  const usesUnitRange = inferUnitRange(floats)
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = toByte(floats[i * 3], usesUnitRange)
    rgba[i * 4 + 1] = toByte(floats[i * 3 + 1], usesUnitRange)
    rgba[i * 4 + 2] = toByte(floats[i * 3 + 2], usesUnitRange)
    rgba[i * 4 + 3] = 255
  }
  return rgba
}

function inferUnitRange(floats: Float32Array): boolean {
  for (let i = 0; i < floats.length; i++) {
    if (floats[i] > 1) return false
  }
  return true
}

function toByte(value: number, usesUnitRange: boolean): number {
  const scaled = usesUnitRange ? value * 255 : value
  return Math.min(255, Math.max(0, Math.round(scaled)))
}

export function sampleChannelVariance(
  pixels: Uint8ClampedArray,
  channelsPerPixel: 3 | 4
): number {
  if (pixels.length === 0) return 0

  const pixelCount = Math.floor(pixels.length / channelsPerPixel)
  if (pixelCount === 0) return 0

  let sum = 0
  let sampleCount = 0
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channelsPerPixel
    sum += pixels[offset] + pixels[offset + 1] + pixels[offset + 2]
    sampleCount += 3
  }

  const mean = sum / sampleCount
  let varianceSum = 0
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * channelsPerPixel
    for (let c = 0; c < 3; c++) {
      const diff = pixels[offset + c] - mean
      varianceSum += diff * diff
    }
  }

  return varianceSum / sampleCount
}

export function detectFlatOutputMismatch(
  sourcePixels: Uint8ClampedArray,
  outputPixels: Uint8ClampedArray
): boolean {
  const sourceVariance = sampleChannelVariance(sourcePixels, 4)
  const outputVariance = sampleChannelVariance(outputPixels, 4)
  return sourceVariance > FLAT_VARIANCE_EPSILON && outputVariance <= FLAT_VARIANCE_EPSILON
}

export class GaussianAccumulator {
  private readonly accumRGBA: Float32Array
  private readonly accumW: Float32Array
  readonly outW: number
  readonly outH: number

  constructor(outW: number, outH: number) {
    this.outW = outW
    this.outH = outH
    this.accumRGBA = new Float32Array(outW * outH * 4)
    this.accumW = new Float32Array(outW * outH)
  }

  // Accumulate a tile's pixel contribution with Gaussian weights.
  // tilePixels: RGBA Uint8ClampedArray from the upscaled tile (full tile including overlap)
  // tileW, tileH: dimensions of the upscaled tile
  // destX, destY: top-left corner of this tile in output space (including overlap offset)
  // sigma: standard deviation of Gaussian (suggested: tileW * 0.35)
  accumulate(
    tilePixels: Uint8ClampedArray,
    tileW: number,
    tileH: number,
    destX: number,
    destY: number,
    sigma: number
  ): void {
    const cx = tileW / 2
    const cy = tileH / 2
    const inv2SigSq = 1 / (2 * sigma * sigma)

    for (let ty = 0; ty < tileH; ty++) {
      const oy = destY + ty
      if (oy < 0 || oy >= this.outH) continue
      const dy = ty - cy

      for (let tx = 0; tx < tileW; tx++) {
        const ox = destX + tx
        if (ox < 0 || ox >= this.outW) continue
        const dx = tx - cx

        const w = Math.exp(-(dx * dx + dy * dy) * inv2SigSq)
        const tileIdx = (ty * tileW + tx) * 4
        const outIdx = (oy * this.outW + ox)

        this.accumRGBA[outIdx * 4]     += tilePixels[tileIdx]     * w
        this.accumRGBA[outIdx * 4 + 1] += tilePixels[tileIdx + 1] * w
        this.accumRGBA[outIdx * 4 + 2] += tilePixels[tileIdx + 2] * w
        this.accumRGBA[outIdx * 4 + 3] += tilePixels[tileIdx + 3] * w
        this.accumW[outIdx] += w
      }
    }
  }

  // Normalize accumulated values and return the final RGBA image.
  normalize(): Uint8ClampedArray<ArrayBuffer> {
    const n = this.outW * this.outH
    const out = new Uint8ClampedArray(n * 4)
    for (let i = 0; i < n; i++) {
      const w = this.accumW[i]
      if (w === 0) {
        // Leave as 0 (transparent black) — no tiles covered this pixel
        continue
      }
      out[i * 4]     = Math.min(255, Math.round(this.accumRGBA[i * 4]     / w))
      out[i * 4 + 1] = Math.min(255, Math.round(this.accumRGBA[i * 4 + 1] / w))
      out[i * 4 + 2] = Math.min(255, Math.round(this.accumRGBA[i * 4 + 2] / w))
      out[i * 4 + 3] = Math.min(255, Math.round(this.accumRGBA[i * 4 + 3] / w))
    }
    return out
  }
}
