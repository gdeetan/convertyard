// TrOCR-based handwriting recognition via @huggingface/transformers.
// Model: Xenova/trocr-base-handwritten (quantized ONNX q8, ~80MB, cached in IndexedDB after first download)
// Processes one line-image at a time; caller must supply pre-cropped line blobs.

import { pipeline, env } from '@huggingface/transformers'

env.allowRemoteModels = true
env.useBrowserCache = true

const MODEL_ID = 'Xenova/trocr-base-handwritten'

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

  try {
    pipelineInstance = await pipeline('image-to-text', MODEL_ID, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      progress_callback: (info: any) => {
        if (onProgress && typeof info?.progress === 'number') {
          onProgress(Math.round(info.progress))
        }
      },
    })
  } catch (e) {
    pipelineInstance = null
    throw e
  }
  return pipelineInstance
}

export async function recognizeLineWithTrOCR(
  lineBlob: Blob,
  pipe: ImageToTextPipeline
): Promise<TrOcrLineResult> {
  const url = URL.createObjectURL(lineBlob)
  try {
    const result = await pipe(url)
    const output = Array.isArray(result) ? result[0] : result
    const text = (output as { generated_text?: string }).generated_text?.trim() ?? ''
    // Length-based confidence proxy — TrOCR pipeline does not expose beam-search scores.
    // Not a true probability: "aaa" gets 0.9. Use only for flagging likely misses (empty/very short).
    const confidence = text.length >= 3 ? 0.9 : text.length > 0 ? 0.5 : 0.0
    return { text, confidence }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function recognizeWithTrOCR(
  lineBlobs: Blob[],
  onProgress?: (pct: number) => void
): Promise<{ text: string; lines: TrOcrLineResult[] }> {
  const pipe = await getTrOcrPipeline(p => onProgress?.(Math.round(p * 0.5)))
  const lines: TrOcrLineResult[] = []
  for (let i = 0; i < lineBlobs.length; i++) {
    lines.push(await recognizeLineWithTrOCR(lineBlobs[i], pipe))
    onProgress?.(50 + Math.round(((i + 1) / lineBlobs.length) * 50))
  }
  return {
    text: lines.map(l => l.text).join('\n'),
    lines,
  }
}
