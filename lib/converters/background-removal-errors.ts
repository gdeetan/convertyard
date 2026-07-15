export type BackgroundRemovalErrorCode =
  | 'IMAGE_DECODE_FAILED'
  | 'IMAGE_RGBA_LENGTH_MISMATCH'
  | 'MASK_DIMENSION_MISMATCH'
  | 'MODEL_LOAD_FAILED'
  | 'MODEL_INFERENCE_FAILED'
  | 'CANVAS_RGBA_LENGTH_MISMATCH'
  | 'CANVAS_EXPORT_FAILED'
  | 'UNKNOWN_BACKGROUND_REMOVAL_ERROR'

export type BackgroundRemovalPhase =
  | 'load'
  | 'decode'
  | 'preprocess'
  | 'inference'
  | 'composite'
  | 'export'
  | 'unknown'

export interface SerializedBackgroundRemovalError {
  code: BackgroundRemovalErrorCode
  phase: BackgroundRemovalPhase
  message: string
}

export class BackgroundRemovalError extends Error {
  code: BackgroundRemovalErrorCode
  phase: BackgroundRemovalPhase

  constructor(code: BackgroundRemovalErrorCode, phase: BackgroundRemovalPhase, message: string) {
    super(message)
    this.name = 'BackgroundRemovalError'
    this.code = code
    this.phase = phase
  }
}

function expectedRgbaLength(width: number, height: number): number {
  return width * height * 4
}

function expectedMaskLength(width: number, height: number): number {
  return width * height
}

function assertPositiveDimensions(width: number, height: number, phase: BackgroundRemovalPhase) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new BackgroundRemovalError(
      'IMAGE_RGBA_LENGTH_MISMATCH',
      phase,
      `Invalid image dimensions: ${width}x${height}.`
    )
  }
}

export function normalizeRgbaData(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  phase: BackgroundRemovalPhase = 'composite'
): Uint8ClampedArray<ArrayBuffer> {
  assertPositiveDimensions(width, height, phase)

  const expected = expectedRgbaLength(width, height)
  if (data.length !== expected) {
    throw new BackgroundRemovalError(
      'IMAGE_RGBA_LENGTH_MISMATCH',
      phase,
      `RGBA data length mismatch: got ${data.length}, expected ${expected} for ${width}x${height}.`
    )
  }

  const out = new Uint8ClampedArray(expected)
  out.set(data)
  return out
}

export function validateMaskLength(
  mask: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number
): void {
  const expected = expectedMaskLength(width, height)
  if (mask.length !== expected) {
    throw new BackgroundRemovalError(
      'MASK_DIMENSION_MISMATCH',
      'composite',
      `Mask length mismatch: got ${mask.length}, expected ${expected} for ${width}x${height}.`
    )
  }
}

export function validateCanvasRgbaLength(
  data: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const expected = expectedRgbaLength(width, height)
  if (data.length !== expected) {
    throw new BackgroundRemovalError(
      'CANVAS_RGBA_LENGTH_MISMATCH',
      'composite',
      `Canvas RGBA length mismatch: got ${data.length}, expected ${expected} for ${width}x${height}.`
    )
  }
}

export function serializeBackgroundRemovalError(
  err: unknown,
  fallbackCode: BackgroundRemovalErrorCode,
  fallbackPhase: BackgroundRemovalPhase
): SerializedBackgroundRemovalError {
  if (err instanceof BackgroundRemovalError) {
    return { code: err.code, phase: err.phase, message: err.message }
  }

  const message = err instanceof Error ? err.message : String(err)
  if (/ImageData/i.test(message) && /input data length|length/i.test(message)) {
    return {
      code: 'IMAGE_RGBA_LENGTH_MISMATCH',
      phase: 'composite',
      message,
    }
  }

  return {
    code: fallbackCode,
    phase: fallbackPhase,
    message: message || 'Background removal failed.',
  }
}
