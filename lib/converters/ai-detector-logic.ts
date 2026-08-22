import type { AiSignature } from './exif-viewer.types'
import type { Verdict } from './ai-detector.types'
import { verdictFromProbability } from './ai-detector.types'

/** ViT-S/16 @384: resize shortest edge to 440, center-crop 384. */
export const CLASSIFIER_RESIZE = 440
export const CLASSIFIER_CROP = 384
/** @deprecated alias of CLASSIFIER_CROP */
export const CLASSIFIER_SIZE = CLASSIFIER_CROP

/** R2 key for the OpenFake-era re-fit Community Forensics ONNX (fp32, ~87 MB). */
export const DETECTOR_ONNX_KEY = 'models/commfor-vits-384-refit/onnx/model.onnx'
export const DETECTOR_GITHUB_ONNX =
  'https://raw.githubusercontent.com/pixilated730/local-ai-image-detector/main/extension/models/detector.onnx'

export type ClassifierDevice = 'webgpu' | 'wasm'

/** WASM-only: WebGPU shader compile is 10–30s every visit. fp32 — q8 collapsed on this head. */
export function classifierLoadAttempts(): Array<{ dtype: 'fp32'; device: ClassifierDevice }> {
  return [{ dtype: 'fp32', device: 'wasm' }]
}

export function detectorOnnxUrls(r2Host: string): string[] {
  const base = r2Host.endsWith('/') ? r2Host : `${r2Host}/`
  return [`${base}${DETECTOR_ONNX_KEY}`, DETECTOR_GITHUB_ONNX]
}

export function shortestEdgeSize(width: number, height: number, target: number): { w: number; h: number } {
  const short = Math.max(1, Math.min(width, height))
  const scale = target / short
  return {
    w: Math.max(1, Math.round(width * scale)),
    h: Math.max(1, Math.round(height * scale)),
  }
}

export type CropOrigin = { sx: number; sy: number; side: number }

export function centerCropOrigin(width: number, height: number, crop: number): CropOrigin {
  const side = Math.min(crop, width, height)
  return {
    sx: Math.max(0, Math.floor((width - side) / 2)),
    sy: Math.max(0, Math.floor((height - side) / 2)),
    side,
  }
}

