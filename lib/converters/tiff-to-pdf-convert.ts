import { PDFDocument } from 'pdf-lib'
import type { ConversionResult, ToolOptions } from '@/lib/types'

async function embedImageInPdf(
  doc: PDFDocument,
  file: File,
): Promise<void> {
  const buffer = await file.arrayBuffer()
  let imgBytes: Uint8Array
  let embedFn: 'embedJpg' | 'embedPng'

  if (file.type === 'image/jpeg') {
    imgBytes = new Uint8Array(buffer)
    embedFn = 'embedJpg'
  } else {
    // Convert to PNG via canvas
    const blob = new Blob([buffer], { type: file.type })
    const bmp = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    bmp.close()
    const pngBlob = await canvas.convertToBlob({ type: 'image/png' })
    imgBytes = new Uint8Array(await pngBlob.arrayBuffer())
    embedFn = 'embedPng'
  }

  const image = await doc[embedFn](imgBytes)
  const { width, height } = image
  const page = doc.addPage([width, height])
  page.drawImage(image, { x: 0, y: 0, width, height })
}

export async function tiffToPdfConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<ConversionResult[]> {
  const combineAll = opts.outputMode === 'combine'
  const results: ConversionResult[] = []

  if (combineAll) {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name))
    const pdfDoc = await PDFDocument.create()

    for (let i = 0; i < sorted.length; i++) {
      onProgress?.(0, Math.round((i / sorted.length) * 90))
      try {
        await embedImageInPdf(pdfDoc, sorted[i])
      } catch {
        // Skip unreadable images and continue
      }
    }

    onProgress?.(0, 95)
    if (pdfDoc.getPageCount() === 0) {
      return [new Error('No TIFF files could be embedded')]
    }

    const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false })
    const baseName = sorted[0].name.replace(/\.[^.]+$/, '')
    const outName = sorted.length === 1 ? `${baseName}.pdf` : `${baseName}-merged.pdf`
    results.push(new File([bytes as unknown as Uint8Array], outName, { type: 'application/pdf' }))
    onProgress?.(0, 100)
  } else {
    for (let i = 0; i < files.length; i++) {
      onProgress?.(i, 10)
      try {
        const pdfDoc = await PDFDocument.create()
        await embedImageInPdf(pdfDoc, files[i])
        onProgress?.(i, 60)
        const bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false })
        const name = files[i].name.replace(/\.tiff?$/i, '.pdf')
        results.push(new File([bytes as unknown as Uint8Array], name, { type: 'application/pdf' }))
        onProgress?.(i, 100)
      } catch (err) {
        onProgress?.(i, 100)
        results.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }

  return results
}
