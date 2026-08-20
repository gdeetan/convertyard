import type { WordChunk, CaptionOptions, CaptionStyleId } from './caption-types'
import {
  captionAlignment,
  captionFontSizePx,
  captionMarginVPx,
  captionOutlinePx,
  followActiveWordScalePercent,
} from './caption-layout'

/** Maximum words per subtitle line before wrapping */
const LINE_MAX_WORDS = 8
/** Maximum duration (seconds) per subtitle line before wrapping */
const LINE_MAX_DURATION_S = 3

/** Convert CSS hex color '#RRGGBB' → ASS color '&H00BBGGRR' */
export function hexToASS(hex: string): string {
  const r = hex.slice(1, 3)
  const g = hex.slice(3, 5)
  const b = hex.slice(5, 7)
  return `&H00${b}${g}${r}`.toUpperCase()
}

/** Convert seconds → ASS timestamp '0:00:00.00' */
export function toASSTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const sInt = Math.floor(sec)
  const cs = Math.round((sec - sInt) * 100)
  return `${h}:${String(m).padStart(2, '0')}:${String(sInt).padStart(2, '0')}.${String(cs).padStart(2, '0')}`
}

/** Group flat WordChunk[] into sub-arrays (one per subtitle line) */
export function groupWordsIntoLines(
  words: WordChunk[],
  maxWords: number,
  maxDuration: number,
): WordChunk[][] {
  const groups: WordChunk[][] = []
  let current: WordChunk[] = []
  let groupStart = words[0]?.start ?? 0

  for (const word of words) {
    const duration = word.end - groupStart
    if (current.length >= maxWords || (current.length > 0 && duration >= maxDuration)) {
      groups.push(current)
      current = []
      groupStart = word.start
    }
    current.push(word)
  }
  if (current.length > 0) groups.push(current)
  return groups
}

