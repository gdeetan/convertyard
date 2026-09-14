import { loadTransformersModel, recognizeHandwritingOcr } from '@/lib/converters/transformers-client'

export interface OcrRegions {
  quad_boxes: number[][]
  labels: string[]
}

interface RegionItem {
  label: string
  topY: number
  leftX: number
  rightX: number
  bottomY: number
  height: number
}

function normalizeLineText(line: string): string {
  return line
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .replace(/([(\[{])\s+/g, '$1')
    .replace(/\s+([)\]}])/g, '$1')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function normalizeOcrText(text: string): string {
  const normalizedLines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => normalizeLineText(line))

  const compact: string[] = []
  let blankRun = 0
  for (const line of normalizedLines) {
    if (!line) {
      blankRun++
      if (blankRun === 1 && compact.length > 0) compact.push('')
      continue
    }
    blankRun = 0
    compact.push(line)
  }

  while (compact[0] === '') compact.shift()
  while (compact[compact.length - 1] === '') compact.pop()

  return compact.join('\n')
}

function toRegionItems(regions: OcrRegions): RegionItem[] {
  return regions.labels.map((label, i) => {
    const box = regions.quad_boxes[i] ?? []
    const ys = [box[1], box[3], box[5], box[7]].filter((v): v is number => typeof v === 'number')
    const xs = [box[0], box[2], box[4], box[6]].filter((v): v is number => typeof v === 'number')
    const topY = ys.length ? Math.min(...ys) : 0
    const bottomY = ys.length ? Math.max(...ys) : topY
    const leftX = xs.length ? Math.min(...xs) : 0
    const rightX = xs.length ? Math.max(...xs) : leftX

    return {
      label,
      topY,
      leftX,
      rightX,
      bottomY,
      height: Math.max(1, bottomY - topY),
    }
  })
}

function isStackedFullWidthLine(item: RegionItem, row: RegionItem[]): boolean {
  const rowLeft = Math.min(...row.map(r => r.leftX))
  const rowRight = Math.max(...row.map(r => r.rightX))
  const rowWidth = Math.max(1, rowRight - rowLeft)
  const itemWidth = Math.max(1, item.rightX - item.leftX)
  const avgTop = row.reduce((sum, curr) => sum + curr.topY, 0) / row.length
  const avgHeight = row.reduce((sum, curr) => sum + curr.height, 0) / row.length
  const leftAligned = Math.abs(item.leftX - rowLeft) <= Math.max(24, rowWidth * 0.08)
  const bothWide = itemWidth >= rowWidth * 0.55 && rowWidth > 40
  const clearlyBelow = item.topY - avgTop >= avgHeight * 0.4
  return leftAligned && bothWide && clearlyBelow
}

function belongsToVisualRow(item: RegionItem, row: RegionItem[]): boolean {
  if (isStackedFullWidthLine(item, row)) return false

  const rowTop = Math.min(...row.map(r => r.topY))
  const rowBot = Math.max(...row.map(r => r.bottomY))
  const rowH = Math.max(1, rowBot - rowTop)
  const overlap = Math.min(item.bottomY, rowBot) - Math.max(item.topY, rowTop)
  if (overlap >= Math.min(item.height, rowH) * 0.25) return true

  const avgTop = row.reduce((sum, curr) => sum + curr.topY, 0) / row.length
  const avgHeight = row.reduce((sum, curr) => sum + curr.height, 0) / row.length
  return Math.abs(item.topY - avgTop) <= Math.max(12, avgHeight * 1.05)
}

// Sort regions into reading order. Cursive words on one written line often have
// wobbly tops — cluster by vertical overlap so output does not jump mid-line.
export function sortRegionsToReadingOrder(regions: OcrRegions): string[] {
  if (!regions.labels.length) return []

  const items = toRegionItems(regions).sort((a, b) => a.topY - b.topY || a.leftX - b.leftX)
  const rows: RegionItem[][] = []

  for (const item of items) {
    const row = rows[rows.length - 1]
    if (!row) {
      rows.push([item])
      continue
    }

    if (belongsToVisualRow(item, row)) {
      row.push(item)
    } else {
      rows.push([item])
    }
  }

  const out: string[] = []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].sort((a, b) => a.leftX - b.leftX)
    const rowText = normalizeLineText(row.map(item => item.label).join(' '))
    if (rowText) out.push(rowText)

    const next = rows[i + 1]
    if (!next) continue

    const rowBottom = Math.max(...row.map(item => item.bottomY))
    const nextTop = Math.min(...next.map(item => item.topY))
    const avgHeight = row.reduce((sum, curr) => sum + curr.height, 0) / row.length
    if ((nextTop - rowBottom) > Math.max(28, avgHeight * 1.6)) {
      out.push('')
    }
  }

  return out
}

export function florenceVisualRows(
  regions: OcrRegions,
): Array<{ text: string; y0: number; y1: number }> {
  if (!regions.labels.length || !regions.quad_boxes?.length) return []
  const items = toRegionItems(regions).sort((a, b) => a.topY - b.topY || a.leftX - b.leftX)
  const rows: RegionItem[][] = []
  for (const item of items) {
    const row = rows[rows.length - 1]
    if (!row) {
      rows.push([item])
      continue
    }
    if (belongsToVisualRow(item, row)) row.push(item)
    else rows.push([item])
  }
  return rows.map(row => ({
    text: normalizeLineText(row.map(item => item.label).join(' ')),
    y0: Math.min(...row.map(r => r.topY)),
    y1: Math.max(...row.map(r => r.bottomY)),
  })).filter(row => row.text)
}

export function buildFlorenceReadingText(regions: OcrRegions): string {
  if (!regions.labels?.length) return ''
  if (!regions.quad_boxes?.length) return normalizeOcrText(regions.labels.join('\n'))
  return normalizeOcrText(sortRegionsToReadingOrder(regions).join('\n'))
}

export interface FlorenceOcrResult {
  text: string
  quadBoxes: number[][]
  labels: string[]
}

export async function recognizeWithFlorenceOcr(
  blob: Blob,
  filename: string,
  onProgress?: (pct: number) => void
): Promise<FlorenceOcrResult> {
  await loadTransformersModel('ocr', onProgress ?? (() => {}))

  const file = new File([blob], filename, { type: blob.type || 'image/png' })
  const raw = await recognizeHandwritingOcr(file, onProgress)

  if (!raw) return { text: '', quadBoxes: [], labels: [] }

  try {
    const regions: OcrRegions = JSON.parse(raw)
    return {
      text: buildFlorenceReadingText(regions),
      quadBoxes: Array.isArray(regions.quad_boxes) ? regions.quad_boxes : [],
      labels: Array.isArray(regions.labels) ? regions.labels : [],
    }
  } catch {
    // JSON parse failed — treat raw as plain text
    return { text: normalizeOcrText(raw.trim()), quadBoxes: [], labels: [] }
  }
}
