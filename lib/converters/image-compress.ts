import type { ToolOptions, ConversionResult } from '@/lib/types'
import { convertViaWorker } from './vips-client'
import { detectSameFormat } from './format-utils'
import { svgCompress } from './svg-compress'

export async function imageCompress(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void
): Promise<ConversionResult[]> {
  if (opts.maxDimension === 'custom') {
    const custom = typeof opts.customMaxDimension === 'number' ? opts.customMaxDimension : 0
    opts = { ...opts, maxDimension: custom > 0 ? custom : 0 }
  }
  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (
      !file.type.startsWith('image/') &&
      !file.name.match(/\.(jpe?g|png|webp|avif|gif|svg)$/i)
    ) {
      onProgress?.(i, 100)
      const err = new Error(`${file.name}: unsupported file type`)
      results.push(err)
      onResult?.(i, err)
      continue
    }
    const fmt = detectSameFormat(file)
    try {
      onProgress?.(i, 10)
      const rawResult = fmt === 'svg'
        ? await svgCompress(file, opts)
        : await convertViaWorker(file, fmt, opts, (pct) => onProgress?.(i, pct))

      // If quality-mode re-encoding produced a file >= the original (common
      // for already-optimized PNGs), return the original with a notice
      // instead of a larger "compressed" copy. Skip when the user asked for
      // a resize or a target size (those paths have their own accounting).
      const targetSize = typeof opts.maxSizeKb === 'number' ? opts.maxSizeKb : 0
      const willResize = typeof opts.maxDimension === 'number' && opts.maxDimension > 0
      const producedFile: File | null =
        rawResult instanceof File
          ? rawResult
          : rawResult && !(rawResult instanceof Error) && 'file' in rawResult
            ? rawResult.file
            : null
      let result: ConversionResult = rawResult
      if (
        producedFile &&
        !willResize &&
        targetSize === 0 &&
        producedFile.size >= file.size
      ) {
        result = {
          file,
          notice: 'Already optimized — original file returned (no size reduction possible at this quality).',
        }
      }

      onProgress?.(i, 100)
      results.push(result)
      onResult?.(i, result)
    } catch (err) {
      onProgress?.(i, 100)
      const error = new Error(`${file.name}: ${err instanceof Error ? err.message : 'compression failed'}`)
      results.push(error)
      onResult?.(i, error)
    }
  }
  return results
}
