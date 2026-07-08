import { loadUpscalerModel, upscaleImageFile, type UpscaleScale } from './upscaler-engine'

export type { UpscaleScale }
export type UpscaleOutputFormat = 'match' | 'image/jpeg' | 'image/png' | 'image/webp'

interface UpscaleOptions {
  scale: UpscaleScale
  outputFormat: UpscaleOutputFormat
}

export async function upscaleBatch(
  files: File[],
  options: UpscaleOptions,
  onModelProgress: (pct: number) => void,
  onFileProgress: (fileIndex: number, pct: number) => void
): Promise<(File | Error)[]> {
  await loadUpscalerModel(options.scale, onModelProgress)

  const results: (File | Error)[] = []
  for (let i = 0; i < files.length; i++) {
    const outputFormat = options.outputFormat === 'match' ? null : options.outputFormat
    try {
      const result = await upscaleImageFile(
        files[i],
        options.scale,
        outputFormat,
        (pct) => onFileProgress(i, pct)
      )
      results.push(result)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }
  return results
}
