import type { AiSignature } from './exif-viewer.types'
import type { Verdict } from './ai-detector.types'
import { verdictFromProbability } from './ai-detector.types'

/** CommunityForensics ViT-S: resize shortest edge to 440, center-crop 384. */
export const CLASSIFIER_RESIZE = 440
export const CLASSIFIER_CROP = 384
/** @deprecated alias of CLASSIFIER_CROP */
export const CLASSIFIER_SIZE = CLASSIFIER_CROP

export const COMMUNITY_FORENSICS_ID = 'onnx-community/CommunityForensics-DeepfakeDet-ViT-ONNX'

export type ClassifierDevice = 'webgpu' | 'wasm'

/** WASM-only: WebGPU shader compile is 10–30s every visit. */
export function classifierLoadAttempts(): Array<{ dtype: 'q8'; device: ClassifierDevice }> {
  return [{ dtype: 'q8', device: 'wasm' }]
}

/** Florence-style keys: {model}/resolve/main/... */
export const DETECTOR_HF_PATH_TEMPLATE = '{model}/resolve/{revision}/'

export type DetectorLoadSource = {
  host: string | null
  modelId: string
  template: string
  dtype: 'q8' | 'fp32'
}

export function detectorLoadSources(r2Host: string): DetectorLoadSource[] {
  return [
    { host: r2Host, modelId: COMMUNITY_FORENSICS_ID, template: DETECTOR_HF_PATH_TEMPLATE, dtype: 'q8' },
    { host: r2Host, modelId: 'models/community-forensics', template: '{model}/', dtype: 'q8' },
    { host: null, modelId: COMMUNITY_FORENSICS_ID, template: DETECTOR_HF_PATH_TEMPLATE, dtype: 'q8' },
    { host: null, modelId: COMMUNITY_FORENSICS_ID, template: DETECTOR_HF_PATH_TEMPLATE, dtype: 'fp32' },
  ]
}

export function shortestEdgeSize(width: number, height: number, target: number): { w: number; h: number } {
  const short = Math.max(1, Math.min(width, height))
  const scale = target / short
  return {
    w: Math.max(1, Math.round(width * scale)),
    h: Math.max(1, Math.round(height * scale)),
  }
}

export function centerCropOrigin(width: number, height: number, crop: number): { sx: number; sy: number; side: number } {
  const side = Math.min(crop, width, height)
  return {
    sx: Math.max(0, Math.floor((width - side) / 2)),
    sy: Math.max(0, Math.floor((height - side) / 2)),
    side,
  }
}

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
  if (/decode|could not read|not a valid|unsupported input|source image/i.test(m)) {
    return 'Could not read this image. Try JPEG, PNG, or WebP.'
  }
  return m || 'Could not read this image'
}
