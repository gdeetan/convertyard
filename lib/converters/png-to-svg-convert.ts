import type { ConversionResult, ToolOptions } from '@/lib/types'

async function traceImage(file: File, opts: ToolOptions): Promise<File> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ImageTracer = (await import('imagetracerjs')).default

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const ltres = typeof opts.ltres === 'number' ? opts.ltres : 1
  const qtres = typeof opts.qtres === 'number' ? opts.qtres : 1
  const pathomit = typeof opts.pathomit === 'number' ? opts.pathomit : 8
  const colorsampling = typeof opts.colorsampling === 'number' ? opts.colorsampling : 2
  const numberofcolors = typeof opts.numberofcolors === 'number' ? opts.numberofcolors : 16

  const svgStr: string = ImageTracer.imagedataToSVG(imageData, {
    ltres,
    qtres,
    pathomit,
    colorsampling,
    numberofcolors,
    scale: 1,
    strokewidth: 1,
  })

  const name = file.name.replace(/\.(png|jpg|jpeg|webp|gif|bmp|tiff?)$/i, '.svg')
  return new File([svgStr], name, { type: 'image/svg+xml' })
}

export async function pngToSvgConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, 10)
    try {
      const out = await traceImage(files[i], opts)
      onProgress?.(i, 100)
      results.push(out)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }
  return results
}
