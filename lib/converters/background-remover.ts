import { loadTransformersModel, removeBackground } from './transformers-client'
import type { ToolOptions } from '@/lib/types'
import type { ConversionResult } from '@/lib/types'

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
      const file = await removeBackground(
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
