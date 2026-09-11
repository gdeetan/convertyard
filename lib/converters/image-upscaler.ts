import type { ConversionResult } from '@/lib/types'
import { loadUpscalerModel, upscaleImageFile, type UpscaleScale, type ImageMode } from './upscaler-engine'

export type { UpscaleScale, ImageMode }
export type UpscaleOutputFormat = 'match' | 'image/jpeg' | 'image/png' | 'image/webp'

interface UpscaleOptions {
  scale: UpscaleScale
  outputFormat: UpscaleOutputFormat
  imageMode: ImageMode
  photoEnhance?: boolean
  restoreFaces?: boolean
}

export async function upscaleBatch(
  files: File[],
  options: UpscaleOptions,
  onModelProgress: (pct: number) => void,
  onFileProgress: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void
): Promise<ConversionResult[]> {
  // Illustration and Graphic modes don't use the photo Real-ESRGAN/Swin2SR chain
  // — illustration loads its own still-art model lazily inside the worker, and
  // graphic is pure Lanczos. Skipping the photo preload here avoids a hard
  // failure when the photo chain can't initialize on the user's device.
  const skipPreload = options.imageMode === 'illustration' || options.imageMode === 'graphic'
  if (skipPreload) {
    onModelProgress(100)
    for (let i = 0; i < files.length; i++) onFileProgress(i, 15)
  } else {
    // Best-effort preload of the photo chain. If it fails (WebGPU flaky,
    // model download blocked, etc.), don't block the batch — auto-detected
    // illustration files still succeed via the still-art model, and photo files
    // will retry the load lazily inside runInference and surface a per-file
    // error there instead of failing the whole batch upfront.
    try {
      await loadUpscalerModel(options.scale, (pct) => {
        onModelProgress(pct)
        for (let i = 0; i < files.length; i++) {
          onFileProgress(i, Math.round(pct * 0.15))
        }
      })
    } catch (err) {
      console.warn('Upscaler preload failed; falling through to lazy load:', err)
      onModelProgress(100)
      for (let i = 0; i < files.length; i++) onFileProgress(i, 15)
    }
  }

  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    const outputFormat = options.outputFormat === 'match' ? null : options.outputFormat
    try {
      const result = await upscaleImageFile(
        files[i],
        options.scale,
        outputFormat,
        (pct) => onFileProgress(i, 15 + Math.round(pct * 0.85)),
        options.imageMode,
        options.photoEnhance ?? false,
        options.restoreFaces ?? false
      )
      results.push(result)
      onResult?.(i, result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      results.push(error)
      onResult?.(i, error)
    }
  }
  return results
}
