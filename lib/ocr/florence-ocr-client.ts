import { loadTransformersModel, recognizeHandwritingOcr } from '@/lib/converters/transformers-client'

export interface OcrRegions {
  quad_boxes: number[][]
  labels: string[]
}

interface RegionItem {
  label: string
  topY: number
  leftX: number
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

    return {
      label,
      topY,
      leftX,
      bottomY,
      height: Math.max(1, bottomY - topY),
    }
  })
}

// Sort regions into reading order with simple row clustering.
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

    const avgTop = row.reduce((sum, curr) => sum + curr.topY, 0) / row.length
    const avgHeight = row.reduce((sum, curr) => sum + curr.height, 0) / row.length
    const sameRowThreshold = Math.max(12, avgHeight * 0.65)

    if (Math.abs(item.topY - avgTop) <= sameRowThreshold) {
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

export function buildFlorenceReadingText(regions: OcrRegions): string {
  if (!regions.labels?.length) return ''
  if (!regions.quad_boxes?.length) return normalizeOcrText(regions.labels.join('\n'))
  return normalizeOcrText(sortRegionsToReadingOrder(regions).join('\n'))
}

export async function recognizeWithFlorenceOcr(
  blob: Blob,
  filename: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  await loadTransformersModel('ocr', onProgress ?? (() => {}))

  const file = new File([blob], filename, { type: blob.type || 'image/png' })
  const raw = await recognizeHandwritingOcr(file, onProgress)

  if (!raw) return ''

  try {
    const regions: OcrRegions = JSON.parse(raw)
    return buildFlorenceReadingText(regions)
  } catch {
    // JSON parse failed — treat raw as plain text
    return normalizeOcrText(raw.trim())
  }
}
