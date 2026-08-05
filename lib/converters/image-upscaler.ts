import { loadUpscalerModel, upscaleImageFile, type UpscaleScale, type ImageMode } from './upscaler-engine'

export type { UpscaleScale, ImageMode }
export type UpscaleOutputFormat = 'match' | 'image/jpeg' | 'image/png' | 'image/webp'

interface UpscaleOptions {
  scale: UpscaleScale
  outputFormat: UpscaleOutputFormat
  imageMode: ImageMode
}

export async function upscaleBatch(
  files: File[],
  options: UpscaleOptions,
  onModelProgress: (pct: number) => void,
  onFileProgress: (fileIndex: number, pct: number) => void
): Promise<(File | Error)[]> {
  // Map model loading (0–100%) to per-file bars at 0–15% so users see feedback
  // during the potentially long model download phase.
  await loadUpscalerModel(options.scale, (pct) => {
    onModelProgress(pct)
    for (let i = 0; i < files.length; i++) {
      onFileProgress(i, Math.round(pct * 0.15))
    }
  })

  const results: (File | Error)[] = []
  for (let i = 0; i < files.length; i++) {
    const outputFormat = options.outputFormat === 'match' ? null : options.outputFormat
    try {
      const result = await upscaleImageFile(
        files[i],
        options.scale,
        outputFormat,
        (pct) => onFileProgress(i, 15 + Math.round(pct * 0.85)),
        options.imageMode
      )
      results.push(result)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }
  return results
}
