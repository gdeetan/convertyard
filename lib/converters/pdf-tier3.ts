import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { ConversionResult, ToolOptions } from '@/lib/types'

const HORIZONTAL_INSET = 30

export function resolveText(template: string, page: number, total: number): string {
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

  const headerTemplate = options.headerText === 'custom'
    ? (options.headerCustomText as string) ?? ''
    : (options.headerText as string) ?? ''
  const footerTemplate = options.footerText === 'custom'
    ? (options.footerCustomText as string) ?? ''
    : (options.footerText as string) ?? ''

  const fontSize = typeof options.fontSize === 'number' ? Math.max(6, Math.min(24, options.fontSize)) : 10
  const alignment = (options.alignment as string) ?? 'center'
  const headerMargin = typeof options.headerMargin === 'number' ? Math.max(10, Math.min(200, options.headerMargin)) : 30
  const footerMargin = typeof options.footerMargin === 'number' ? Math.max(10, Math.min(200, options.footerMargin)) : 30
  const expandPage = options.expandPage === true

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
        const { width, height: originalHeight } = page.getSize()
        const pageNum = p + 1

        const headerExpansion = expandPage && headerTemplate.trim() ? headerMargin : 0
        const footerExpansion = expandPage && footerTemplate.trim() ? footerMargin : 0

        if (expandPage && (headerExpansion > 0 || footerExpansion > 0)) {
          page.setMediaBox(0, -footerExpansion, width, originalHeight + headerExpansion + footerExpansion)
        }

        const drawLabel = (template: string, isHeader: boolean) => {
          if (!template.trim()) return
          const label = resolveText(template, pageNum, total)
          const textWidth = font.widthOfTextAtSize(label, fontSize)
          let x: number
          if (alignment === 'left') x = HORIZONTAL_INSET
          else if (alignment === 'right') x = width - textWidth - HORIZONTAL_INSET
          else x = (width - textWidth) / 2
          let y: number
          if (expandPage) {
            const expansion = isHeader ? headerExpansion : footerExpansion
            // expansion === 0 only when template is empty; drawLabel returns early above in that case
            y = isHeader
              ? originalHeight + (expansion - fontSize) / 2
              : -(expansion + fontSize) / 2
          } else {
            const margin = isHeader ? headerMargin : footerMargin
            y = isHeader ? originalHeight - margin - fontSize : margin
          }
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
