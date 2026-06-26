// lib/converters/ocr-pdf.ts
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getPageCount, renderPagePng } from './mupdf-client'
import { recognizePage, terminateOcrWorker } from '@/lib/ocr/tesseract-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'

const OCR_DPI = 300

export async function ocrPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const lang = (options.language as string) || 'eng'
  const outputMode = (options.outputMode as string) || 'searchable-pdf'
  const results: ConversionResult[] = []

  try {
    for (let fi = 0; fi < files.length; fi++) {
      try {
        const file = files[fi]
        onProgress?.(fi, 0)

        const buffer = await file.arrayBuffer()
        const pageCount = await getPageCount(buffer.slice(0))

        if (outputMode === 'text-only') {
          const textPages: string[] = []
          for (let p = 0; p < pageCount; p++) {
            onProgress?.(fi, Math.round(((p + 0.5) / pageCount) * 95))
            const pngBuffer = await renderPagePng(buffer.slice(0), p, OCR_DPI)
            const blob = new Blob([pngBuffer], { type: 'image/png' })
            const { text } = await recognizePage(blob, lang)
            textPages.push(`=== Page ${p + 1} ===\n${text.trim()}`)
          }
          const outText = textPages.join('\n\n')
          const outName = file.name.replace(/\.pdf$/i, '-text.txt')
          results.push(new File([outText], outName, { type: 'text/plain' }))
        } else {
          const pdfDoc = await PDFDocument.load(buffer.slice(0))
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

          for (let p = 0; p < pageCount; p++) {
            onProgress?.(fi, Math.round(((p + 0.5) / pageCount) * 90))
            const pngBuffer = await renderPagePng(buffer.slice(0), p, OCR_DPI)
            const blob = new Blob([pngBuffer], { type: 'image/png' })
            const { words } = await recognizePage(blob, lang)

            const page = pdfDoc.getPage(p)
            const { height: pageHeight } = page.getSize()

            for (const word of words) {
              const text = word.text.trim()
              if (!text) continue
              const pdfX = word.bbox.x0 * (72 / OCR_DPI)
              const pdfY = pageHeight - word.bbox.y1 * (72 / OCR_DPI)
              const fontSize = Math.max(6, (word.bbox.y1 - word.bbox.y0) * (72 / OCR_DPI))
              page.drawText(text, {
                x: pdfX,
                y: pdfY,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
                opacity: 0,
              })
            }
          }

          onProgress?.(fi, 95)
          const bytes = await pdfDoc.save()
          const outName = file.name.replace(/\.pdf$/i, '-searchable.pdf')
          results.push(
            new File([new Uint8Array(bytes)], outName, { type: 'application/pdf' })
          )
        }

        onProgress?.(fi, 100)
      } catch (err) {
        results.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
  } finally {
    await terminateOcrWorker()
  }

  return results
}
