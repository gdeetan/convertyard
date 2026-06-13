import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { extractText, getPageCount, renderPage } from './mupdf-client'

function isScannedPdf(pages: string[]): boolean {
  const totalText = pages.join('').replace(/\s/g, '')
  return totalText.length < 50
}

function detectHeading(line: string): typeof HeadingLevel.HEADING_2 | null {
  const t = line.trim()
  if (t.length < 3 || t.length > 120) return null
  if (t === t.toUpperCase() && /[A-Z]{3,}/.test(t)) return HeadingLevel.HEADING_2
  return null
}

function pagesToDocxParagraphs(pages: string[]): Paragraph[] {
  const paragraphs: Paragraph[] = []

  for (let p = 0; p < pages.length; p++) {
    if (p > 0) {
      paragraphs.push(new Paragraph({ pageBreakBefore: true, children: [] }))
    }

    const lines = pages[p].split('\n')
    let block = ''

    for (const line of lines) {
      if (line.trim() === '') {
        if (block.trim()) {
          paragraphs.push(new Paragraph({ children: [new TextRun(block.trim())] }))
          block = ''
        }
      } else {
        const heading = detectHeading(line)
        if (heading) {
          if (block.trim()) {
            paragraphs.push(new Paragraph({ children: [new TextRun(block.trim())] }))
            block = ''
          }
          paragraphs.push(new Paragraph({
            heading,
            children: [new TextRun({ text: line.trim(), bold: true })],
          }))
        } else {
          block += (block ? ' ' : '') + line
        }
      }
    }

    if (block.trim()) {
      paragraphs.push(new Paragraph({ children: [new TextRun(block.trim())] }))
    }
  }

  return paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun('')] })]
}

export async function convertPdfToWord(
  file: File,
  onProgress?: (pct: number) => void
): Promise<File> {
  const buffer = await file.arrayBuffer()

  onProgress?.(10)
  let pages = await extractText(buffer)

  if (isScannedPdf(pages)) {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng')
    const pageCount = await getPageCount(buffer)
    pages = []

    for (let p = 0; p < pageCount; p++) {
      const jpegBuffer = await renderPage(buffer, p, 150, 85)
      const blob = new Blob([jpegBuffer], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      try {
        const { data: { text } } = await worker.recognize(url)
        pages.push(text)
      } finally {
        URL.revokeObjectURL(url)
      }
      onProgress?.(Math.round(10 + ((p + 1) / pageCount) * 70))
    }

    await worker.terminate()
  }

  onProgress?.(85)

  const children = pagesToDocxParagraphs(pages)
  const doc = new Document({ sections: [{ properties: {}, children }] })
  const blob = await Packer.toBlob(doc)
  const baseName = file.name.replace(/\.[^.]+$/, '')

  onProgress?.(100)

  return new File(
    [blob],
    `${baseName}.docx`,
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  )
}
