import type { ToolOptions, ConversionResult } from '@/lib/types'
import { convertViaWorker } from './vips-client'
import { detectSameFormat } from './format-utils'

export async function imageCompress(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (
      !file.type.startsWith('image/') &&
      !file.name.match(/\.(jpe?g|png|webp)$/i)
    ) {
      onProgress?.(i, 100)
      results.push(new Error(`${file.name}: unsupported file type`))
      continue
    }
    const fmt = detectSameFormat(file)
    try {
      const result = await convertViaWorker(file, fmt, opts, (pct) => onProgress?.(i, pct))
      onProgress?.(i, 100)
      results.push(result)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(new Error(`${file.name}: ${err instanceof Error ? err.message : 'compression failed'}`))
    }
  }
  return results
}
