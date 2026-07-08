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
