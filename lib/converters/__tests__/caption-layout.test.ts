import { describe, expect, it } from 'vitest'
import {
  captionFontSizePx,
  captionOutlinePx,
  captionMarginVPx,
  captionAlignment,
} from '../caption-layout'
import { buildASS } from '../caption-ass-builder'
import { DEFAULT_CAPTION_OPTIONS } from '../caption-types'

function styleField(ass: string, index: number): string {
  const line = ass.split('\n').find((l) => l.startsWith('Style: Default,'))
  if (!line) throw new Error('missing style line')
  return line.split(',')[index]
}

describe('caption layout is shared between preview and burn', () => {
  it('keeps 80px at 1080p and scales with frame height', () => {
    expect(captionFontSizePx(80, 1080)).toBe(80)
    expect(captionFontSizePx(80, 2160)).toBe(160)
    expect(captionFontSizePx(80, 720)).toBe(53)
  })

  it('scales outline and margin with the same 1080p design space', () => {
    expect(captionOutlinePx('mrbeast', 4, 1080)).toBe(4)
    expect(captionOutlinePx('mrbeast', 4, 2160)).toBe(8)
    expect(captionOutlinePx('netflix', 0, 1080)).toBe(10)
    expect(captionMarginVPx('bottom', 1080)).toBe(40)
    expect(captionMarginVPx('bottom', 2160)).toBe(80)
    expect(captionMarginVPx('center', 1080)).toBe(0)
    expect(captionAlignment('center')).toBe(5)
  })

  it('writes those pixel values into the ASS style at any resolution', () => {
    const ass = buildASS(
      [{ text: 'Hello', start: 0, end: 1 }],
      { ...DEFAULT_CAPTION_OPTIONS, styleId: 'mrbeast', fontSize: 80, outlineWidth: 4, position: 'bottom' },
      'Komika Axis',
      1280,
      720,
    )
    expect(styleField(ass, 2)).toBe('53')   // Fontsize
    expect(styleField(ass, 16)).toBe('3')   // Outline 4 * 720/1080
    expect(styleField(ass, 19)).toBe('0')   // MarginL
    expect(styleField(ass, 21)).toBe('27')  // MarginV 40 * 720/1080
    expect(ass).toContain('PlayResX: 1280')
    expect(ass).toContain('PlayResY: 720')
    expect(ass).toContain('LayoutResX: 1280')
    expect(ass).toContain('ScaledBorderAndShadow: yes')
  })
})
