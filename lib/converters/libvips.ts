import type { ToolOptions, ConversionResult } from '@/lib/types'
import { convertViaWorker } from './vips-client'

/**
 * Convert an array of files to the given output format using libvips/wasm-vips.
 * Processing happens inside a dedicated Web Worker — wasm-vips never runs on the
 * main thread, which prevents double-initialization BindingErrors.
 *
 * Supported opts keys (all optional):
 *   quality       number  1-100, default 80. Ignored when lossless=true.
 *   lossless      boolean Lossless encode. Default false.
 *   method        number  0-6, WebP compression effort. Default 4.
 *   autoOrient    boolean Fix EXIF rotation. Default true.
 *   maxDimension  number  Downscale longer edge to this px. 0 = no resize. Default 0.
 *   stripMetadata boolean Remove all EXIF/ICC/XMP. Default false.
 *   sharpen       boolean Apply mild unsharp-mask after encode. Default false.
 */
export async function libvipsConvert(
  files: File[],
  outputFormat: string,
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    if (
      !file.type.startsWith('image/') &&
      !file.name.match(/\.(jpe?g|png|webp|avif|heic|gif|tiff?)$/i)
    ) {
      results.push(new Error(`Unsupported file type: ${file.type || 'unknown'}`))
      onProgress?.(i, 100)
      continue
    }

    onProgress?.(i, 10)

    try {
      const result = await convertViaWorker(
        file,
        outputFormat,
        opts,
        (pct) => onProgress?.(i, pct)
      )
      onProgress?.(i, 100)
      results.push(result)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(new Error(`${file.name}: ${err instanceof Error ? err.message : 'conversion failed'}`))
    }
  }

  return results
}
