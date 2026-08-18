import type { CaptionStyleId } from './caption-types'

/** Design space the font-size slider is authored in (1080p frame). */
export const CAPTION_DESIGN_HEIGHT = 1080

export function captionScale(videoHeight: number): number {
  return (videoHeight || CAPTION_DESIGN_HEIGHT) / CAPTION_DESIGN_HEIGHT
}

/** Font size in video pixels — preview canvas and ASS Fontsize use this. */
export function captionFontSizePx(fontSize: number, videoHeight: number): number {
  return Math.max(1, Math.round(fontSize * captionScale(videoHeight)))
}

/**
 * Outline in video pixels. Netflix BorderStyle=3 uses this as box padding.
 * Preview canvas stroke uses 2× this value (centered stroke = this many px outside).
 */
export function captionOutlinePx(
  styleId: CaptionStyleId,
  outlineWidth: number,
  videoHeight: number,
): number {
  const raw = styleId === 'netflix' ? 10 : outlineWidth
  return Math.max(0, Math.round(raw * captionScale(videoHeight)))
}

/** Distance from the top/bottom edge in video pixels. Center uses 0. */
export function captionMarginVPx(
  position: 'top' | 'center' | 'bottom',
  videoHeight: number,
): number {
  if (position === 'center') return 0
  return Math.max(0, Math.round(40 * captionScale(videoHeight)))
}

export function captionAlignment(position: 'top' | 'center' | 'bottom'): number {
  return position === 'top' ? 8 : position === 'center' ? 5 : 2
}

/** Follow (karaoke) spoken word vs the rest of the line. */
export const FOLLOW_ACTIVE_WORD_SCALE = 1.12

export function followActiveWordScalePercent(): number {
  return Math.round(FOLLOW_ACTIVE_WORD_SCALE * 100)
}
