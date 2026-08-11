import type { ConversionResult, ToolOptions } from '@/lib/types'

function getOutputMime(format: 'png' | 'jpg' | 'webp'): string {
  return format === 'jpg' ? 'image/jpeg'
    : format === 'webp' ? 'image/webp'
    : 'image/png'
}

async function rasteriseSvg(
  file: File,
  format: 'png' | 'jpg' | 'webp',
  opts: ToolOptions,
): Promise<File> {
  const text = await file.text()
  const blob = new Blob([text], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error(`Failed to load SVG: ${file.name}`))
    i.src = url
  })
  URL.revokeObjectURL(url)

  const scale = typeof opts.scale === 'number' ? opts.scale : 1
  const customWidth = typeof opts.outputWidth === 'number' && opts.outputWidth > 0
    ? opts.outputWidth : 0
  const srcW = img.naturalWidth || 512
  const srcH = img.naturalHeight || 512
  const outW = customWidth > 0 ? customWidth : Math.round(srcW * scale)
  const outH = customWidth > 0 ? Math.round(srcH * (customWidth / srcW)) : Math.round(srcH * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!

  if (format === 'jpg') {
    const bg = typeof opts.bgColor === 'string' ? opts.bgColor : '#ffffff'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, outW, outH)
  } else {
    const transparent = opts.transparent !== false
    if (!transparent) {
      ctx.fillStyle = typeof opts.bgColor === 'string' ? opts.bgColor : '#ffffff'
      ctx.fillRect(0, 0, outW, outH)
    }
  }

  ctx.drawImage(img, 0, 0, outW, outH)

  const quality = typeof opts.quality === 'number' ? opts.quality / 100 : 0.92
  const mime = getOutputMime(format)

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error('Canvas toBlob failed'))
        const ext = format === 'jpg' ? 'jpg' : format
        const name = file.name.replace(/\.svg$/i, `.${ext}`)
        resolve(new File([b], name, { type: mime }))
      },
      mime,
      quality,
    )
  })
}

export async function svgConvert(
  files: File[],
  format: 'png' | 'jpg' | 'webp',
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void,
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 10)
    try {
      const out = await rasteriseSvg(files[i], format, opts)
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
