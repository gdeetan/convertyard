import type { AiSignature } from './exif-viewer.types'
import type { Verdict } from './ai-detector.types'
import { verdictFromProbability } from './ai-detector.types'

/** Native input size of Organika/sdxl-detector (ViT feature extractor). */
export const CLASSIFIER_SIZE = 224

export type ClassifierDevice = 'webgpu' | 'wasm'

export function classifierLoadAttempts(
  webgpu: boolean,
): Array<{ dtype: 'q8'; device: ClassifierDevice }> {
  if (webgpu) {
    return [
      { dtype: 'q8', device: 'webgpu' },
      { dtype: 'q8', device: 'wasm' },
    ]
  }
  return [{ dtype: 'q8', device: 'wasm' }]
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
