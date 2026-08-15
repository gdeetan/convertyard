import { describe, it, expect } from 'vitest'
import { buildASS, hexToASS, toASSTime, groupWordsIntoLines } from '../caption-ass-builder'
import type { WordChunk } from '../caption-types'
import { DEFAULT_CAPTION_OPTIONS, STYLE_PRESETS } from '../caption-types'

const words: WordChunk[] = [
  { text: 'Hello', start: 0.0, end: 0.4 },
  { text: 'world', start: 0.4, end: 0.8 },
  { text: 'this',  start: 0.8, end: 1.0 },
  { text: 'is',    start: 1.0, end: 1.2 },
  { text: 'a',     start: 1.2, end: 1.3 },
  { text: 'test',  start: 1.3, end: 1.8 },
]

describe('hexToASS', () => {
  it('converts white hex to ASS BGR', () => {
    expect(hexToASS('#FFFFFF')).toBe('&H00FFFFFF')
  })
  it('converts yellow #FFFF00 to ASS BGR &H0000FFFF', () => {
    expect(hexToASS('#FFFF00')).toBe('&H0000FFFF')
  })
  it('converts black', () => {
    expect(hexToASS('#000000')).toBe('&H00000000')
  })
})

describe('toASSTime', () => {
  it('formats 0 correctly', () => {
    expect(toASSTime(0)).toBe('0:00:00.00')
  })
  it('formats 61.5 seconds', () => {
    expect(toASSTime(61.5)).toBe('0:01:01.50')
  })
  it('formats 3661 seconds', () => {
    expect(toASSTime(3661)).toBe('1:01:01.00')
  })
})

describe('groupWordsIntoLines', () => {
  it('groups short words into one line when under limit', () => {
    const groups = groupWordsIntoLines(words, 8, 3)
    expect(groups.length).toBe(1)
    expect(groups[0].map(w => w.text)).toEqual(['Hello','world','this','is','a','test'])
  })
  it('splits at maxWords boundary', () => {
    const groups = groupWordsIntoLines(words, 3, 999)
    expect(groups.length).toBe(2)
    expect(groups[0].length).toBe(3)
    expect(groups[1].length).toBe(3)
  })
})

describe('buildASS - mrbeast', () => {
  it('produces one Dialogue line per word', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'mrbeast' })
    const dialogueLines = ass.split('\n').filter(l => l.startsWith('Dialogue:'))
    expect(dialogueLines.length).toBe(6)
  })
  it('each dialogue line contains the word text', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'mrbeast' })
    expect(ass).toContain('Hello')
    expect(ass).toContain('world')
  })
  it('includes ASS header sections', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'mrbeast' })
    expect(ass).toContain('[Script Info]')
    expect(ass).toContain('[V4+ Styles]')
    expect(ass).toContain('[Events]')
  })
})

describe('buildASS - netflix', () => {
  it('produces fewer lines than words (grouped)', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'netflix' })
    const dialogueLines = ass.split('\n').filter(l => l.startsWith('Dialogue:'))
    expect(dialogueLines.length).toBeLessThan(6)
  })
})

describe('buildASS - uppercase', () => {
  it('uppercases text when option is true', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'classic', uppercase: true })
    expect(ass).toContain('HELLO')
    expect(ass).not.toContain('Hello')
  })
})

function styleOutline(ass: string): string {
  const line = ass.split('\n').find((l) => l.startsWith('Style: Default,'))
  if (!line) throw new Error('missing style line')
  // Name, Fontname, Fontsize, Primary, Secondary, OutlineColour, Back, Bold,
  // Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline
  return line.split(',')[16]
}

function styleAlignment(ass: string): string {
  const line = ass.split('\n').find((l) => l.startsWith('Style: Default,'))
  if (!line) throw new Error('missing style line')
  return line.split(',')[18]
}

describe('buildASS - outline and position match options', () => {
  it('uses the outlineWidth slider for stroke styles', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'mrbeast', outlineWidth: 8 })
    expect(styleOutline(ass)).toBe('8')
  })

  it('does not let the slider override Netflix box padding', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'netflix', outlineWidth: 0 })
    expect(styleOutline(ass)).toBe('10')
  })

  it('centers Mr. Beast / TikTok when position is center', () => {
    const ass = buildASS(words, { ...DEFAULT_CAPTION_OPTIONS, styleId: 'tiktok', position: 'center' })
    expect(styleAlignment(ass)).toBe('5')
  })

  it('applies TikTok preset as all-caps, centered, heavy outline', () => {
    expect(STYLE_PRESETS.tiktok).toEqual({ position: 'center', uppercase: true, outlineWidth: 6 })
    expect(DEFAULT_CAPTION_OPTIONS.position).toBe('center')
  })
})
