export interface LineBox {
  x: number
  y: number
  w: number
  h: number
}

function quadBottom(quad: number[]): number {
  const ys = [quad[1], quad[3], quad[5], quad[7]].filter((v): v is number => typeof v === 'number')
  return ys.length ? Math.max(...ys) : 0
}

function boxesAfterGap(lines: LineBox[]): LineBox[] {
  if (lines.length < 2) return []
  const sorted = [...lines].sort((a, b) => a.y - b.y)
  const heights = sorted.map(l => l.h).sort((a, b) => a - b)
  const medianH = heights[Math.floor(heights.length / 2)] || 1
  const gaps: number[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    gaps.push(sorted[i + 1].y - (sorted[i].y + sorted[i].h))
  }
  const sortedGaps = [...gaps].sort((a, b) => a - b)
  const medianGap = sortedGaps[Math.floor(sortedGaps.length / 2)] ?? 0
  const splitAt = Math.max(medianH * 1.5, medianGap * 2.5, 16)
  let lastSplit = -1
  for (let i = 0; i < gaps.length; i++) {
    if (gaps[i] >= splitAt) lastSplit = i
  }
  if (lastSplit < 0) return []
  const lower = sorted.slice(lastSplit + 1)
  const upper = sorted.slice(0, lastSplit + 1)
  // Caption / attribution is the smaller block under the main text.
  if (lower.length === 0 || lower.length >= upper.length) return []
  return lower
}

export function leftoverLineBoxes(
  lines: LineBox[],
  florenceQuads: number[][] | null,
  imageHeight: number,
): LineBox[] {
  if (lines.length === 0) return []

  if (florenceQuads && florenceQuads.length > 0) {
    const lastBottom = Math.max(...florenceQuads.map(quadBottom), 0)
    if (lastBottom >= imageHeight * 0.92) return []
    return lines.filter(line => line.y >= lastBottom - 2)
  }

  return boxesAfterGap(lines)
}

export function leftoverTextNotInBody(body: string, extra: string): string {
  const bodyNorm = body.toLowerCase().replace(/\s+/g, ' ').trim()
  const lines = extra.split('\n').map(l => l.trim()).filter(Boolean)
  const kept = lines.filter(line => {
    const n = line.toLowerCase().replace(/\s+/g, ' ')
    if (n.length < 2) return false
    return !bodyNorm.includes(n)
  })
  return kept.join('\n')
}
