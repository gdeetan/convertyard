import { loadTransformersModel, recognizeHandwritingOcr } from '@/lib/converters/transformers-client'

interface OcrRegions {
  quad_boxes: number[][]
  labels: string[]
}

// Sort regions into reading order (top → bottom, left → right within similar rows).
// Florence-2 quad_boxes: [x0,y0, x1,y1, x2,y2, x3,y3] (clockwise from top-left).
// Uses y0 (index 1) as the primary sort key.
function sortRegionsToReadingOrder(regions: OcrRegions): string[] {
  if (!regions.labels.length) return []

  const items = regions.labels.map((label, i) => {
    const box = regions.quad_boxes[i] ?? []
    return { label, topY: box[1] ?? 0, leftX: box[0] ?? 0 }
  })

  items.sort((a, b) => a.topY - b.topY || a.leftX - b.leftX)
  return items.map(r => r.label)
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
    if (!regions.labels?.length) return ''

    // If regions have no bounding boxes (plain <OCR> fallback path), join as-is
    if (!regions.quad_boxes?.length) {
      return regions.labels.join('\n')
    }

    return sortRegionsToReadingOrder(regions).join('\n')
  } catch {
    // JSON parse failed — treat raw as plain text
    return raw.trim()
  }
}
