// TrOCR-based handwriting recognition via @huggingface/transformers.
// Model cascade: trocr-base q8 → trocr-base fp16 → trocr-small (default dtype)
// trocr-base uses NBits quantization incompatible with transformers.js 4.2.x ONNX Runtime.
// trocr-small fallback omits dtype so the library picks a compatible format (as it did originally).
// Whichever variant loads is cached in IndexedDB after first download.

import { pipeline, env } from '@huggingface/transformers'

env.allowRemoteModels = true
env.useBrowserCache = true

const TROCR_BASE = 'Xenova/trocr-base-handwritten'
const TROCR_SMALL = 'Xenova/trocr-small-handwritten'

type ImageToTextPipeline = Awaited<ReturnType<typeof pipeline<'image-to-text'>>>
let pipelinePromise: Promise<ImageToTextPipeline> | null = null

export interface TrOcrLineResult {
  text: string
  confidence: number
}

async function loadPipeline(
  onProgress?: (pct: number) => void
): Promise<ImageToTextPipeline> {
  const attempts: Array<{ model: string; dtype?: string }> = [
    { model: TROCR_BASE, dtype: 'q8' },
    { model: TROCR_BASE, dtype: 'fp16' },
    { model: TROCR_SMALL },  // no dtype — use library default (same as original working code)
  ]
  const errors: unknown[] = []

  for (const { model, dtype } of attempts) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: Record<string, any> = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        progress_callback: (info: any) => {
          if (onProgress && typeof info?.progress === 'number') {
            onProgress(Math.round(info.progress))
          }
        },
      }
      if (dtype) opts.dtype = dtype
      const instance = await pipeline('image-to-text', model, opts)
      console.log(`[TrOCR] Loaded ${model}${dtype ? ` (${dtype})` : ' (default)'}`)
      return instance
    } catch (e) {
      console.warn(`[TrOCR] Failed ${model}${dtype ? ` (${dtype})` : ' (default)'}:`, e)
      errors.push(e)
    }
  }

  throw new Error(
    `TrOCR: all model variants failed.\n` +
    errors.map((e, i) => `  [${attempts[i].model} ${attempts[i].dtype ?? 'default'}]: ${e}`).join('\n')
  )
}

export async function getTrOcrPipeline(
  onProgress?: (pct: number) => void
): Promise<ImageToTextPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = loadPipeline(onProgress).catch(e => {
      pipelinePromise = null  // allow retry on next call after failure
      throw e
    })
  }
  return pipelinePromise
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
