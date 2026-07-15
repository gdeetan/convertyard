/// <reference lib="webworker" />

import {
  BackgroundRemovalError,
  normalizeRgbaData,
  serializeBackgroundRemovalError,
  validateCanvasRgbaLength,
  validateMaskLength,
} from './background-removal-errors'

// Runs entirely in a Web Worker — never imported server-side.
// Models are cached in browser IndexedDB/Cache Storage by transformers.js after first download.
//
// Background removal uses Xenova/modnet (MIT license, ~14 MB quantized).
// Alt text uses onnx-community/Florence-2-base-ft (~262 MB q8), self-hosted on
// Cloudflare R2 (pub-4e06a0715aae49b1975bbe46902137a3.r2.dev) to avoid HuggingFace
// auth/availability dependency. Florence-2 understands diverse product imagery and
// uses task tokens (<CAPTION>, <DETAILED_CAPTION>, <MORE_DETAILED_CAPTION>).
//
// HuggingFace now requires auth even for public Xenova models.
// HF_TOKEN is injected at build time by webpack DefinePlugin from the Cloudflare Pages
// environment variable. The token is read-only and only grants access to public models.

// Injected at build time — empty string when env var is not set
declare const __HF_TOKEN__: string

export type ModelType = 'bg-removal' | 'alt-text' | 'ocr'

interface LoadMsg { type: 'load'; modelType: ModelType }
interface InferMsg {
  type: 'infer'
  id: string
  modelType: ModelType
  buffer: ArrayBuffer
  mimeType: string
  opts: { maxTokens?: number; outputFormat?: string; contextHint?: string; filename?: string; prompt?: string }
}
type IncomingMsg = LoadMsg | InferMsg

// ── State ─────────────────────────────────────────────────────────────────────

let bgModel: unknown = null
let bgProcessor: unknown = null
let altModel: unknown = null
let altProcessor: unknown = null
// ── Aggregated download progress tracker ──────────────────────────────────────

function makeProgressCallback(modelType: ModelType) {
  const downloaded: Record<string, number> = {}
  const totals: Record<string, number> = {}

  return (info: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (info.status === 'progress' && info.file && info.loaded != null && info.total != null) {
      downloaded[info.file] = info.loaded
      totals[info.file] = info.total
      const totalDown = Object.values(downloaded).reduce((a, b) => a + b, 0)
      const totalExpected = Object.values(totals).reduce((a, b) => a + b, 0)
      const pct = totalExpected > 0 ? Math.round((totalDown / totalExpected) * 100) : 0
      self.postMessage({ type: 'model-progress', modelType, progress: pct })
    }
  }
}

// ── HuggingFace auth ──────────────────────────────────────────────────────────

let _authReady = false

