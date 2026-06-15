import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
  Table, TableRow, TableCell, WidthType,
} from 'docx'
import { extractStructuredText, getPageCount, renderPage } from './mupdf-client'

// ── mupdf structured-text JSON types ─────────────────────────────────────────

type Bbox = [number, number, number, number] // [x1, y1, x2, y2]

interface StChar { c: number }

interface StSpan {
  font?: { name?: string; weight?: string; style?: string }
  size?: number
  color?: number
  bbox?: Bbox
  origin?: [number, number]
  chars?: StChar[]
  text?: string
}

interface StLine {
  bbox?: Bbox
  spans?: StSpan[]
}

interface StBlock {
  type?: string | number  // "text" | "image" | 0 | 1
  bbox?: Bbox
  lines?: StLine[]
}

interface StPage {
  blocks?: StBlock[]
}

export type StBlockPublic = StBlock

// Exported for testing only
export function clusterValues(values: number[], tolerance: number): number[][] {
  if (values.length === 0) return []
  const sorted = [...values].sort((a, b) => a - b)
  const clusters: number[][] = [[sorted[0]]]
  for (let i = 1; i < sorted.length; i++) {
    const last = clusters[clusters.length - 1]
    if (sorted[i] - last[last.length - 1] <= tolerance) {
      last.push(sorted[i])
    } else {
      clusters.push([sorted[i]])
    }
  }
  return clusters
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

// ── Table detection ──────────────────────────────────────────────────────────

interface DetectedTable {
  consumedIndices: Set<number>
  rows: number
  cols: number
  table: Table
}

const COL_TOLERANCE = 10
const ROW_TOLERANCE = 8

export function detectTables(blocks: StBlock[]): DetectedTable[] {
  // Work only with text blocks that have bboxes
  const indexed = blocks
    .map((b, i) => ({ block: b, index: i }))
    .filter(({ block }) => isTextBlock(block) && block.bbox != null)

  if (indexed.length < 3) return []

  // Cluster x1 values into column anchors
  const x1Values = indexed.map(({ block }) => block.bbox![0])
  const colClusters = clusterValues(x1Values, COL_TOLERANCE)

  // Keep clusters with ≥2 blocks (so lone outliers aren't columns)
  const colAnchors = colClusters
    .filter(cluster => cluster.length >= 2)
    .map(cluster => cluster[Math.floor(cluster.length / 2)])

  if (colAnchors.length < 2) return []

  function assignCol(x1: number): number | null {
    for (let c = 0; c < colAnchors.length; c++) {
      if (Math.abs(x1 - colAnchors[c]) <= COL_TOLERANCE) return c
    }
    return null
  }

  // Cluster y1 values into row anchors
  const y1Values = indexed.map(({ block }) => block.bbox![1])
  const rowClusters = clusterValues(y1Values, ROW_TOLERANCE)
  const rowAnchors = rowClusters
    .filter(cluster => cluster.length >= 2)
    .map(cluster => cluster[Math.floor(cluster.length / 2)])

  if (rowAnchors.length < 2) return []

  function assignRow(y1: number): number | null {
    for (let r = 0; r < rowAnchors.length; r++) {
      if (Math.abs(y1 - rowAnchors[r]) <= ROW_TOLERANCE) return r
    }
    return null
  }

  // Build grid: grid[rowIdx][colIdx] = text
  const grid: Record<number, Record<number, string>> = {}
  const consumedIndices = new Set<number>()

  for (const { block, index } of indexed) {
    const col = assignCol(block.bbox![0])
    const row = assignRow(block.bbox![1])
    if (col === null || row === null) continue
    if (!grid[row]) grid[row] = {}
    const allSpans = (block.lines ?? []).flatMap(l => l.spans ?? [])
    const text = allSpans.map(spanText).join('').trim()
    grid[row][col] = (grid[row][col] ? grid[row][col] + ' ' : '') + text
    consumedIndices.add(index)
  }

  const rowCount = Object.keys(grid).length
  const colCount = colAnchors.length

  // Conservative threshold: 3+ cols OR (2+ cols AND 3+ rows)
  if (!(colCount >= 3 || (colCount >= 2 && rowCount >= 3))) return []
  if (rowCount < 2) return []

  const sortedRows = Object.keys(grid).map(Number).sort((a, b) => a - b)

  const tableRows = sortedRows.map(r =>
    new TableRow({
      children: colAnchors.map((_, c) =>
        new TableCell({
          width: { size: Math.floor(100 / colCount), type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun(grid[r]?.[c] ?? '')] })],
        })
      ),
    })
  )

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  })

  return [{ consumedIndices, rows: rowCount, cols: colCount, table }]
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

