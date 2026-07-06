// TrOCR-based handwriting recognition via @huggingface/transformers.
// Model cascade: trocr-base q8 → trocr-base fp16 → trocr-small q8
// trocr-base uses 4-bit NBits quantization incompatible with transformers.js 4.2.x,
// so we try q8 and fp16 ONNX exports first, then fall back to trocr-small.
// Whichever variant loads is cached in IndexedDB after first download.

import { pipeline, env } from '@huggingface/transformers'

env.allowRemoteModels = true
env.useBrowserCache = true

const TROCR_BASE = 'Xenova/trocr-base-handwritten'
const TROCR_SMALL = 'Xenova/trocr-small-handwritten'

type ImageToTextPipeline = Awaited<ReturnType<typeof pipeline<'image-to-text'>>>
let pipelineInstance: ImageToTextPipeline | null = null

export interface TrOcrLineResult {
  text: string
  confidence: number
}

export async function getTrOcrPipeline(
  onProgress?: (pct: number) => void
): Promise<ImageToTextPipeline> {
  if (pipelineInstance) return pipelineInstance

  const attempts = [
    { model: TROCR_BASE, dtype: 'q8' },
    { model: TROCR_BASE, dtype: 'fp16' },
    { model: TROCR_SMALL, dtype: 'q8' },
  ]

  for (const { model, dtype } of attempts) {
    try {
      pipelineInstance = await pipeline('image-to-text', model, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dtype: dtype as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (info: any) => {
          if (onProgress && typeof info?.progress === 'number') {
            onProgress(Math.round(info.progress))
          }
        },
      })
      console.log(`[TrOCR] Loaded ${model} (${dtype})`)
      return pipelineInstance
    } catch (e) {
      console.warn(`[TrOCR] Failed ${model} (${dtype}):`, e)
      pipelineInstance = null
    }
  }

  throw new Error('TrOCR: all model variants failed to load')
}

export async function recognizeLineWithTrOCR(
  lineBlob: Blob,
  pipe: ImageToTextPipeline,
  quality = true
): Promise<TrOcrLineResult> {
  const url = URL.createObjectURL(lineBlob)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (pipe as any)(url, {
      num_beams: quality ? 4 : 1,
      max_new_tokens: 128,
    })
    const output = Array.isArray(result) ? result[0] : result
    const text = (output as { generated_text?: string }).generated_text?.trim() ?? ''
    // Length-based confidence proxy — TrOCR pipeline does not expose beam-search scores.
    const confidence = text.length >= 3 ? 0.9 : text.length > 0 ? 0.5 : 0.0
    return { text, confidence }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function recognizeWithTrOCR(
  lineBlobs: Blob[],
  onProgress?: (pct: number) => void,
  quality = true
): Promise<{ text: string; lines: TrOcrLineResult[] }> {
  const pipe = await getTrOcrPipeline(p => onProgress?.(Math.round(p * 0.5)))
  const lines: TrOcrLineResult[] = []
  for (let i = 0; i < lineBlobs.length; i++) {
    lines.push(await recognizeLineWithTrOCR(lineBlobs[i], pipe, quality))
    onProgress?.(50 + Math.round(((i + 1) / lineBlobs.length) * 50))
  }
  return {
    text: lines.map(l => l.text).join('\n'),
    lines,
  }
}