// Wrap word list into lines at maxChars, joined with ASS hard line-break \N.
function wrapToLines(wordTexts: string[], maxChars: number): string {
  if (maxChars <= 0) return wordTexts.join(' ')
  const lines: string[] = []
  let current = ''
  for (const word of wordTexts) {
    if (!current) {
      current = word
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.join('\\N')
}

interface ASSStyleConfig {
  bold: boolean
  alignment: number
  borderStyle: number
  outline: number
  shadow: number
  marginV: number
}

function styleConfig(
  id: CaptionStyleId,
  position: 'top' | 'center' | 'bottom',
  outlineWidth: number,
  videoHeight: number,
): ASSStyleConfig {
  const alignment = captionAlignment(position)
  const marginV = captionMarginVPx(position, videoHeight)
  const outline = captionOutlinePx(id, outlineWidth, videoHeight)
  switch (id) {
    // Netflix BorderStyle=3 uses Outline as box padding, not a stroke.
    case 'mrbeast': return { bold: true,  alignment, borderStyle: 1, outline, shadow: 0, marginV }
    case 'tiktok':  return { bold: true,  alignment, borderStyle: 1, outline, shadow: 0, marginV }
    case 'netflix': return { bold: false, alignment, borderStyle: 3, outline, shadow: 0, marginV }
    case 'classic': return { bold: false, alignment, borderStyle: 1, outline, shadow: 1, marginV }
    case 'karaoke': return { bold: false, alignment, borderStyle: 1, outline, shadow: 0, marginV }
  }
}

function buildHeader(
  opts: CaptionOptions,
  cfg: ASSStyleConfig,
  fontName: string,
  videoWidth: number,
  videoHeight: number,
): string {
  const primary   = hexToASS(opts.primaryColor)
  const highlight = hexToASS(opts.highlightColor)
  // libass BorderStyle=3 fills the box with OutlineColour. For Netflix, use
  // ~75% opaque black (alpha 0x40 in ASS's inverted alpha; 00=opaque, FF=clear)
  // so the pill matches the real Netflix look — solid enough to read against
  // any background but not a hard black rectangle.
  const outline   = opts.styleId === 'netflix' ? '&H40000000' : hexToASS(opts.outlineColor)
  const backColor = opts.styleId === 'netflix' ? '&H40000000' : '&H00000000'
  const bold = cfg.bold ? '-1' : '0'
  const assFS = captionFontSizePx(opts.fontSize, videoHeight)

  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    // PlayRes = LayoutRes = decoded frame size so libass does not rescale
    // font/outline/margins relative to the preview's pixel math.
    `PlayResX: ${videoWidth}`,
    `PlayResY: ${videoHeight}`,
    `LayoutResX: ${videoWidth}`,
    `LayoutResY: ${videoHeight}`,
    'ScaledBorderAndShadow: yes',
    'WrapStyle: 1',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,${fontName},${assFS},${primary},${highlight},${outline},${backColor},${bold},0,0,0,100,100,0,0,${cfg.borderStyle},${cfg.outline},${cfg.shadow},${cfg.alignment},0,0,${cfg.marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n')
}

function dialogue(start: number, end: number, text: string, layer = 0): string {
  return `Dialogue: ${layer},${toASSTime(start)},${toASSTime(end)},Default,,0,0,0,,${text}`
}

function wordByWordEvents(words: WordChunk[], opts: CaptionOptions): string[] {
  return words.map((w) => {
    const text = opts.uppercase ? w.text.toUpperCase() : w.text
    return dialogue(w.start, w.end, text)
  })
}

function groupedLineEvents(words: WordChunk[], opts: CaptionOptions): string[] {
  const maxWords = opts.maxCharsPerLine > 0
    ? Math.max(2, Math.floor(opts.maxCharsPerLine * 2 / 5))
    : LINE_MAX_WORDS
  const groups = groupWordsIntoLines(words, maxWords, LINE_MAX_DURATION_S)
  return groups.map((group) => {
    const start = group[0].start
    const end   = group[group.length - 1].end
    const wordTexts = group.map(w => opts.uppercase ? w.text.toUpperCase() : w.text)
    // Respect the user's maxCharsPerLine setting by wrapping with \N.
    const text = wrapToLines(wordTexts, opts.maxCharsPerLine)
    return dialogue(start, end, text)
  })
}

function karaokeEvents(words: WordChunk[], opts: CaptionOptions): string[] {
  // Limit group size to roughly maxCharsPerLine ÷ 7 chars/word so karaoke
  // lines don't overflow narrow screens.
  const maxWords = opts.maxCharsPerLine > 0 ? Math.max(2, Math.floor(opts.maxCharsPerLine / 7)) : LINE_MAX_WORDS
  const groups = groupWordsIntoLines(words, maxWords, LINE_MAX_DURATION_S)
  const primary   = hexToASS(opts.primaryColor)
  const highlight = hexToASS(opts.highlightColor)
  const getText = (w: WordChunk) => opts.uppercase ? w.text.toUpperCase() : w.text

  // One event per active-word transition. A previous layered version painted a
  // base line plus a scaled overlay for the active word — libass rendered the
  // base word's outline behind the scaled glyph, leaking around it as a halo.
  // Single-layer events keep one text (and one outline) on screen at a time.
  const pct = followActiveWordScalePercent()
  const events: string[] = []
  for (const group of groups) {
    const groupEnd = group[group.length - 1].end
    group.forEach((w, i) => {
      const start = w.start
      const end = group[i + 1]?.start ?? groupEnd
      const line = group.map((word, j) => {
        const t = getText(word)
        return j === i
          ? `{\\c${highlight}\\fscx${pct}\\fscy${pct}}${t}{\\c${primary}\\fscx100\\fscy100}`
          : t
      }).join(' ')
      events.push(dialogue(start, end, line))
    })
  }
  return events
}

export function buildASS(
  words: WordChunk[],
  opts: CaptionOptions,
  fontName = 'Arial',
  videoWidth = 1920,
  videoHeight = 1080,
): string {
  const cfg = styleConfig(opts.styleId, opts.position, opts.outlineWidth, videoHeight)
  const header = buildHeader(opts, cfg, fontName, videoWidth, videoHeight)

  let events: string[]
  if (opts.styleId === 'mrbeast' || opts.styleId === 'tiktok') {
    events = wordByWordEvents(words, opts)
  } else if (opts.styleId === 'karaoke') {
    events = karaokeEvents(words, opts)
  } else {
    events = groupedLineEvents(words, opts)
  }

  return header + '\n' + events.join('\n')
}
