import { detectLines, type LineBox } from './line-detector'

export interface AiRouteStats {
  lineCount: number
  avgWidthRatio: number
  medianWidthRatio: number
  maxWidthRatio: number
  avgHeightPx: number
}

export type AiPrimaryRoute = 'florence' | 'trocr'

function median(nums: number[]): number {
  if (!nums.length) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

export function summarizeLineBoxes(lineBoxes: LineBox[], imageWidth: number): AiRouteStats {
  const widthRatios = lineBoxes.map(line => line.w / Math.max(1, imageWidth))
  const heights = lineBoxes.map(line => line.h)
  return {
    lineCount: lineBoxes.length,
    avgWidthRatio: widthRatios.length ? widthRatios.reduce((sum, n) => sum + n, 0) / widthRatios.length : 0,
    medianWidthRatio: median(widthRatios),
    maxWidthRatio: widthRatios.length ? Math.max(...widthRatios) : 0,
    avgHeightPx: heights.length ? heights.reduce((sum, n) => sum + n, 0) / heights.length : 0,
  }
}

export function choosePrimaryAiRoute(style: string, stats: AiRouteStats): AiPrimaryRoute {
  if (style === 'print') return 'florence'

  const lineRich = stats.lineCount >= 4
  const broadLines = stats.avgWidthRatio >= 0.5 && stats.medianWidthRatio >= 0.55
  const notHeadlineLike = stats.avgHeightPx >= 45

  if (style === 'cursive' && stats.lineCount >= 3 && stats.avgWidthRatio >= 0.45) {
    return 'trocr'
  }

  if (style === 'mixed' && lineRich && broadLines && notHeadlineLike) {
    return 'trocr'
  }

  return 'florence'
}

async function getImageWidth(blob: Blob): Promise<number> {
  const bmp = await createImageBitmap(blob)
  const width = bmp.width
  bmp.close()
  return width
}

export async function decidePrimaryAiRoute(
  style: string,
  binaryBlob: Blob,
): Promise<{ route: AiPrimaryRoute; lineBoxes: LineBox[]; stats: AiRouteStats }> {
  const [lineBoxes, imageWidth] = await Promise.all([
    detectLines(binaryBlob),
    getImageWidth(binaryBlob),
  ])
  const stats = summarizeLineBoxes(lineBoxes, imageWidth)
  return {
    route: choosePrimaryAiRoute(style, stats),
    lineBoxes,
    stats,
  }
}