/** Center + four corners. Collapses to one crop when the image is already `crop` on both sides. */
export function fiveCropOrigins(width: number, height: number, crop: number): CropOrigin[] {
  const side = Math.min(crop, width, height)
  const maxX = Math.max(0, width - side)
  const maxY = Math.max(0, height - side)
  const all: CropOrigin[] = [
    { sx: Math.floor(maxX / 2), sy: Math.floor(maxY / 2), side },
    { sx: 0, sy: 0, side },
    { sx: maxX, sy: 0, side },
    { sx: 0, sy: maxY, side },
    { sx: maxX, sy: maxY, side },
  ]
  const seen = new Set<string>()
  return all.filter(c => {
    const k = `${c.sx},${c.sy}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Shifts the re-fit head's BA operating point to the 0.65 threshold (baked in JS, not ONNX). */
export const DETECTOR_LOGIT_OFFSET = 1.67

export function aiScoreFromLogitList(logits: number[]): number {
  return sigmoid(mean(logits) + DETECTOR_LOGIT_OFFSET)
}

export function cropHwc(
  data: ArrayLike<number>,
  width: number,
  height: number,
  channels: number,
  crop: CropOrigin,
): Uint8Array {
  const { sx, sy, side } = crop
  const out = new Uint8Array(side * side * channels)
  for (let y = 0; y < side; y++) {
    const src = ((sy + y) * width + sx) * channels
    const dst = y * side * channels
    for (let i = 0; i < side * channels; i++) out[dst + i] = Number(data[src + i])
  }
  return out
}

export const DETECTOR_R2_HOST = 'https://pub-4e06a0715aae49b1975bbe46902137a3.r2.dev/'

export function detectorOnnxUrl(host: string = DETECTOR_R2_HOST): string {
  const base = host.endsWith('/') ? host : `${host}/`
  return `${base}${DETECTOR_ONNX_KEY}`
}

/** @deprecated alias — preload still calls this name in older tests. */
export const detectorQuantizedOnnxUrl = detectorOnnxUrl

export function sigmoid(z: number): number {
  if (z > 20) return 1
  if (z < -20) return 0
  return 1 / (1 + Math.exp(-z))
}

/** CommunityForensics emits one fake-logit. Two-class softmax still supported. */
export function aiScoreFromLogits(data: ArrayLike<number>): number {
  if (data.length <= 1) return sigmoid(Number(data[0] ?? 0))
  const a = Number(data[0])
  const b = Number(data[1])
  const max = Math.max(a, b)
  const ea = Math.exp(a - max)
  const eb = Math.exp(b - max)
  return ea / (ea + eb)
}

/** ImageNet mean-std used by the re-fit ViT-S head (not CLIP). */
export const IMAGENET_MEAN = [0.485, 0.456, 0.406]
export const IMAGENET_STD = [0.229, 0.224, 0.225]
/** @deprecated CLIP stats from the stock CommunityForensics preprocessor. */
export const FORENSICS_MEAN = IMAGENET_MEAN
export const FORENSICS_STD = IMAGENET_STD

/** Pack HWC uint8 RGB(A) into NCHW float32, ImageNet-normalized. */
export function rgbToNchwFloat32(
  data: ArrayLike<number>,
  width: number,
  height: number,
  channels: number,
  mean: number[] = IMAGENET_MEAN,
  std: number[] = IMAGENET_STD,
): Float32Array {
  const plane = width * height
  const out = new Float32Array(3 * plane)
  const step = channels >= 3 ? channels : 3
  for (let i = 0; i < plane; i++) {
    const o = i * step
    out[i] = (Number(data[o]) / 255 - mean[0]) / std[0]
    out[plane + i] = (Number(data[o + 1]) / 255 - mean[1]) / std[1]
    out[2 * plane + i] = (Number(data[o + 2]) / 255 - mean[2]) / std[2]
  }
  return out
}

/** iOS Safari hangs on WASM session create if numThreads > 1. Phones also OOM. */
export function detectorWasmThreads(
  profile: 'desktop' | 'android' | 'ios',
  hasSharedArrayBuffer: boolean,
  cores: number,
): number {
  if (profile !== 'desktop' || !hasSharedArrayBuffer) return 1
  return Math.max(1, Math.min(8, Math.floor(cores / 2)))
}

const AI_LABELS = new Set(['artificial', 'ai', 'ai-generated', 'fake', 'sd', 'sdxl', 'generated', 'lab_1'])

export function pickAiScore(preds: Array<{ label: string; score: number }>): number {
  for (const p of preds) {
    if (AI_LABELS.has(p.label.toLowerCase())) return p.score
  }
  const top = preds[0]
  if (top && /ai|artif|fake|generat|sd/i.test(top.label)) return top.score
  return 1 - (top?.score ?? 0.5)
}

/** Generator tags (ComfyUI, SD, Midjourney, …) are a positive AI signal. C2PA alone is not. */
export function metadataImpliesAi(sigs: AiSignature[]): boolean {
  return sigs.some(s => s.generator !== 'c2pa-only')
}

export function combineVerdict(sigs: AiSignature[], aiScore: number): Verdict {
  if (metadataImpliesAi(sigs)) return 'likely-ai'
  return verdictFromProbability(aiScore)
}

export function pendingVerdict(sigs: AiSignature[]): Verdict {
  return metadataImpliesAi(sigs) ? 'likely-ai' : 'inconclusive'
}

export function rgbaToRgb(rgba: ArrayLike<number>, width: number, height: number): Uint8Array {
  const rgb = new Uint8Array(width * height * 3)
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i]
    rgb[j + 1] = rgba[i + 1]
    rgb[j + 2] = rgba[i + 2]
  }
  return rgb
}

/** ISO-BMFF HEIC/HEIF brands in the first 12 bytes (`ftyp` + brand). */
export function looksLikeHeicHeader(header: ArrayBuffer | Uint8Array): boolean {
  const u8 = header instanceof Uint8Array ? header : new Uint8Array(header)
  if (u8.byteLength < 12) return false
  const tag = String.fromCharCode(u8[4], u8[5], u8[6], u8[7])
  if (tag !== 'ftyp') return false
  const brand = String.fromCharCode(u8[8], u8[9], u8[10], u8[11]).toLowerCase()
  return brand === 'heic' || brand === 'heix' || brand === 'heif' || brand === 'mif1' || brand === 'msf1'
}

export function friendlyImageError(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err)
  if (/memory|out of memory|oom|allocation|Maximum call/i.test(m)) {
    return 'This device ran out of memory loading the classifier. Close other tabs, or try on a computer.'
  }
  if (/OrtRun|broadcast|element_wise_ops/i.test(m)) {
    return 'Classifier hit a size mismatch. Try again, or use a JPEG/PNG export.'
  }
  if (/decode|could not read|not a valid|unsupported input|source image/i.test(m)) {
    return 'Could not read this image. Try JPEG, PNG, or WebP.'
  }
  return m || 'Could not read this image'
}
