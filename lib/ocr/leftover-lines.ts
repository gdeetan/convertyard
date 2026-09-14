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

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/** Keep caption-shaped leftovers; drop full-width ruled lines under the paragraph. */
function captionShapedLeftovers(leftover: LineBox[], allLines: LineBox[]): LineBox[] {
  if (leftover.length === 0) return []
  const leftoverKeys = new Set(leftover.map(l => `${l.x},${l.y},${l.w},${l.h}`))
  const main = allLines.filter(l => !leftoverKeys.has(`${l.x},${l.y},${l.w},${l.h}`))
  if (main.length === 0) return leftover

  const medianW = median(main.map(l => l.w))
  const medianX = median(main.map(l => l.x))
  const captionLike = leftover.filter(l =>
    l.w < medianW * 0.78 ||
    l.x > medianX + Math.max(16, medianW * 0.08),
  )
  if (captionLike.length === 0) return []
  if (leftover.length >= 3 && captionLike.length / leftover.length < 0.5) return []
  return captionLike
}

export function leftoverLineBoxes(
  lines: LineBox[],
  florenceQuads: number[][] | null,
  imageHeight: number,
): LineBox[] {
  if (lines.length === 0) return []

  let leftover: LineBox[]
  if (florenceQuads && florenceQuads.length > 0) {
    const lastBottom = Math.max(...florenceQuads.map(quadBottom), 0)
    if (lastBottom >= imageHeight * 0.92) return []
    leftover = lines.filter(line => line.y >= lastBottom - 2)
  } else {
    leftover = boxesAfterGap(lines)
  }

  return captionShapedLeftovers(leftover, lines)
}

/** Strip under the last Florence box — captions in lighter ink that line-detect missed. */
export function belowBlockBox(
  florenceQuads: number[][] | null,
  imageWidth: number,
  imageHeight: number,
): LineBox | null {
  if (!florenceQuads?.length || imageWidth < 8 || imageHeight < 8) return null
  const lastBottom = Math.max(...florenceQuads.map(quadBottom), 0)
  if (lastBottom >= imageHeight * 0.88) return null
  const y = Math.min(imageHeight - 24, lastBottom + 6)
  const h = Math.min(imageHeight - y, Math.max(56, Math.min(96, Math.round(imageHeight * 0.14))))
  if (h < 28) return null
  return { x: 0, y, w: imageWidth, h }
}

export function leftoverTextNotInBody(body: string, extra: string): string {
  const bodyNorm = body.toLowerCase().replace(/\s+/g, ' ').trim()
  const lines = extra.split('\n').map(l => l.trim()).filter(Boolean)
  const kept = lines.filter(line => {
    const n = line.toLowerCase().replace(/\s+/g, ' ')
    if (n.length < 2) return false
    if (n.split(/\s+/).length > 6) return false
    return !bodyNorm.includes(n)
  })
  return kept.join('\n')
}

function quadLeft(quad: number[]): number {
  const xs = [quad[0], quad[2], quad[4], quad[6]].filter((v): v is number => typeof v === 'number')
  return xs.length ? Math.min(...xs) : 0
}

function quadRight(quad: number[]): number {
  const xs = [quad[0], quad[2], quad[4], quad[6]].filter((v): v is number => typeof v === 'number')
  return xs.length ? Math.max(...xs) : 0
}

function verticalOverlap(line: LineBox, quad: number[]): number {
  const qTop = Math.min(quad[1], quad[3], quad[5], quad[7])
  const qBot = Math.max(quad[1], quad[3], quad[5], quad[7])
  return Math.min(line.y + line.h, qBot) - Math.max(line.y, qTop)
}

export function rightRemainderBoxes(
  lines: LineBox[],
  florenceQuads: number[][] | null,
): LineBox[] {
  if (!florenceQuads?.length || lines.length === 0) return []
  const out: LineBox[] = []
  for (const line of lines) {
    const overlapping = florenceQuads.filter(q => verticalOverlap(line, q) >= line.h * 0.25)
    if (overlapping.length === 0) continue
    const florenceRight = Math.max(...overlapping.map(quadRight))
    const lineRight = line.x + line.w
    const extra = lineRight - florenceRight
    if (extra < 24 || extra < line.w * 0.12) continue
    out.push({ x: florenceRight, y: line.y, w: extra, h: line.h })
  }
  return out
}

export function leftRemainderBoxes(
  lines: LineBox[],
  florenceQuads: number[][] | null,
): LineBox[] {
  if (!florenceQuads?.length || lines.length === 0) return []
  const out: LineBox[] = []
  for (const line of lines) {
    const overlapping = florenceQuads.filter(q => verticalOverlap(line, q) >= line.h * 0.25)
    if (overlapping.length === 0) continue
    const florenceLeft = Math.min(...overlapping.map(quadLeft))
    const extra = florenceLeft - line.x
    if (extra < 16) continue
    out.push({ x: line.x, y: line.y, w: extra, h: line.h })
  }
  return out
}

