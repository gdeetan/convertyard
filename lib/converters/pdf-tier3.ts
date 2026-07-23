import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { ConversionResult, ToolOptions } from '@/lib/types'

const MARGIN = 30

function resolveText(template: string, page: number, total: number): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  return template
    .replace(/\{page\}/g, String(page))
    .replace(/\{total\}/g, String(total))
    .replace(/\{date\}/g, date)
}

export async function headerFooterPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const headerTemplate = (options.headerText as string) ?? ''
  const footerTemplate = (options.footerText as string) ?? ''
  const fontSize = typeof options.fontSize === 'number' ? Math.max(6, Math.min(24, options.fontSize)) : 10
  const alignment = (options.alignment as string) ?? 'center'

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      const total = pages.length

      for (let p = 0; p < pages.length; p++) {
        const page = pages[p]
        const { width, height } = page.getSize()
        const pageNum = p + 1

        const drawLabel = (template: string, isHeader: boolean) => {
          if (!template.trim()) return
          const label = resolveText(template, pageNum, total)
          const textWidth = font.widthOfTextAtSize(label, fontSize)
          let x: number
          if (alignment === 'left') x = MARGIN
          else if (alignment === 'right') x = width - textWidth - MARGIN
          else x = (width - textWidth) / 2
          const y = isHeader ? height - MARGIN - fontSize : MARGIN
          page.drawText(label, { x, y, size: fontSize, font, color: rgb(0, 0, 0), opacity: 1 })
        }

        drawLabel(headerTemplate, true)
        drawLabel(footerTemplate, false)
        onProgress?.(i, Math.round(5 + ((p + 1) / pages.length) * 85))
      }

      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      const baseName = files[i].name.replace(/\.pdf$/i, '')
      results.push(new File([bytes as Uint8Array<ArrayBuffer>], `${baseName}-headerfooter.pdf`, { type: 'application/pdf' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

export async function editPdfMetadata(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const title = (options.title as string) ?? ''
  const author = (options.author as string) ?? ''
  const subject = (options.subject as string) ?? ''
  const keywordsRaw = (options.keywords as string) ?? ''
  const creator = (options.creator as string) ?? ''

  const keywords = keywordsRaw
    .split(';')
    .map((k) => k.trim())
    .filter(Boolean)

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 10)
      const buffer = await files[i].arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })

      doc.setTitle(title)
      doc.setAuthor(author)
      doc.setSubject(subject)
      doc.setKeywords(keywords)
      doc.setCreator(creator)

      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      const baseName = files[i].name.replace(/\.pdf$/i, '')
      results.push(new File([bytes as Uint8Array<ArrayBuffer>], `${baseName}-metadata.pdf`, { type: 'application/pdf' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

export async function flattenPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 10)
      const buffer = await files[i].arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      doc.getForm().flatten()
      onProgress?.(i, 70)
      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      const baseName = files[i].name.replace(/\.pdf$/i, '')
      results.push(new File([bytes as Uint8Array<ArrayBuffer>], `${baseName}-flattened.pdf`, { type: 'application/pdf' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}