async function ensureHfAuth() {
  if (_authReady) return
  _authReady = true
  if (!__HF_TOKEN__) return
  const { env } = await import('@huggingface/transformers')
  const _fetch = env.fetch
  env.fetch = (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const u = url instanceof Request ? url.url : url instanceof URL ? url.href : String(url)
    if (u.includes('huggingface.co') || u.includes('hf.co')) {
      const headers = new Headers((init?.headers ?? {}) as HeadersInit)
      headers.set('Authorization', `Bearer ${__HF_TOKEN__}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return _fetch(u as any, { ...init, headers })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return _fetch(url as any, init)
  }
}

// ── Model loaders ─────────────────────────────────────────────────────────────

async function loadBgModel() {
  if (bgModel && bgProcessor) return
  await ensureHfAuth()

  const { AutoModelForImageSegmentation, AutoImageProcessor } =
    await import('@huggingface/transformers')

  const cb = makeProgressCallback('bg-removal')

  bgProcessor = await AutoImageProcessor.from_pretrained('Xenova/modnet', {
    progress_callback: cb,
  })
  bgModel = await AutoModelForImageSegmentation.from_pretrained('Xenova/modnet', {
    dtype: 'q8',
    progress_callback: cb,
  })
}

async function loadAltModel(progressType: ModelType = 'alt-text') {
  if (altModel && altProcessor) return
  await ensureHfAuth()

  const { AutoModelForImageTextToText, AutoProcessor, env } = await import('@huggingface/transformers')
  const cb = makeProgressCallback(progressType)
  const MODEL_ID = 'onnx-community/Florence-2-base-ft'
  const R2_HOST = 'https://pub-4e06a0715aae49b1975bbe46902137a3.r2.dev/'

  async function tryLoad(useR2: boolean) {
    const prev = env.remoteHost
    if (useR2) env.remoteHost = R2_HOST
    try {
      altProcessor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback: cb })
      altModel = await AutoModelForImageTextToText.from_pretrained(MODEL_ID, { dtype: 'q8', progress_callback: cb })
    } finally {
      env.remoteHost = prev
    }
  }

  try {
    await tryLoad(true)   // R2 first (faster, no auth needed)
  } catch {
    await tryLoad(false)  // HF Hub fallback (uses __HF_TOKEN__)
  }
}

// ── Background-mask postprocessing ────────────────────────────────────────────

function clampByte(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : value
}

function normalizeMask(data: Uint8Array): Uint8ClampedArray {
  let min = 255
  let max = 0

  for (let i = 0; i < data.length; i++) {
    const v = data[i]
    if (v < min) min = v
    if (v > max) max = v
  }

  const out = new Uint8ClampedArray(data.length)
  if (max <= min) return out

  const scale = 255 / (max - min)
  for (let i = 0; i < data.length; i++) {
    out[i] = clampByte(Math.round((data[i] - min) * scale))
  }

  return out
}

function computeAdaptiveThreshold(alpha: Uint8ClampedArray): number {
  let sum = 0
  let strong = 0
  let strongest = 0

  for (let i = 0; i < alpha.length; i++) {
    const v = alpha[i]
    sum += v
    if (v >= 96) strong++
    if (v >= 160) strongest++
  }

  const mean = sum / Math.max(1, alpha.length)
  const strongRatio = strong / Math.max(1, alpha.length)
  const strongestRatio = strongest / Math.max(1, alpha.length)

  if (strongestRatio > 0.12) return 144
  if (strongRatio > 0.2) return 120
  if (mean > 110) return 112
  return 96
}

function buildBinaryMask(alpha: Uint8ClampedArray, threshold: number): Uint8Array {
  const binary = new Uint8Array(alpha.length)
  for (let i = 0; i < alpha.length; i++) {
    binary[i] = alpha[i] >= threshold ? 1 : 0
  }
  return binary
}

function dilate(mask: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(mask.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0
      for (let dy = -1; dy <= 1 && !value; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= height) continue
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= width) continue
          if (mask[ny * width + nx]) {
            value = 1
            break
          }
        }
      }
      out[y * width + x] = value
    }
  }
  return out
}

function erode(mask: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(mask.length)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 1
      for (let dy = -1; dy <= 1 && value; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= height) {
          value = 0
          break
        }
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= width || !mask[ny * width + nx]) {
            value = 0
            break
          }
        }
      }
      out[y * width + x] = value
    }
  }
  return out
}

function closeMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  return erode(dilate(mask, width, height), width, height)
}

function openMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  return dilate(erode(mask, width, height), width, height)
}

function keepPrimarySubject(mask: Uint8Array, width: number, height: number): Uint8Array {
  const visited = new Uint8Array(mask.length)
  const queue = new Int32Array(mask.length)
  const cx = (width - 1) / 2
  const cy = (height - 1) / 2
  const imageArea = width * height
  const minArea = Math.max(64, Math.floor(imageArea * 0.002))
  let bestPixels: number[] | null = null
  let bestScore = -Infinity

  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || visited[i]) continue
    let head = 0
    let tail = 0
    queue[tail++] = i
    visited[i] = 1

    const pixels: number[] = []
    let area = 0
    let sumX = 0
    let sumY = 0
    let touchesEdge = 0

    while (head < tail) {
      const idx = queue[head++]
      pixels.push(idx)
      area++
      const y = Math.floor(idx / width)
      const x = idx - y * width
      sumX += x
      sumY += y
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesEdge++

      if (x > 0) {
        const next = idx - 1
        if (mask[next] && !visited[next]) {
          visited[next] = 1
          queue[tail++] = next
        }
      }
      if (x + 1 < width) {
        const next = idx + 1
        if (mask[next] && !visited[next]) {
          visited[next] = 1
          queue[tail++] = next
        }
      }
      if (y > 0) {
        const next = idx - width
        if (mask[next] && !visited[next]) {
          visited[next] = 1
          queue[tail++] = next
        }
      }
      if (y + 1 < height) {
        const next = idx + width
        if (mask[next] && !visited[next]) {
          visited[next] = 1
          queue[tail++] = next
        }
      }
    }

    if (area < minArea) continue

    const centerX = sumX / area
    const centerY = sumY / area
    const normDx = width > 1 ? (centerX - cx) / width : 0
    const normDy = height > 1 ? (centerY - cy) / height : 0
    const centralityPenalty = Math.sqrt(normDx * normDx + normDy * normDy)
    const areaRatio = area / imageArea
    const edgePenalty = touchesEdge / area
    const score = areaRatio * 2.5 - centralityPenalty * 0.8 - edgePenalty * 0.7

    if (score > bestScore) {
      bestScore = score
      bestPixels = pixels
    }
  }

  if (!bestPixels) return mask

  const out = new Uint8Array(mask.length)
  for (let i = 0; i < bestPixels.length; i++) {
    out[bestPixels[i]] = 1
  }
  return out
}

function fillHoles(mask: Uint8Array, width: number, height: number): Uint8Array {
  const visited = new Uint8Array(mask.length)
  const queue = new Int32Array(mask.length)
  let head = 0
  let tail = 0

  const enqueue = (idx: number) => {
    if (!mask[idx] && !visited[idx]) {
      visited[idx] = 1
      queue[tail++] = idx
    }
  }

  for (let x = 0; x < width; x++) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    enqueue(y * width)
    enqueue(y * width + (width - 1))
  }

  while (head < tail) {
    const idx = queue[head++]
    const y = Math.floor(idx / width)
    const x = idx - y * width

    if (x > 0) enqueue(idx - 1)
    if (x + 1 < width) enqueue(idx + 1)
    if (y > 0) enqueue(idx - width)
    if (y + 1 < height) enqueue(idx + width)
  }

  const out = mask.slice()
  for (let i = 0; i < out.length; i++) {
    if (!out[i] && !visited[i]) out[i] = 1
  }
  return out
}

function blurAlpha(alpha: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  if (radius <= 0) return alpha

  const tmp = new Float32Array(alpha.length)
  const out = new Uint8ClampedArray(alpha.length)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      let count = 0
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx
        if (nx < 0 || nx >= width) continue
        sum += alpha[y * width + nx]
        count++
      }
      tmp[y * width + x] = sum / count
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      let count = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= height) continue
        sum += tmp[ny * width + x]
        count++
      }
      out[y * width + x] = clampByte(Math.round(sum / count))
    }
  }

  return out
}

function postprocessBackgroundMask(rawMask: Uint8Array, width: number, height: number): Uint8ClampedArray {
  const normalized = normalizeMask(rawMask)
  const threshold = computeAdaptiveThreshold(normalized)

  let binary = buildBinaryMask(normalized, threshold)
  binary = closeMask(binary, width, height)
  binary = openMask(binary, width, height)
  binary = keepPrimarySubject(binary, width, height)
  binary = fillHoles(binary, width, height)

  const subjectMatte = new Uint8ClampedArray(normalized.length)
  for (let i = 0; i < normalized.length; i++) {
    subjectMatte[i] = binary[i] ? normalized[i] : 0
  }

  const featherSource = new Uint8ClampedArray(binary.length)
  for (let i = 0; i < binary.length; i++) {
    featherSource[i] = binary[i] ? 255 : 0
  }

  const feather = blurAlpha(featherSource, width, height, 1)
  const out = new Uint8ClampedArray(subjectMatte.length)
  for (let i = 0; i < subjectMatte.length; i++) {
    out[i] = clampByte(Math.round((subjectMatte[i] * feather[i]) / 255))
  }

  return out
}

interface MaskStats {
  areaRatio: number
  bboxAreaRatio: number
  edgeTouchRatio: number
  meanForegroundAlpha: number
  maxAlpha: number
  bbox: { left: number; top: number; right: number; bottom: number } | null
}

function analyzeMask(alpha: Uint8ClampedArray, width: number, height: number): MaskStats {
  const threshold = 96
  const imageArea = width * height
  let count = 0
  let edgeTouches = 0
  let sumAlpha = 0
  let maxAlpha = 0
  let left = width
  let top = height
  let right = -1
  let bottom = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const v = alpha[idx]
      if (v > maxAlpha) maxAlpha = v
      if (v < threshold) continue

      count++
      sumAlpha += v
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) edgeTouches++
    }
  }

  if (count === 0 || right < left || bottom < top) {
    return {
      areaRatio: 0,
      bboxAreaRatio: 0,
      edgeTouchRatio: 0,
      meanForegroundAlpha: 0,
      maxAlpha,
      bbox: null,
    }
  }

  const bboxArea = (right - left + 1) * (bottom - top + 1)
  return {
    areaRatio: count / imageArea,
    bboxAreaRatio: bboxArea / imageArea,
    edgeTouchRatio: edgeTouches / count,
    meanForegroundAlpha: sumAlpha / count,
    maxAlpha,
    bbox: { left, top, right, bottom },
  }
}

function shouldRunBgRefinePass(stats: MaskStats): boolean {
  if (!stats.bbox) return true
  if (stats.maxAlpha < 180) return true
  if (stats.meanForegroundAlpha < 150) return true
  if (stats.areaRatio < 0.08) return true
  if (stats.bboxAreaRatio < 0.2) return true
  if (stats.edgeTouchRatio > 0.08) return true
  return false
}

interface CropRect {
  left: number
  top: number
  width: number
  height: number
}

function buildRefineCrop(stats: MaskStats, width: number, height: number): CropRect | null {
  if (!stats.bbox) return null

  const boxWidth = stats.bbox.right - stats.bbox.left + 1
  const boxHeight = stats.bbox.bottom - stats.bbox.top + 1
  const centerX = (stats.bbox.left + stats.bbox.right) / 2
  const centerY = (stats.bbox.top + stats.bbox.bottom) / 2
  const padFactor = 1.35
  const minSide = Math.max(Math.min(width, height) * 0.45, Math.max(boxWidth, boxHeight) * padFactor)
  const side = Math.min(Math.max(boxWidth, boxHeight, minSide), Math.max(width, height))

  let left = Math.round(centerX - side / 2)
  let top = Math.round(centerY - side / 2)
  let right = left + Math.round(side)
  let bottom = top + Math.round(side)

  if (left < 0) {
    right -= left
    left = 0
  }
  if (top < 0) {
    bottom -= top
    top = 0
  }
  if (right > width) {
    left -= right - width
    right = width
  }
  if (bottom > height) {
    top -= bottom - height
    bottom = height
  }

  left = Math.max(0, left)
  top = Math.max(0, top)
  right = Math.min(width, right)
  bottom = Math.min(height, bottom)

  const cropWidth = right - left
  const cropHeight = bottom - top
  if (cropWidth < 32 || cropHeight < 32) return null

  return { left, top, width: cropWidth, height: cropHeight }
}

type BgProcessor = (img: unknown) => Promise<{ pixel_values: unknown }>
type BgModel = (inputs: Record<string, unknown>) => Promise<Record<string, unknown>>
type MaskTensor = { mul: (n: number) => MaskTensor; to: (t: string) => MaskTensor; squeeze: (d: number) => MaskTensor; dims: number[] }

async function runBgSegmentationPass(
  image: unknown,
  outputWidth: number,
  outputHeight: number,
  processor: BgProcessor,
  model: BgModel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RawImage: any
): Promise<Uint8Array> {
  const { pixel_values } = await processor(image)
  const modelOutputs = await model({ input: pixel_values })
  const rawOutput = modelOutputs.output
  const maskRaw = (Array.isArray(rawOutput) ? rawOutput[0] : rawOutput) as MaskTensor
  const maskTensor = maskRaw.dims.length === 4 ? maskRaw.squeeze(0) : maskRaw
  const tensor = maskTensor.mul(255).to('uint8')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mask = await RawImage.fromTensor(tensor as any)
  const resizedMask = await mask.resize(outputWidth, outputHeight)
  return resizedMask.data as Uint8Array
}

async function createRawImageCrop(
  rgbaImage: { width: number; height: number; data: Uint8ClampedArray | Uint8Array },
  crop: CropRect,
  mimeType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RawImage: any
): Promise<unknown> {
  const canvas = new OffscreenCanvas(crop.width, crop.height)
  const ctx = canvas.getContext('2d')!

  const imgData = new ImageData(
    normalizeRgbaData(rgbaImage.data, rgbaImage.width, rgbaImage.height, 'preprocess'),
    rgbaImage.width,
    rgbaImage.height
  )
  ctx.putImageData(imgData, -crop.left, -crop.top)

  const blob = await canvas.convertToBlob({ type: mimeType })
  return RawImage.fromBlob(blob)
}

function projectCropMaskToFull(alpha: Uint8ClampedArray, crop: CropRect, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height)
  for (let y = 0; y < crop.height; y++) {
    const fullY = crop.top + y
    if (fullY < 0 || fullY >= height) continue
    for (let x = 0; x < crop.width; x++) {
      const fullX = crop.left + x
      if (fullX < 0 || fullX >= width) continue
      out[fullY * width + fullX] = alpha[y * crop.width + x]
    }
  }
  return out
}

function mergeRefinedMasks(base: Uint8ClampedArray, refined: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(base.length)
  for (let i = 0; i < base.length; i++) {
    const baseAlpha = base[i]
    const refinedAlpha = refined[i]
    out[i] = refinedAlpha > 0 ? Math.max(baseAlpha, refinedAlpha) : baseAlpha
  }
  return out
}

type BgRoute = 'portrait-photo' | 'general-photo' | 'flat-graphic'

function colorDistanceSq(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return dr * dr + dg * dg + db * db
}

function classifyBgRoute(rgba: { width: number; height: number; data: Uint8ClampedArray | Uint8Array }): BgRoute {
  const { width, height, data } = rgba
  const stepX = Math.max(1, Math.floor(width / 32))
  const stepY = Math.max(1, Math.floor(height / 32))
  const palette = new Set<number>()
  let samples = 0

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const idx = (y * width + x) * 4
      const r = data[idx] >> 4
      const g = data[idx + 1] >> 4
      const b = data[idx + 2] >> 4
      palette.add((r << 8) | (g << 4) | b)
      samples++
    }
  }

  const cornerSizeX = Math.max(1, Math.floor(width * 0.12))
  const cornerSizeY = Math.max(1, Math.floor(height * 0.12))
  const corners: Array<[number, number]> = [
    [0, 0],
    [width - cornerSizeX, 0],
    [0, height - cornerSizeY],
    [width - cornerSizeX, height - cornerSizeY],
  ]

  let sumR = 0
  let sumG = 0
  let sumB = 0
  let cornerSamples = 0
  for (const [startX, startY] of corners) {
    for (let y = Math.max(0, startY); y < Math.min(height, startY + cornerSizeY); y += Math.max(1, Math.floor(cornerSizeY / 8))) {
      for (let x = Math.max(0, startX); x < Math.min(width, startX + cornerSizeX); x += Math.max(1, Math.floor(cornerSizeX / 8))) {
        const idx = (y * width + x) * 4
        sumR += data[idx]
        sumG += data[idx + 1]
        sumB += data[idx + 2]
        cornerSamples++
      }
    }
  }

  const meanR = cornerSamples > 0 ? sumR / cornerSamples : 0
  const meanG = cornerSamples > 0 ? sumG / cornerSamples : 0
  const meanB = cornerSamples > 0 ? sumB / cornerSamples : 0
  let cornerVariance = 0
  let brightCorners = 0

  for (const [startX, startY] of corners) {
    for (let y = Math.max(0, startY); y < Math.min(height, startY + cornerSizeY); y += Math.max(1, Math.floor(cornerSizeY / 8))) {
      for (let x = Math.max(0, startX); x < Math.min(width, startX + cornerSizeX); x += Math.max(1, Math.floor(cornerSizeX / 8))) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        cornerVariance += colorDistanceSq(r, g, b, meanR, meanG, meanB)
        if (r + g + b > 680) brightCorners++
      }
    }
  }

  const avgCornerVariance = cornerSamples > 0 ? cornerVariance / cornerSamples : Infinity
  const paletteRatio = palette.size / Math.max(1, samples)
  const brightCornerRatio = brightCorners / Math.max(1, cornerSamples)

  if (palette.size <= 96 && paletteRatio < 0.42 && avgCornerVariance < 900 && brightCornerRatio > 0.35) {
    return 'flat-graphic'
  }
  if (palette.size <= 64 && avgCornerVariance < 1400) {
    return 'flat-graphic'
  }
  if (height >= width * 1.15) return 'portrait-photo'
  return 'general-photo'
}

function buildGraphicMask(rgba: { width: number; height: number; data: Uint8ClampedArray | Uint8Array }): Uint8ClampedArray {
  const { width, height, data } = rgba
  const totalPixels = width * height
  const visited = new Uint8Array(totalPixels)
  const background = new Uint8Array(totalPixels)
  const queue = new Int32Array(totalPixels)

  const corners = [
    0,
    width - 1,
    (height - 1) * width,
    height * width - 1,
  ]

  let seedR = 0
  let seedG = 0
  let seedB = 0
  for (const pixelIndex of corners) {
    const idx = pixelIndex * 4
    seedR += data[idx]
    seedG += data[idx + 1]
    seedB += data[idx + 2]
  }
  seedR /= corners.length
  seedG /= corners.length
  seedB /= corners.length

  let tolerance = 26 * 26 * 3
  let head = 0
  let tail = 0
  const enqueue = (pixelIndex: number) => {
    if (pixelIndex < 0 || pixelIndex >= totalPixels || visited[pixelIndex]) return
    const idx = pixelIndex * 4
    const dist = colorDistanceSq(data[idx], data[idx + 1], data[idx + 2], seedR, seedG, seedB)
    if (dist > tolerance) return
    visited[pixelIndex] = 1
    background[pixelIndex] = 1
    queue[tail++] = pixelIndex
  }

  corners.forEach(enqueue)
  while (head < tail) {
    const pixelIndex = queue[head++]
    const y = Math.floor(pixelIndex / width)
    const x = pixelIndex - y * width
    if (x > 0) enqueue(pixelIndex - 1)
    if (x + 1 < width) enqueue(pixelIndex + 1)
    if (y > 0) enqueue(pixelIndex - width)
    if (y + 1 < height) enqueue(pixelIndex + width)
  }

  let backgroundRatio = tail / Math.max(1, totalPixels)
  if (backgroundRatio < 0.08) {
    tolerance = 42 * 42 * 3
    visited.fill(0)
    background.fill(0)
    head = 0
    tail = 0
    corners.forEach(enqueue)
    while (head < tail) {
      const pixelIndex = queue[head++]
      const y = Math.floor(pixelIndex / width)
      const x = pixelIndex - y * width
      if (x > 0) enqueue(pixelIndex - 1)
      if (x + 1 < width) enqueue(pixelIndex + 1)
      if (y > 0) enqueue(pixelIndex - width)
      if (y + 1 < height) enqueue(pixelIndex + width)
    }
    backgroundRatio = tail / Math.max(1, totalPixels)
  }

  const alpha = new Uint8ClampedArray(totalPixels)
  for (let i = 0; i < totalPixels; i++) {
    alpha[i] = background[i] ? 0 : 255
  }

  let binary = buildBinaryMask(alpha, 200)
  binary = closeMask(binary, width, height)
  binary = openMask(binary, width, height)
  binary = keepPrimarySubject(binary, width, height)
  binary = fillHoles(binary, width, height)

  const cleaned = new Uint8ClampedArray(totalPixels)
  for (let i = 0; i < totalPixels; i++) {
    cleaned[i] = binary[i] ? 255 : 0
  }
  return blurAlpha(cleaned, width, height, 1)
}

// ── Inference: background removal ─────────────────────────────────────────────

async function runBgRemoval(
  id: string,
  buffer: ArrayBuffer,
  mimeType: string,
  outputFormat: string
) {
  const { RawImage } = await import('@huggingface/transformers')

  const blob = new Blob([buffer], { type: mimeType })
  let image: {
    width: number
    height: number
    rgba: () => { width: number; height: number; data: Uint8ClampedArray | Uint8Array }
  }
  try {
    image = await RawImage.fromBlob(blob)
  } catch (err) {
    throw new BackgroundRemovalError(
      'IMAGE_DECODE_FAILED',
      'decode',
      err instanceof Error ? err.message : 'Could not decode image.'
    )
  }

  self.postMessage({ type: 'infer-progress', id, progress: 10 })

  const rgbaImage = image.rgba()
  const rgbaData = normalizeRgbaData(rgbaImage.data, image.width, image.height, 'preprocess')
  const normalizedRgbaImage = { ...rgbaImage, data: rgbaData }
  const route = classifyBgRoute(normalizedRgbaImage)

  // Preprocess
  const processor = bgProcessor as BgProcessor
  const model = bgModel as BgModel

  let refinedMask: Uint8ClampedArray
  if (route === 'flat-graphic') {
    self.postMessage({ type: 'infer-progress', id, progress: 30 })
    refinedMask = buildGraphicMask(normalizedRgbaImage)
    self.postMessage({ type: 'infer-progress', id, progress: 70 })
  } else {
    const firstPassRaw = await runBgSegmentationPass(
      image,
      image.width,
      image.height,
      processor,
      model,
      RawImage
    )
    self.postMessage({ type: 'infer-progress', id, progress: 30 })
    self.postMessage({ type: 'infer-progress', id, progress: 70 })
    refinedMask = postprocessBackgroundMask(firstPassRaw, image.width, image.height)
    const maskStats = analyzeMask(refinedMask, image.width, image.height)

    if (route === 'general-photo' || shouldRunBgRefinePass(maskStats)) {
      const refineCrop = buildRefineCrop(maskStats, image.width, image.height)
      if (refineCrop) {
        const croppedImage = await createRawImageCrop(normalizedRgbaImage, refineCrop, mimeType, RawImage)
        const cropPassRaw = await runBgSegmentationPass(
          croppedImage,
          refineCrop.width,
          refineCrop.height,
          processor,
          model,
          RawImage
        )
        const cropRefined = postprocessBackgroundMask(cropPassRaw, refineCrop.width, refineCrop.height)
        const projected = projectCropMaskToFull(cropRefined, refineCrop, image.width, image.height)
        refinedMask = mergeRefinedMasks(refinedMask, projected)
      }
    }
  }

  self.postMessage({ type: 'infer-progress', id, progress: 85 })

  // Composite: original image + mask as alpha
  const canvas = new OffscreenCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')!

  validateMaskLength(refinedMask, image.width, image.height)
  const imgData = new ImageData(
    normalizeRgbaData(normalizedRgbaImage.data, image.width, image.height, 'composite'),
    image.width,
    image.height
  )
  ctx.putImageData(imgData, 0, 0)

  const composited = ctx.getImageData(0, 0, image.width, image.height)
  validateCanvasRgbaLength(composited.data, image.width, image.height)
  for (let i = 0; i < refinedMask.length; i++) {
    composited.data[4 * i + 3] = refinedMask[i]
  }
  ctx.putImageData(composited, 0, 0)

  const outMime = outputFormat === 'webp' ? 'image/webp' : 'image/png'
  let resultBlob: Blob
  try {
    resultBlob = await canvas.convertToBlob({ type: outMime })
  } catch (err) {
    throw new BackgroundRemovalError(
      'CANVAS_EXPORT_FAILED',
      'export',
      err instanceof Error ? err.message : 'Could not export transparent image.'
    )
  }
  const resultBuffer = await resultBlob.arrayBuffer()

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage({ type: 'infer-result', id, result: resultBuffer, outputMime: outMime }, [
    resultBuffer,
  ])
}

// ── Filename parser ───────────────────────────────────────────────────────────

// Returns a natural-language phrase from a filename for use as a Florence-2 context hint,
// or empty string if the filename is generic (IMG_20240101, DSC_0001, etc.)
function parseFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '')
  const words = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()

  // Skip generic camera/device filenames
  if (/^(img|dsc|dcim|photo|image|screenshot|picture|clip|video|mov|file|document|scan|copy)\b/.test(words) && /\d{4,}/.test(words)) return ''
  if (/^\d+$/.test(words.replace(/\s/g, ''))) return ''
  if (words.length < 4) return ''

  // Smart casing: product codes with digits go uppercase (v15 → V15),
  // small connector words stay lowercase, everything else gets title-cased
  const SMALL = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with'])
  const titled = words.split(' ').map((w, i) => {
    if (i > 0 && SMALL.has(w)) return w
    if (/\d/.test(w)) return w.toUpperCase()
    return w.charAt(0).toUpperCase() + w.slice(1)
  }).join(' ')

  return `a photo of the ${titled}`
}

// ── Inference: alt text ───────────────────────────────────────────────────────

async function runAltText(
  id: string, buffer: ArrayBuffer, mimeType: string,
  maxTokens: number, contextHint?: string, filename?: string
) {
  const { RawImage } = await import('@huggingface/transformers')

  const blob = new Blob([buffer], { type: mimeType })
  const image = await RawImage.fromBlob(blob)

  self.postMessage({ type: 'infer-progress', id, progress: 20 })

  // Map length preset to Florence-2 task tokens
  const taskToken = maxTokens <= 25 ? '<CAPTION>'
    : maxTokens <= 50 ? '<DETAILED_CAPTION>'
    : '<MORE_DETAILED_CAPTION>'

  // Compute hint for post-processing use (prepend/fallback after generation).
  // Florence-2 task tokens must be bare — never append text to the task prompt.
  const filenameHint = filename ? parseFilename(filename) : ''
  const hint = contextHint?.trim() || filenameHint
  const taskPrompt = taskToken

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processor = altProcessor as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = altModel as any

  // Florence-2: processor encodes image + task prompt → model.generate → processor decodes
  const inputs = await processor(image, taskPrompt)

  self.postMessage({ type: 'infer-progress', id, progress: 50 })

  const generatedIds = await model.generate({
    ...inputs,
    max_new_tokens: maxTokens,
  })

  // skip_special_tokens: false preserves task tokens so post_process_generation can strip them.
  const decoded: string[] = processor.batch_decode(generatedIds, { skip_special_tokens: false })
  const raw = decoded[0] ?? ''

  // Layer 1: Florence-2's canonical task token stripper.
  let text = ''
  try {
    const parsed = processor.post_process_generation(raw, taskToken, [image.height, image.width])
    if (typeof parsed === 'object' && parsed !== null && taskToken in parsed) {
      text = String(parsed[taskToken as keyof typeof parsed]).trim()
    }
  } catch {
    // post_process_generation unavailable; fall through to regex
  }

  // Layer 2: regex fallback for when ppg returns empty or throws.
  if (!text) {
    const taskTokenBare = taskToken.replace(/^<|>$/g, '')
    const gtIdx = raw.indexOf('>')
    const slice = gtIdx >= 0 ? raw.slice(gtIdx + 1) : raw
    text = slice
      .replace(/<[^>]*>/g, '')
      .replaceAll(taskTokenBare, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Apply context hint: prepend if not already referenced, or use as fallback if AI returned nothing.
  const hintSubject = hint.replace(/^a photo of the /i, '').toLowerCase()
  if (hint && text && !text.toLowerCase().includes(hintSubject)) {
    text = `${hint} — ${text}`
  }
  if (!text && hint) {
    text = hint
  }

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage({ type: 'infer-result', id, result: text })
}

// ── Inference: handwriting OCR (Florence-2 <OCR_WITH_REGION>) ────────────────
//
// Uses the same Florence-2 model as alt-text but with the OCR task token.
// Returns JSON: { quad_boxes: number[][], labels: string[] }
// The caller sorts regions by Y coordinate to reconstruct reading order.

async function runOcr(id: string, buffer: ArrayBuffer, mimeType: string) {
  const { RawImage } = await import('@huggingface/transformers')

  const blob = new Blob([buffer], { type: mimeType })
  const image = await RawImage.fromBlob(blob)

  self.postMessage({ type: 'infer-progress', id, progress: 20 })

  const taskToken = '<OCR_WITH_REGION>'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processor = altProcessor as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = altModel as any

  const inputs = await processor(image, taskToken)
  self.postMessage({ type: 'infer-progress', id, progress: 50 })

  const generatedIds = await model.generate({ ...inputs, max_new_tokens: 1024 })
  const decoded: string[] = processor.batch_decode(generatedIds, { skip_special_tokens: false })
  const raw = decoded[0] ?? ''

  self.postMessage({ type: 'infer-progress', id, progress: 80 })

  let result = ''
  try {
    const parsed = processor.post_process_generation(raw, taskToken, [image.height, image.width])
    const regions = parsed?.[taskToken]
    if (regions && Array.isArray(regions.labels) && regions.labels.length > 0) {
      result = JSON.stringify({ quad_boxes: regions.quad_boxes ?? [], labels: regions.labels })
    }
  } catch {
    // post_process_generation failed — try plain <OCR> as fallback
  }

  // Fallback: if OCR_WITH_REGION produced nothing, try plain OCR
  if (!result) {
    try {
      const ocrToken = '<OCR>'
      const inputs2 = await processor(image, ocrToken)
      const ids2 = await model.generate({ ...inputs2, max_new_tokens: 512 })
      const dec2: string[] = processor.batch_decode(ids2, { skip_special_tokens: false })
      const parsed2 = processor.post_process_generation(dec2[0] ?? '', ocrToken, [image.height, image.width])
      const ocrText = String(parsed2?.[ocrToken] ?? '').trim()
      if (ocrText) result = JSON.stringify({ quad_boxes: [], labels: [ocrText] })
    } catch {
      // both failed — return empty
    }
  }

  self.postMessage({ type: 'infer-progress', id, progress: 100 })
  self.postMessage({ type: 'infer-result', id, result })
}

// ── Message router ────────────────────────────────────────────────────────────

self.addEventListener('message', async (e: MessageEvent<IncomingMsg>) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      if (msg.modelType === 'bg-removal') await loadBgModel()
      else if (msg.modelType === 'alt-text') await loadAltModel('alt-text')
      else if (msg.modelType === 'ocr') await loadAltModel('ocr')  // same Florence-2 model
      self.postMessage({ type: 'model-ready', modelType: msg.modelType })
    } catch (err) {
      if (msg.modelType === 'bg-removal') {
        const error = serializeBackgroundRemovalError(err, 'MODEL_LOAD_FAILED', 'load')
        self.postMessage({ type: 'error', message: error.message, code: error.code, phase: error.phase })
      } else {
        const code = (err as { code?: string }).code
        self.postMessage({ type: 'error', message: (err as Error).message, ...(code ? { code } : {}) })
      }
    }
    return
  }

  if (msg.type === 'infer') {
    const { id, modelType, buffer, mimeType, opts } = msg
    try {
      if (modelType === 'bg-removal') {
        await runBgRemoval(id, buffer, mimeType, opts.outputFormat ?? 'png')
      } else if (modelType === 'alt-text') {
        await runAltText(id, buffer, mimeType, opts.maxTokens ?? 50, opts.contextHint, opts.filename)
      } else if (modelType === 'ocr') {
        await runOcr(id, buffer, mimeType)
      }
    } catch (err) {
      if (modelType === 'bg-removal') {
        const error = serializeBackgroundRemovalError(err, 'MODEL_INFERENCE_FAILED', 'inference')
        self.postMessage({
          type: 'error',
          id,
          message: error.message,
          code: error.code,
          phase: error.phase,
        })
      } else {
        self.postMessage({ type: 'error', id, message: (err as Error).message })
      }
    }
  }
})
