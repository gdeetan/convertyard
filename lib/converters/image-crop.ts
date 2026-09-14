import type { ToolOptions, ConversionResult } from '@/lib/types'
import { convertViaWorker } from './vips-client'
import { detectSameFormat } from './format-utils'

export async function imageCrop(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const perFile = Array.isArray(opts.cropRects)
    ? (opts.cropRects as Array<{ x: number; y: number; w: number; h: number }>)
    : null
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
    const r = perFile?.[i]
    const fileOpts = r
      ? { ...opts, cropX: r.x, cropY: r.y, cropW: r.w, cropH: r.h, cropRects: undefined }
      : opts
    try {
      const result = await convertViaWorker(file, fmt, fileOpts, (pct) => onProgress?.(i, pct))
      onProgress?.(i, 100)
      results.push(result)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(new Error(`${file.name}: ${err instanceof Error ? err.message : 'crop failed'}`))
    }
  }
  return results
}
