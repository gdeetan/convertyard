import type { ConversionResult, ToolOptions } from '@/lib/types'

export const PREVIEW_MAX_EDGE = 1200

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function blurRadiusFromOption(value: unknown): number {
  if (value === 'low' || value === 2) return 2
  if (value === 'medium' || value === 5) return 5
  if (value === 'off' || value === '0' || value === 0) return 0
  if (typeof value === 'number' && value > 0) return value
  return 0
}

export function buildTracerOptions(opts: ToolOptions): Record<string, unknown> {
  return {
    ltres: num(opts.ltres, 1),
    qtres: num(opts.qtres, 1),
    pathomit: num(opts.pathomit, 8),
    colorsampling: typeof opts.colorsampling === 'number' ? opts.colorsampling : 2,
    numberofcolors: num(opts.numberofcolors, 16),
    blurradius: blurRadiusFromOption(opts.blurradius),
    blurdelta: 20,
    scale: 1,
    strokewidth: 1,
  }
}

export function scaledSize(
  width: number,
  height: number,
  maxEdge?: number,
): { width: number; height: number } {
  if (!maxEdge || Math.max(width, height) <= maxEdge) {
    return { width, height }
  }
  const scale = maxEdge / Math.max(width, height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

async function traceImage(file: File, opts: ToolOptions): Promise<File> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ImageTracer = (await import('imagetracerjs')).default

  const bitmap = await createImageBitmap(file)
  const maxEdge = typeof opts.previewMaxEdge === 'number' ? opts.previewMaxEdge : undefined
  const { width, height } = scaledSize(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const svgStr: string = ImageTracer.imagedataToSVG(imageData, buildTracerOptions(opts))

  const name = file.name.replace(/\.(png|jpg|jpeg|webp|gif|bmp|tiff?)$/i, '.svg')
  return new File([svgStr], name, { type: 'image/svg+xml' })
}

export async function pngToSvgConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void,
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 10)
    try {
      const out = await traceImage(files[i], opts)
      onProgress?.(i, 100)
      results.push(out)
      onResult?.(i, out)
    } catch (err) {
      onProgress?.(i, 100)
      const error = err instanceof Error ? err : new Error(String(err))
      results.push(error)
      onResult?.(i, error)
    }
  }
  return results
}
