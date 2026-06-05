import type { ToolOptions, ConversionResult } from '@/lib/types'

// Singleton: load wasm-vips once, reuse across all conversions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vipsReady: Promise<any> | null = null

function loadVips() {
  if (!vipsReady) {
    vipsReady = import('wasm-vips')
      .then(({ default: Vips }) =>
        Vips({ locateFile: () => '/vips.wasm' })
      )
      .catch((err) => {
        vipsReady = null // allow retry on next call
        throw err
      })
  }
  return vipsReady
}

/**
 * Convert an array of files to the given output format using libvips/wasm-vips.
 *
 * Supported opts keys (all optional):
 *   quality       number  1-100, default 80. Ignored when lossless=true.
 *   lossless      boolean Lossless encode. Default false.
 *   method        number  0-6, WebP compression effort. Default 4.
 *   autoOrient    boolean Fix EXIF rotation. Default true.
 *   maxDimension  number  Downscale longer edge to this px. 0 = no resize. Default 0.
 *   stripMetadata boolean Remove all EXIF/ICC/XMP. Default false.
 *   sharpen       boolean Apply mild unsharp-mask after encode. Default false.
 *
 * Files are processed sequentially. Each file's result is File on success,
 * Error on failure — the batch continues regardless of individual failures.
 * WASM is not loaded if all files are invalid types.
 */
export async function libvipsConvert(
  files: File[],
  outputFormat: string,
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let vips: any = null

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // Reject non-image MIME types immediately — WASM is not loaded for invalid files
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
      // Load WASM on the first valid file — skipped entirely if all files are invalid
      if (!vips) {
        vips = await loadVips()
      }

      const buffer = await file.arrayBuffer()
      const uint8 = new Uint8Array(buffer as ArrayBuffer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let image: any = vips.Image.newFromBuffer(uint8)

      try {
        // 1. Auto-orient: correct rotation from EXIF (default ON)
        if (opts.autoOrient !== false) {
          const oriented = image.autorot()
          image.delete()
          image = oriented
        }

        onProgress?.(i, 30)

        // 2. Resize: downscale longer edge, preserve aspect ratio, no upscaling
        const maxDim = typeof opts.maxDimension === 'number' ? opts.maxDimension : 0
        if (maxDim > 0) {
          const longer = Math.max(image.width, image.height)
          if (longer > maxDim) {
            const resized = image.resize(maxDim / longer)
            image.delete()
            image = resized
          }
        }

        onProgress?.(i, 50)

        // 3. Sharpen (mild unsharp-mask to compensate for WebP softness)
        if (opts.sharpen === true) {
          const sharpened = image.sharpen({ sigma: 0.5, x1: 1.0 })
          image.delete()
          image = sharpened
        }

        onProgress?.(i, 70)

        // 4. Encode
        const quality = typeof opts.quality === 'number' ? opts.quality : 80
        const method = typeof opts.method === 'number' ? opts.method : 4
        const encodeOpts: Record<string, unknown> = {
          Q: quality,
          lossless: opts.lossless === true,
          effort: method,
          strip: opts.stripMetadata === true,
        }

        const outBuffer = image.writeToBuffer(`.${outputFormat}`, encodeOpts) as Uint8Array<ArrayBuffer>

        const baseName = file.name.replace(/\.[^.]+$/, '')
        const mimeType =
          outputFormat === 'webp' ? 'image/webp'
          : outputFormat === 'avif' ? 'image/avif'
          : outputFormat === 'png' ? 'image/png'
          : 'image/jpeg'

        const result = new File([outBuffer], `${baseName}.${outputFormat}`, { type: mimeType })

        onProgress?.(i, 100)
        results.push(result)
      } finally {
        // Always free WASM image memory, even if encode or transforms threw
        image.delete()
      }
    } catch (err) {
      onProgress?.(i, 100)
      results.push(new Error(`${file.name}: ${err instanceof Error ? err.message : 'conversion failed'}`))
    }
  }

  return results
}