// Exported for testing only
export function detectHeadingLevel(
  block: StBlock,
  body: number,
  pageWidth: number
): typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2 | typeof HeadingLevel.HEADING_3 | null {
  const allSpans = (block.lines ?? []).flatMap(l => l.spans ?? [])
  const text = allSpans.map(spanText).join(' ').trim()
  const wordCount = text.split(/\s+/).filter(Boolean).length

  // Hard exclusion: more than 20 words can't be a heading
  if (wordCount > 20) return null

  // Dominant font size across spans
  const sizes = allSpans.filter(s => s.size).map(s => s.size as number)
  const sizeFreq: Record<number, number> = {}
  for (const s of sizes) { const r = Math.round(s); sizeFreq[r] = (sizeFreq[r] ?? 0) + 1 }
  const dominantSize = sizes.length > 0
    ? Number(Object.entries(sizeFreq).sort((a, b) => b[1] - a[1])[0][0])
    : body
  const ratio = dominantSize / body

  // Size-based levels (primary signal)
  if (ratio >= 1.8) return HeadingLevel.HEADING_1
  if (ratio >= 1.35) return HeadingLevel.HEADING_2
  if (ratio >= 1.15) return HeadingLevel.HEADING_3

  // Body-size heading candidates — require shortness + at least one secondary signal
  if (wordCount > 12) return null

  const bbox = block.bbox
  const isCentered = bbox
    ? Math.abs(((bbox[0] + bbox[2]) / 2) - pageWidth / 2) < pageWidth * 0.1
    : false

  const isAllCaps = /[A-Z]/.test(text) && text === text.toUpperCase()

  const dominantSpan = allSpans.find(s => s.size && Math.round(s.size) === dominantSize)
  const isBoldBlock = dominantSpan ? isBold(dominantSpan) : false

  const signals = [isCentered, isAllCaps, isBoldBlock && wordCount <= 8].filter(Boolean).length

  if (signals >= 1) return HeadingLevel.HEADING_3

  return null
}

// ── Block → docx Paragraph ───────────────────────────────────────────────────