/** Join extra onto a truncated line without duplicating overlap ("w"+"orse" → "worse"). */
export function stitchRemainder(existing: string, extra: string, side: 'left' | 'right'): string {
  const line = existing.trim()
  const add = extra.trim()
  if (!add) return existing
  if (!line) return add

  const a = side === 'left' ? add : line
  const b = side === 'left' ? line : add
  const aNorm = a.toLowerCase()
  const bNorm = b.toLowerCase()
  const maxK = Math.min(a.length, b.length)
  for (let k = maxK; k > 0; k--) {
    if (aNorm.slice(-k) === bNorm.slice(0, k)) {
      return `${a}${b.slice(k)}`
    }
  }
  if (side === 'left' && add.length <= 2 && /^[a-zA-Z]+$/.test(add) && /^[a-zA-Z]/.test(line)) {
    return `${add}${line}`
  }
  return side === 'left' ? `${add} ${line}` : `${line} ${add}`
}

export function attachRemainderToOverlappingRow(
  body: string,
  rows: Array<{ y0: number; y1: number }>,
  box: LineBox,
  extra: string,
  side: 'left' | 'right',
): string {
  const add = extra.trim()
  if (!add) return body
  const addNorm = add.toLowerCase().replace(/\s+/g, ' ')
  if (addNorm.split(/\s+/).length > 6) return body

  const boxMid = box.y + box.h / 2
  let best = -1
  let bestOverlap = 0
  for (let i = 0; i < rows.length; i++) {
    const overlap = Math.min(box.y + box.h, rows[i].y1) - Math.max(box.y, rows[i].y0)
    if (overlap > bestOverlap || (overlap === bestOverlap && boxMid >= rows[i].y0 && boxMid <= rows[i].y1)) {
      if (overlap > 0) {
        bestOverlap = overlap
        best = i
      }
    }
  }
  if (best < 0) return body

  const lines = body.split('\n')
  let visual = 0
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue
    if (visual === best) {
      const lineNorm = lines[i].toLowerCase().replace(/\s+/g, ' ')
      if (lineNorm.includes(addNorm)) return body
      lines[i] = stitchRemainder(lines[i], add, side)
      return lines.join('\n')
    }
    visual++
  }
  return body
}

export function appendRemainderToOverlappingRow(
  body: string,
  rows: Array<{ y0: number; y1: number }>,
  box: LineBox,
  extra: string,
): string {
  return attachRemainderToOverlappingRow(body, rows, box, extra, 'right')
}

export function insertTextAtY(
  body: string,
  rows: Array<{ y0: number; y1: number }>,
  y: number,
  extra: string,
): string {
  const add = extra.trim()
  if (!add) return body
  const lines = body.split('\n')
  let insertAt = lines.length
  let visual = 0
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue
    const row = rows[visual]
    visual++
    if (row && row.y0 > y) {
      insertAt = i
      break
    }
  }
  lines.splice(insertAt, 0, add)
  return lines.join('\n')
}

const SHORT_OK = new Set([
  'a', 'i', 'of', 'to', 'be', 'no', 'we', 'me', 'it', 'is', 'or', 'an', 'at',
  'on', 'in', 'so', 'if', 'as', 'do', 'go', 'up', 'by', 'my', 'he', 'us', 'am',
])

export function looksLeftTruncated(line: string): boolean {
  const t = line.trim()
  return t.length > 0 && /^[a-z]/.test(t)
}

export function looksRightTruncated(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  const last = (t.split(/\s+/).pop() ?? '').replace(/[^a-zA-Z]/g, '').toLowerCase()
  if (last.length === 0) return false
  if (last.length <= 2 && !SHORT_OK.has(last)) return true
  return false
}

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
}

export function mergeTruncatedLine(florenceLine: string, trocrLine: string): string {
  const f = florenceLine.replace(/\s+/g, ' ').trim()
  const t = trocrLine.replace(/\s+/g, ' ').trim()
  if (!t) return florenceLine
  const fN = f.toLowerCase()
  const tN = t.toLowerCase()
  // Only replace a whole Florence line when TrOCR clearly contains it.
  // A 50% token overlap let worse TrOCR overwrite a good Florence read.
  if (tN.includes(fN) && t.length > f.length) return t
  const fCompact = fN.replace(/\s+/g, '')
  const tCompact = tN.replace(/\s+/g, '')
  if (tCompact.includes(fCompact) && t.length > f.length) return t
  return florenceLine
}

export function overlappingLineBox(
  lines: LineBox[],
  row: { y0: number; y1: number },
): LineBox | null {
  let best: LineBox | null = null
  let bestOverlap = 0
  const rowH = Math.max(1, row.y1 - row.y0)
  for (const line of lines) {
    const overlap = Math.min(line.y + line.h, row.y1) - Math.max(line.y, row.y0)
    if (overlap > bestOverlap && overlap >= Math.min(line.h, rowH) * 0.25) {
      bestOverlap = overlap
      best = line
    }
  }
  return best
}

export function replaceOverlappingRowText(
  body: string,
  rows: Array<{ y0: number; y1: number }>,
  row: { y0: number; y1: number },
  next: string,
): string {
  const add = next.trim()
  if (!add) return body
  let best = -1
  let bestOverlap = 0
  for (let i = 0; i < rows.length; i++) {
    const overlap = Math.min(row.y1, rows[i].y1) - Math.max(row.y0, rows[i].y0)
    if (overlap > bestOverlap) {
      bestOverlap = overlap
      best = i
    }
  }
  if (best < 0) return body
  const lines = body.split('\n')
  let visual = 0
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i]) continue
    if (visual === best) {
      lines[i] = add
      return lines.join('\n')
    }
    visual++
  }
  return body
}
