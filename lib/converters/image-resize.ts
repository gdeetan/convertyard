import type { ToolOptions, ConversionResult } from '@/lib/types'
import { convertViaWorker } from './vips-client'

function detectFormat(file: File): string {
  if (file.type === 'image/jpeg' || /\.(jpe?g)$/i.test(file.name)) return 'jpg'
  if (file.type === 'image/png' || /\.png$/i.test(file.name)) return 'png'
  if (file.type === 'image/webp' || /\.webp$/i.test(file.name)) return 'webp'
  return 'jpg'
}

export async function imageResize(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fmt = detectFormat(file)
    try {
      const result = await convertViaWorker(file, fmt, opts, (pct) => onProgress?.(i, pct))
      onProgress?.(i, 100)
      results.push(result)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(new Error(`${file.name}: ${err instanceof Error ? err.message : 'resize failed'}`))
    }
  }
  return results
}
