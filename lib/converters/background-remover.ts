import {
  loadTransformersModel,
  removeBackground as removeBackgroundFile,
  removeBackgroundDetailed,
} from './transformers-client'
import type { ToolOptions } from '@/lib/types'
import type { ConversionResult } from '@/lib/types'

export type BackgroundRemovalPreset = 'balanced' | 'sharper-edges' | 'softer-edges'

export type BackgroundRemovalResult = {
  outputBlob: Blob
  alphaMask: ImageData
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

export async function removeBackground(
  image: File | Blob,
  options: { preset: BackgroundRemovalPreset },
  onProgress?: (pct: number) => void
): Promise<BackgroundRemovalResult> {
  await loadTransformersModel('bg-removal', onProgress ?? (() => {}))
  return removeBackgroundDetailed(image, options.preset, onProgress)
}

export async function removeBackgroundBatch(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const outputFormat = (options.outputFormat as string) ?? 'png'

  // Load model with progress reported on a synthetic "pre-flight" phase.
  // onProgress(fileIndex=-1) isn't supported by ToolShell, so we pre-load
  // before conversion starts (called from the page component).
  await loadTransformersModel('bg-removal', () => {})

  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const file = await removeBackgroundFile(
        files[i],
        outputFormat,
        (pct) => onProgress?.(i, pct)
      )
      results.push(file)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}
