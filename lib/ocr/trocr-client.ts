// TrOCR-based handwriting recognition via @huggingface/transformers.
// Model: Xenova/trocr-small-handwritten loaded with dtype:'fp32'.
//
// Why fp32: Xenova updated trocr model files on the hub to use MatMulNBits (4-bit quant).
// Those files are missing required scale tensors, causing ONNX Runtime to fail with
// "TransposeDQWeightsForMatMulNBits Missing required scale" on q8, fp16, and default dtype.
// dtype:'fp32' loads encoder_model.onnx + decoder_model_merged.onnx (no quantization nodes)
// which are unaffected. ~400MB one-time download, cached in IndexedDB after first load.

import { pipeline, env } from '@huggingface/transformers'

env.allowRemoteModels = true
env.useBrowserCache = true

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
  const instance = await pipeline('image-to-text', TROCR_SMALL, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dtype: 'fp32' as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progress_callback: (info: any) => {
      if (onProgress && typeof info?.progress === 'number') {
        onProgress(Math.round(info.progress))
      }
    },
  })
  console.log('[TrOCR] Loaded trocr-small (fp32)')
  return instance
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
