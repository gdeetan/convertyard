import { PDFDocument } from 'pdf-lib'
import { getPageCount, renderPage } from './mupdf-client'
import type { ConversionResult, ToolOptions } from '@/lib/types'

// ── Merge ─────────────────────────────────────────────────────────────────────

export async function mergePDFs(
  files: File[],
  _options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  if (files.length === 0) return []

  const merged = await PDFDocument.create()

  for (let i = 0; i < files.length; i++) {
    onProgress?.(0, Math.round((i / files.length) * 80))
    const buffer = await files[i].arrayBuffer()
    const srcDoc = await PDFDocument.load(buffer)
    const pageIndices = srcDoc.getPageIndices()
    const copied = await merged.copyPages(srcDoc, pageIndices)
    for (const page of copied) merged.addPage(page)
  }

  onProgress?.(0, 90)
  const bytes = await merged.save({ useObjectStreams: true })
  onProgress?.(0, 100)

  const baseName = files[0].name.replace(/\.[^.]+$/, '')
  const outName = files.length === 1 ? files[0].name : `${baseName}-merged.pdf`
  return [new File([new Uint8Array(bytes)], outName, { type: 'application/pdf' })]
}

// ── Compress ──────────────────────────────────────────────────────────────────

export async function compressPDF(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const level = typeof options.level === 'string' ? options.level : 'medium'
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 10)
      const buffer = await files[i].arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })

      if (level === 'medium' || level === 'high') {
        doc.setTitle('')
        doc.setAuthor('')
        doc.setSubject('')
        doc.setKeywords([])
        doc.setProducer('')
        doc.setCreator('')
      }

      onProgress?.(i, 60)
      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      onProgress?.(i, 100)

      results.push(new File([new Uint8Array(bytes)], files[i].name, { type: 'application/pdf' }))
    } catch (err) {
      results.push(new Error(err instanceof Error ? err.message : 'Compression failed'))
    }
  }

  return results
}

// ── PDF to JPG ────────────────────────────────────────────────────────────────

export async function pdfToJpg(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const dpi = typeof options.dpi === 'number' ? options.dpi : 150
  const quality = typeof options.quality === 'number' ? options.quality : 85
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const pageCount = await getPageCount(buffer)
      const baseName = files[i].name.replace(/\.[^.]+$/, '')

      for (let p = 0; p < pageCount; p++) {
        const jpegBuffer = await renderPage(buffer, p, dpi, quality)
        const fileName = pageCount === 1
          ? `${baseName}.jpg`
          : `${baseName}-page-${p + 1}.jpg`
        results.push(new File([jpegBuffer], fileName, { type: 'image/jpeg' }))
        onProgress?.(i, Math.round(((p + 1) / pageCount) * 100))
      }
    } catch (err) {
      results.push(new Error(err instanceof Error ? err.message : 'Conversion failed'))
    }
  }

  return results
}
