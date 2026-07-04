// TrOCR-based handwriting recognition via @huggingface/transformers.
// Model: Xenova/trocr-small-handwritten (~77MB, cached in IndexedDB after first download)
// Processes one line-image at a time; caller must supply pre-cropped line blobs.

import { pipeline, env } from '@huggingface/transformers'

// Keep transformers models in the browser cache only (no remote model fetch once cached)
env.allowRemoteModels = true
env.useBrowserCache = true

const MODEL_ID = 'Xenova/trocr-small-handwritten'

type ImageToTextPipeline = Awaited<ReturnType<typeof pipeline<'image-to-text'>>>
let pipelineInstance: ImageToTextPipeline | null = null

export async function getTrOcrPipeline(
  onProgress?: (pct: number) => void
): Promise<ImageToTextPipeline> {
  if (pipelineInstance) return pipelineInstance

  pipelineInstance = await pipeline('image-to-text', MODEL_ID, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progress_callback: (info: any) => {
      if (onProgress && typeof info?.progress === 'number') {
        onProgress(Math.round(info.progress))
      }
    },
  })
  return pipelineInstance
}

export async function recognizeLineWithTrOCR(
  lineBlob: Blob,
  pipe: ImageToTextPipeline
): Promise<string> {
  const url = URL.createObjectURL(lineBlob)
  try {
    const result = await pipe(url)
    const output = Array.isArray(result) ? result[0] : result
    return (output as { generated_text?: string }).generated_text?.trim() ?? ''
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function recognizeWithTrOCR(
  lineBlobs: Blob[],
  onProgress?: (pct: number) => void
): Promise<string> {
  const pipe = await getTrOcrPipeline(p => onProgress?.(Math.round(p * 0.5)))
  const lines: string[] = []
  for (let i = 0; i < lineBlobs.length; i++) {
    lines.push(await recognizeLineWithTrOCR(lineBlobs[i], pipe))
    onProgress?.(50 + Math.round(((i + 1) / lineBlobs.length) * 50))
  }
  return lines.join('\n')
}
