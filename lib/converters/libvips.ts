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

function isAvif(file: File): boolean {
  return file.type === 'image/avif' || /\.avif$/i.test(file.name)
}

// Decode AVIF → PNG via Canvas API (browser's native AV1 decoder).
// wasm-vips ships libheif 1.x which rejects AVIF files encoded with
// tooling that targets the libheif 2.x API. Using createImageBitmap
// delegates decoding to the browser's built-in AV1 support, which
// handles all AVIF variants the browser can display.
async function decodeAvifViaCanvas(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D canvas context')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  const baseName = file.name.replace(/\.avif$/i, '')
  return new File([blob], `${baseName}.png`, { type: 'image/png' })
}

function isBmp(file: File): boolean {
  return (
    file.type === 'image/bmp' ||
    file.type === 'image/x-bmp' ||
    file.type === 'image/x-ms-bmp' ||
    /\.bmp$/i.test(file.name)
  )
}

// Decode BMP → PNG via Canvas API.
// wasm-vips WASM build omits the BMP foreign loader, so BMP files must
// be pre-decoded in the browser before passing to the vips worker.
async function decodeBmpViaCanvas(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D canvas context')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  const baseName = file.name.replace(/\.bmp$/i, '')
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
      !file.name.match(/\.(jpe?g|png|webp|avif|heic|heif|gif|tiff?|bmp)$/i)
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
      } else if (isAvif(file)) {
        onProgress?.(i, 20)
        file = await decodeAvifViaCanvas(file)
        onProgress?.(i, 40)
      } else if (isBmp(file)) {
        onProgress?.(i, 20)
        file = await decodeBmpViaCanvas(file)
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
