import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { extractStructuredText, getPageCount, renderPage } from './mupdf-client'

// ── mupdf structured-text JSON types ─────────────────────────────────────────

interface StChar { c: number }

interface StSpan {
  font?: { name?: string; weight?: string; style?: string }
  size?: number
  color?: number
  chars?: StChar[]
  text?: string
}

interface StLine {
  spans?: StSpan[]
}

interface StBlock {
  type?: string | number  // "text" | "image" | 0 | 1
  lines?: StLine[]
}

interface StPage {
  blocks?: StBlock[]
}

// ── Span helpers ──────────────────────────────────────────────────────────────

function spanText(span: StSpan): string {
  if (typeof span.text === 'string') return span.text
  return (span.chars ?? []).map(ch => String.fromCodePoint(ch.c)).join('')
}

function isBold(span: StSpan): boolean {
  if (span.font?.weight === 'bold') return true
  const name = (span.font?.name ?? '').toLowerCase()
  return name.includes('bold') || name.includes('heavy') || name.includes('black') || name.includes('-bd')
}

function isItalic(span: StSpan): boolean {
  if (span.font?.style === 'italic' || span.font?.style === 'oblique') return true
  const name = (span.font?.name ?? '').toLowerCase()
  return name.includes('italic') || name.includes('oblique') || name.includes('-it') || name.includes('-ob')
}

function isTextBlock(block: StBlock): boolean {
  return block.type === 'text' || block.type === 0
}

// ── Font-size analysis ────────────────────────────────────────────────────────

function bodyFontSize(pages: StPage[]): number {
  const freq: Record<number, number> = {}
  for (const page of pages) {
    for (const block of page.blocks ?? []) {
      if (!isTextBlock(block)) continue
      for (const line of block.lines ?? []) {
        for (const span of line.spans ?? []) {
          if (!span.size || !spanText(span).trim()) continue
          const s = Math.round(span.size)
          freq[s] = (freq[s] ?? 0) + 1
        }
      }
    }
  }
  const entries = Object.entries(freq)
  if (entries.length === 0) return 12
  return Number(entries.sort((a, b) => b[1] - a[1])[0][0])
}

function headingLevel(
  size: number,
  body: number
): typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2 | typeof HeadingLevel.HEADING_3 | null {
  const ratio = size / body
  if (ratio >= 1.8) return HeadingLevel.HEADING_1
  if (ratio >= 1.35) return HeadingLevel.HEADING_2
  if (ratio >= 1.15) return HeadingLevel.HEADING_3
  return null
}

// ── Block → docx Paragraph ───────────────────────────────────────────────────

function blockToParagraph(block: StBlock, body: number): Paragraph | null {
  const allSpans = (block.lines ?? []).flatMap(l => l.spans ?? [])
  const text = allSpans.map(spanText).join('').trim()
  if (!text) return null

  // Dominant font size: most frequent non-zero size in this block
  const sizes = allSpans.filter(s => s.size).map(s => s.size as number)
  const sizeFreq: Record<number, number> = {}
  for (const s of sizes) { const r = Math.round(s); sizeFreq[r] = (sizeFreq[r] ?? 0) + 1 }
  const dominantSize = sizes.length > 0
    ? Number(Object.entries(sizeFreq).sort((a, b) => b[1] - a[1])[0][0])
    : body

  const level = headingLevel(dominantSize, body)

  if (level) {
    return new Paragraph({
      heading: level,
      children: [new TextRun({ text, bold: true })],
    })
  }

  // Normal paragraph — one TextRun per span to preserve bold/italic
  const runs: TextRun[] = []
  for (const span of allSpans) {
    const t = spanText(span)
    if (!t) continue
    runs.push(new TextRun({ text: t, bold: isBold(span), italics: isItalic(span) }))
  }

  return new Paragraph({ children: runs.length > 0 ? runs : [new TextRun(text)] })
}

// ── Page JSON → Paragraphs ───────────────────────────────────────────────────

function pagesToParagraphs(pages: StPage[], body: number): Paragraph[] {
  const out: Paragraph[] = []

  for (let p = 0; p < pages.length; p++) {
    if (p > 0) {
      out.push(new Paragraph({ pageBreakBefore: true, children: [] }))
    }
    for (const block of pages[p].blocks ?? []) {
      if (!isTextBlock(block)) continue
      const para = blockToParagraph(block, body)
      if (para) out.push(para)
    }
  }

  return out.length > 0 ? out : [new Paragraph({ children: [new TextRun('')] })]
}

// ── Scanned PDF detection ─────────────────────────────────────────────────────

function isScanned(pages: StPage[]): boolean {
  const total = pages
    .flatMap(p => p.blocks ?? [])
    .filter(isTextBlock)
    .flatMap(b => b.lines ?? [])
    .flatMap(l => l.spans ?? [])
    .map(spanText)
    .join('')
    .replace(/\s/g, '')
  return total.length < 50
}

// ── Public export ─────────────────────────────────────────────────────────────

export async function convertPdfToWord(
  file: File,
  onProgress?: (pct: number) => void
): Promise<File> {
  const buffer = await file.arrayBuffer()
  onProgress?.(10)

  // Try structured extraction
  let pages: StPage[] = []
  try {
    const rawPages = await extractStructuredText(buffer)
    pages = rawPages.map(json => {
      try { return JSON.parse(json) as StPage }
      catch { return { blocks: [] } }
    })
  } catch {
    pages = []
  }

  onProgress?.(30)

  if (isScanned(pages)) {
    // OCR path for scanned/image-only PDFs
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng')
    const pageCount = await getPageCount(buffer)
    const ocrTexts: string[] = []

    for (let p = 0; p < pageCount; p++) {
      const jpegBuffer = await renderPage(buffer, p, 150, 85)
      const blob = new Blob([jpegBuffer], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      try {
        const { data: { text } } = await worker.recognize(url)
        ocrTexts.push(text)
      } finally {
        URL.revokeObjectURL(url)
      }
      onProgress?.(Math.round(30 + ((p + 1) / pageCount) * 50))
    }

    await worker.terminate()

    // Convert OCR plain text to StPage structure so we reuse the same pipeline
    pages = ocrTexts.map(text => ({
      blocks: text
        .split(/\n{2,}/)
        .filter(b => b.trim())
        .map(b => ({
          type: 'text' as const,
          lines: [{ spans: [{ text: b.trim() }] }],
        })),
    }))
  }

  onProgress?.(85)

  const body = bodyFontSize(pages)
  const children = pagesToParagraphs(pages, body)
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