function blockToParagraph(
  block: StBlock,
  body: number,
  level: ReturnType<typeof detectHeadingLevel> = null
): Paragraph | null {
  const allSpans = (block.lines ?? []).flatMap(l => l.spans ?? [])
  const text = allSpans.map(spanText).join('').trim()
  if (!text) return null

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

function estimatePageWidth(page: StPage): number {
  let maxX2 = 0
  for (const block of page.blocks ?? []) {
    if (block.bbox && block.bbox[2] > maxX2) maxX2 = block.bbox[2]
  }
  return maxX2 || 612 // US Letter fallback
}

function pagesToParagraphs(pages: StPage[], body: number): Paragraph[] {
  const out: Paragraph[] = []

  for (let p = 0; p < pages.length; p++) {
    if (p > 0) {
      out.push(new Paragraph({ pageBreakBefore: true, children: [] }))
    }
    const pageWidth = estimatePageWidth(pages[p])
    for (const block of pages[p].blocks ?? []) {
      if (!isTextBlock(block)) continue
      const level = detectHeadingLevel(block, body, pageWidth)
      const para = blockToParagraph(block, body, level)
      if (para) out.push(para)
    }
  }

  return out.length > 0 ? out : [new Paragraph({ children: [new TextRun('')] })]
}

// ── JPEG dimensions from raw bytes ───────────────────────────────────────────

function jpegDimensions(data: ArrayBuffer): { width: number; height: number } {
  const view = new DataView(data)
  let offset = 2 // skip SOI marker
  while (offset < view.byteLength - 4) {
    const marker = view.getUint16(offset)
    const segLen = view.getUint16(offset + 2)
    // SOF markers: 0xFFC0–0xFFC3, 0xFFC5–0xFFC7, 0xFFC9–0xFFCB, 0xFFCD–0xFFCF
    if ((marker >= 0xffc0 && marker <= 0xffcf) && marker !== 0xffc4 && marker !== 0xffc8) {
      const height = view.getUint16(offset + 5)
      const width = view.getUint16(offset + 7)
      return { width, height }
    }
    offset += 2 + segLen
  }
  return { width: 595, height: 842 } // A4 fallback
}

// ── Page image paragraph ──────────────────────────────────────────────────────

async function pageImageParagraph(
  buffer: ArrayBuffer,
  pageIndex: number
): Promise<Paragraph> {
  const jpegBuffer = await renderPage(buffer, pageIndex, 96, 85)
  const { width: rawW, height: rawH } = jpegDimensions(jpegBuffer)
  // Scale to fit standard Word content width (468px at 96 DPI = 6.5 inch - 1 inch margins)
  const maxW = 468
  const scale = Math.min(1, maxW / rawW)
  const w = Math.round(rawW * scale)
  const h = Math.round(rawH * scale)
  return new Paragraph({
    children: [
      new ImageRun({
        type: 'jpg',
        data: jpegBuffer,
        transformation: { width: w, height: h },
      }),
    ],
  })
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

interface PdfToWordOptions {
  pageFrom?: number
  pageTo?: number
  includeImages?: boolean
}

export async function convertPdfToWord(
  file: File,
  onProgress?: (pct: number) => void,
  opts: PdfToWordOptions = {}
): Promise<File> {
  const pageFrom = typeof opts.pageFrom === 'number' ? Math.max(1, opts.pageFrom) : 1
  const pageToOpt = typeof opts.pageTo === 'number' ? opts.pageTo : 9999
  const includeImages = opts.includeImages !== false

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

  // Apply page range
  pages = pages.slice(pageFrom - 1, pageToOpt)
  const totalPages = pages.length

  onProgress?.(30)

  if (isScanned(pages)) {
    // OCR path for scanned/image-only PDFs
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng')
    const ocrTexts: string[] = []

    for (let p = 0; p < totalPages; p++) {
      const absolutePage = pageFrom - 1 + p
      const jpegBuffer = await renderPage(buffer, absolutePage, 150, 85)
      const blob = new Blob([jpegBuffer], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      try {
        const { data: { text } } = await worker.recognize(url)
        ocrTexts.push(text)
      } finally {
        URL.revokeObjectURL(url)
      }
      onProgress?.(Math.round(30 + ((p + 1) / totalPages) * 50))
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
  let children: Paragraph[]

  if (includeImages) {
    // Build page paragraphs interleaved with page screenshots
    children = []
    for (let p = 0; p < totalPages; p++) {
      if (p > 0) {
        children.push(new Paragraph({ pageBreakBefore: true, children: [] }))
      }
      // Embed page screenshot first
      try {
        const absolutePage = pageFrom - 1 + p
        children.push(await pageImageParagraph(buffer, absolutePage))
      } catch {
        // continue without image if render fails
      }
      // Then text blocks
      const pageWidth = estimatePageWidth(pages[p])
      for (const block of pages[p].blocks ?? []) {
        if (!isTextBlock(block)) continue
        const level = detectHeadingLevel(block, body, pageWidth)
        const para = blockToParagraph(block, body, level)
        if (para) children.push(para)
      }
    }
    if (children.length === 0) {
      children = [new Paragraph({ children: [new TextRun('')] })]
    }
  } else {
    children = pagesToParagraphs(pages, body)
  }

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
