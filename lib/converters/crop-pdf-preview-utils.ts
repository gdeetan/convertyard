import type { ToolOptions } from '@/lib/types'

export const MM_TO_PT = 72 / 25.4

export interface CropMarginsMm {
  topMm: number
  rightMm: number
  bottomMm: number
  leftMm: number
}

export interface CropOverlayPct {
  topPct: number
  rightPct: number
  bottomPct: number
  leftPct: number
}

export function resolveCropMargins(options: ToolOptions): CropMarginsMm {
  const preset = (options.preset as string) ?? '10mm'
  if (preset === 'custom') {
    return {
      topMm:    typeof options.topMm    === 'number' ? options.topMm    : 10,
      rightMm:  typeof options.rightMm  === 'number' ? options.rightMm  : 10,
      bottomMm: typeof options.bottomMm === 'number' ? options.bottomMm : 10,
      leftMm:   typeof options.leftMm   === 'number' ? options.leftMm   : 10,
    }
  }
  const mm = parseFloat(preset)
  const value = isNaN(mm) ? 10 : mm
  return { topMm: value, rightMm: value, bottomMm: value, leftMm: value }
}

export function calcOverlayPct(
  margins: CropMarginsMm,
  pageWidthPt: number,
  pageHeightPt: number
): CropOverlayPct {
  if (pageWidthPt === 0 || pageHeightPt === 0) {
    return { topPct: 0, rightPct: 0, bottomPct: 0, leftPct: 0 }
  }
  return {
    topPct:    (margins.topMm    * MM_TO_PT) / pageHeightPt * 100,
    rightPct:  (margins.rightMm  * MM_TO_PT) / pageWidthPt  * 100,
    bottomPct: (margins.bottomMm * MM_TO_PT) / pageHeightPt * 100,
    leftPct:   (margins.leftMm   * MM_TO_PT) / pageWidthPt  * 100,
  }
}
