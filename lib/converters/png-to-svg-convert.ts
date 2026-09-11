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

export type EdgeSmoothingLevel = 'off' | 'low' | 'medium' | 'high'

interface EdgeSmoothingProfile {
  qtres: number
  linefilter: boolean
  supersample: number
  minBlur: number
  snapAlpha: number
  median: boolean
  optimize: boolean
}

export function edgeSmoothingProfile(value: unknown): EdgeSmoothingProfile {
  const v = value as EdgeSmoothingLevel
  if (v === 'low')
    return { qtres: 1.5, linefilter: true, supersample: 1, minBlur: 0, snapAlpha: 128, median: false, optimize: true }
  if (v === 'medium')
    return { qtres: 2, linefilter: true, supersample: 2, minBlur: 1, snapAlpha: 128, median: true, optimize: true }
  if (v === 'high')
    return { qtres: 3, linefilter: true, supersample: 2, minBlur: 2, snapAlpha: 160, median: true, optimize: true }
  return { qtres: 1, linefilter: false, supersample: 1, minBlur: 0, snapAlpha: 0, median: false, optimize: false }
}

export function snapAlphaEdges(imageData: ImageData, threshold: number): ImageData {
  if (threshold <= 0) return imageData
  const data = imageData.data
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i]
    if (a === 0 || a === 255) continue
    data[i] = a >= threshold ? 255 : 0
  }
  return imageData
}

export function medianFilter3x3(imageData: ImageData): ImageData {
  const { width, height, data } = imageData
  const out = new Uint8ClampedArray(data)
  const rs = new Uint8Array(9)
  const gs = new Uint8Array(9)
  const bs = new Uint8Array(9)
  const pick = (arr: Uint8Array) => {
    for (let i = 1; i < 9; i++) {
      const v = arr[i]
      let j = i - 1
      while (j >= 0 && arr[j] > v) {
        arr[j + 1] = arr[j]
        j--
      }
      arr[j + 1] = v
    }
    return arr[4]
  }
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const centerIdx = (y * width + x) * 4
      if (data[centerIdx + 3] === 0) continue
      let k = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4
          rs[k] = data[i]
          gs[k] = data[i + 1]
          bs[k] = data[i + 2]
          k++
        }
      }
      out[centerIdx] = pick(rs)
      out[centerIdx + 1] = pick(gs)
      out[centerIdx + 2] = pick(bs)
    }
  }
  imageData.data.set(out)
  return imageData
}

let svgoModulePromise: Promise<typeof import('svgo')> | null = null
async function loadSvgo() {
  if (!svgoModulePromise) svgoModulePromise = import('svgo')
  return svgoModulePromise
}

export async function optimizeSvg(svg: string): Promise<string> {
  try {
    const { optimize } = await loadSvgo()
    const result = optimize(svg, {
      multipass: true,
      floatPrecision: 2,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
              cleanupIds: false,
            },
          },
        },
        'mergePaths',
      ],
    })
    return result.data || svg
  } catch {
    return svg
  }
}

export function buildTracerOptions(opts: ToolOptions): Record<string, unknown> {
  const smoothing = edgeSmoothingProfile(opts.edgesmoothing)
  const userQtres = num(opts.qtres, 1)
  const userBlur = blurRadiusFromOption(opts.blurradius)
  return {
    ltres: num(opts.ltres, 1),
    qtres: opts.edgesmoothing && opts.edgesmoothing !== 'off' ? smoothing.qtres : userQtres,
    pathomit: num(opts.pathomit, 8),
    colorsampling: typeof opts.colorsampling === 'number' ? opts.colorsampling : 2,
    numberofcolors: num(opts.numberofcolors, 16),
    blurradius: Math.max(userBlur, smoothing.minBlur),
    blurdelta: 20,
    linefilter: smoothing.linefilter,
    scale: 1,
    strokewidth: 1,
  }
}

export function supersampleFactor(opts: ToolOptions): number {
  return edgeSmoothingProfile(opts.edgesmoothing).supersample
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

export function normalizeSupersampledSvg(
  svg: string,
  width: number,
  height: number,
  sourceWidth: number,
  sourceHeight: number,
): string {
  let out = svg.replace(/<svg\b[^>]*>/, (tag) => {
    let next = tag
    next = /\swidth=/.test(next)
      ? next.replace(/\swidth="[^"]*"/, ` width="${width}"`)
      : next.replace('<svg', `<svg width="${width}"`)
    next = /\sheight=/.test(next)
      ? next.replace(/\sheight="[^"]*"/, ` height="${height}"`)
      : next.replace('<svg', `<svg height="${height}"`)
    next = /\sviewBox=/.test(next)
      ? next
      : next.replace('<svg', `<svg viewBox="0 0 ${sourceWidth} ${sourceHeight}"`)
    return next
  })
  return out
}

async function traceImage(file: File, opts: ToolOptions): Promise<File> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ImageTracer = (await import('imagetracerjs')).default

  const bitmap = await createImageBitmap(file)
  const maxEdge = typeof opts.previewMaxEdge === 'number' ? opts.previewMaxEdge : undefined
  const base = scaledSize(bitmap.width, bitmap.height, maxEdge)
  const factor = supersampleFactor(opts)
  const width = base.width * factor
  const height = base.height * factor
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const smoothing = edgeSmoothingProfile(opts.edgesmoothing)
  if (smoothing.snapAlpha > 0) {
    snapAlphaEdges(imageData, smoothing.snapAlpha)
  }
  if (smoothing.median) {
    medianFilter3x3(imageData)
  }
  let svgStr: string = ImageTracer.imagedataToSVG(imageData, buildTracerOptions(opts))

  if (factor !== 1) {
    svgStr = normalizeSupersampledSvg(svgStr, base.width, base.height, width, height)
  }
  if (smoothing.optimize) {
    svgStr = await optimizeSvg(svgStr)
  }

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
