import type { ToolOptions, ConversionResult } from '@/lib/types'
import { convertViaWorker } from './vips-client'

function isHeic(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)
  )
}

// Decode HEIC → PNG using heic2any (includes libde265 HEVC decoder).
// wasm-vips's heif library omits libde265 (patent constraints), so HEIC
// files must be pre-decoded before being passed to the vips worker.
async function decodeHeic(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/png' })
  const blob = Array.isArray(result) ? result[0] : result
  const baseName = file.name.replace(/\.(heic|heif)$/i, '')
  return new File([blob], `${baseName}.png`, { type: 'image/png' })
}

export async function libvipsConvert(
  files: File[],
  outputFormat: string,
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    let file = files[i]

    if (
      !file.type.startsWith('image/') &&
      !file.name.match(/\.(jpe?g|png|webp|avif|heic|heif|gif|tiff?)$/i)
    ) {
      results.push(new Error(`Unsupported file type: ${file.type || 'unknown'}`))
      onProgress?.(i, 100)
      continue
    }

    onProgress?.(i, 10)

    try {
      if (isHeic(file)) {
        onProgress?.(i, 20)
        file = await decodeHeic(file)
        onProgress?.(i, 40)
      }

      const result = await convertViaWorker(
        file,
        outputFormat,
        opts,
        (pct) => onProgress?.(i, 40 + Math.round(pct * 0.6))
      )
      onProgress?.(i, 100)
      results.push(result)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(new Error(`${files[i].name}: ${err instanceof Error ? err.message : 'conversion failed'}`))
    }
  }

  return results
}
