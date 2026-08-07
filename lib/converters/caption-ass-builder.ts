import type { WordChunk, CaptionOptions, CaptionStyleId } from './caption-types'

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

interface ASSStyleConfig {
  bold: boolean
  alignment: number
  borderStyle: number
  outline: number
  shadow: number
  marginV: number
}

function styleConfig(id: CaptionStyleId, position: 'top' | 'center' | 'bottom'): ASSStyleConfig {
  const alignment = position === 'top' ? 8 : position === 'center' ? 5 : 2
  const marginV = position === 'bottom' ? 80 : position === 'top' ? 80 : 0
  switch (id) {
    case 'mrbeast': return { bold: true,  alignment, borderStyle: 1, outline: 4, shadow: 0, marginV }
    case 'tiktok':  return { bold: true,  alignment, borderStyle: 1, outline: 6, shadow: 0, marginV }
    case 'netflix': return { bold: false, alignment, borderStyle: 3, outline: 0, shadow: 0, marginV }
    case 'classic': return { bold: false, alignment, borderStyle: 1, outline: 2, shadow: 1, marginV }
    case 'karaoke': return { bold: false, alignment, borderStyle: 1, outline: 2, shadow: 0, marginV }
  }
}

function buildHeader(opts: CaptionOptions, cfg: ASSStyleConfig, fontName: string): string {
  const primary   = hexToASS(opts.primaryColor)
  const highlight = hexToASS(opts.highlightColor)
  const outline   = hexToASS(opts.outlineColor)
  const backColor = opts.styleId === 'netflix' ? '&H80000000' : '&H00000000'
  const bold = cfg.bold ? '-1' : '0'

  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: 1920',
    'PlayResY: 1080',
    'WrapStyle: 1',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Default,${fontName},${opts.fontSize},${primary},${highlight},${outline},${backColor},${bold},0,0,0,100,100,0,0,${cfg.borderStyle},${cfg.outline},${cfg.shadow},${cfg.alignment},0,0,${cfg.marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ].join('\n')
}

function dialogue(start: number, end: number, text: string): string {
  return `Dialogue: 0,${toASSTime(start)},${toASSTime(end)},Default,,0,0,0,,${text}`
}

function wordByWordEvents(words: WordChunk[], opts: CaptionOptions): string[] {
  return words.map((w) => {
    const text = opts.uppercase ? w.text.toUpperCase() : w.text
    return dialogue(w.start, w.end, text)
  })
}

function groupedLineEvents(words: WordChunk[], opts: CaptionOptions): string[] {
  const groups = groupWordsIntoLines(words, 8, 3)
  return groups.map((group) => {
    const start = group[0].start
    const end   = group[group.length - 1].end
    const text  = group.map((w) => opts.uppercase ? w.text.toUpperCase() : w.text).join(' ')
    return dialogue(start, end, text)
  })
}

function karaokeEvents(words: WordChunk[], opts: CaptionOptions): string[] {
  const groups = groupWordsIntoLines(words, 8, 3)
  return groups.map((group) => {
    const start = group[0].start
    const end   = group[group.length - 1].end
    const text  = group.map((w) => {
      const cs = Math.round((w.end - w.start) * 100)
      const t  = opts.uppercase ? w.text.toUpperCase() : w.text
      return `{\\kf${cs}}${t} `
    }).join('')
    return dialogue(start, end, text.trimEnd())
  })
}

export function buildASS(words: WordChunk[], opts: CaptionOptions, fontName = 'Arial'): string {
  const cfg = styleConfig(opts.styleId, opts.position)
  const header = buildHeader(opts, cfg, fontName)

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
