import { loadUpscaler, upscaleImage } from './transformers-client'

export type UpscaleScale = '2x' | '4x'
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
  await loadUpscaler(options.scale, onModelProgress)

  const results: (File | Error)[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const outputFormat =
      options.outputFormat === 'match' ? null : options.outputFormat
    try {
      const result = await upscaleImage(
        file,
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
