import type { AiSignature } from './exif-viewer.types'
import type { Verdict } from './ai-detector.types'
import { verdictFromProbability } from './ai-detector.types'

/** Native input size of Organika/sdxl-detector (ViT feature extractor). */
export const CLASSIFIER_SIZE = 224

export type ClassifierDevice = 'webgpu' | 'wasm'

/** WASM-only: WebGPU shader compile for SwinV2 is 10–30s every visit. */
export function classifierLoadAttempts(): Array<{ dtype: 'q8'; device: ClassifierDevice }> {
  return [{ dtype: 'q8', device: 'wasm' }]
}

/** R2 objects live at models/sdxl-detector/config.json, not .../resolve/main/. */
export const DETECTOR_R2_PATH_TEMPLATE = '{model}/'

export type DetectorLoadSource = {
  host: string | null
  modelId: string
  template: string
  dtype: 'q8' | 'fp32'
}

export function detectorLoadSources(r2Host: string): DetectorLoadSource[] {
  return [
    { host: r2Host, modelId: 'models/sdxl-detector', template: DETECTOR_R2_PATH_TEMPLATE, dtype: 'q8' },
    { host: r2Host, modelId: 'models/sdxl-detector', template: '{model}/resolve/{revision}/', dtype: 'q8' },
    { host: null, modelId: 'Organika/sdxl-detector', template: '{model}/resolve/{revision}/', dtype: 'q8' },
    { host: null, modelId: 'Organika/sdxl-detector', template: '{model}/resolve/{revision}/', dtype: 'fp32' },
  ]
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
