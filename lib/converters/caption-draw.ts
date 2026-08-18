import type { WordChunk, CaptionOptions } from './caption-types'
import { groupWordsIntoLines } from './caption-ass-builder'
import {
  captionFontSizePx,
  captionMarginVPx,
  captionOutlinePx,
  FOLLOW_ACTIVE_WORD_SCALE,
} from './caption-layout'

function getActiveWords(words: WordChunk[], time: number, options: CaptionOptions): WordChunk[] {
  const isWordByWord = options.styleId === 'mrbeast' || options.styleId === 'tiktok'
  if (isWordByWord) {
    const w = words.find((w) => time >= w.start && time < w.end)
    return w ? [w] : []
  }

  if (options.styleId === 'karaoke') {
    const maxWords = options.maxCharsPerLine > 0
      ? Math.max(2, Math.floor(options.maxCharsPerLine / 7))
      : 8
    const groups = groupWordsIntoLines(words, maxWords, 3)
    const group = groups.find(
      (g) => time >= g[0].start && time <= g[g.length - 1].end + 0.05,
    )
    return group ?? []
  }

  const maxWords = options.maxCharsPerLine > 0
    ? Math.max(2, Math.floor(options.maxCharsPerLine * 2 / 5))
    : 8
  const groups = groupWordsIntoLines(words, maxWords, 3)
  const group = groups.find(
    (g) => time >= g[0].start && time <= g[g.length - 1].end + 0.05,
  )
  return group ?? []
}

function wrapWordTexts(wordTexts: string[], maxChars: number): string[] {
  if (maxChars <= 0) return [wordTexts.join(' ')]
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
  return lines
}

function wrapWordChunks(
  chunks: WordChunk[],
  maxChars: number,
  uppercase: boolean,
): Array<{ text: string; chunks: WordChunk[] }> {
  const getText = (w: WordChunk) => uppercase ? w.text.toUpperCase() : w.text
  if (maxChars <= 0) {
    return [{ text: chunks.map(getText).join(' '), chunks }]
  }
  const result: Array<{ text: string; chunks: WordChunk[] }> = []
  let cur: WordChunk[] = []
  let curLen = 0
  for (const word of chunks) {
    const t = getText(word)
    if (!cur.length) {
      cur = [word]; curLen = t.length
    } else if (curLen + 1 + t.length <= maxChars) {
      cur.push(word); curLen += 1 + t.length
    } else {
      result.push({ text: cur.map(getText).join(' '), chunks: cur })
      cur = [word]; curLen = t.length
    }
  }
  if (cur.length) result.push({ text: cur.map(getText).join(' '), chunks: cur })
  return result
}

/** Draw the current caption overlay. Caller is responsible for the video frame. */
export function drawCaptionOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  words: WordChunk[],
  options: CaptionOptions,
  currentTime: number,
  fontName: string,
): void {
  const isWordByWord = options.styleId === 'mrbeast' || options.styleId === 'tiktok'
  const activeWords = getActiveWords(words, currentTime, options)
  if (activeWords.length === 0) return

  const fs = captionFontSizePx(options.fontSize, height)
  const outlinePx = captionOutlinePx(options.styleId, options.outlineWidth, height)
  const marginV = captionMarginVPx(options.position, height)
  const lineHeight = fs * 1.3

  ctx.font = `${isWordByWord ? 'bold ' : ''}${fs}px "${fontName}", Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const wordTexts = activeWords.map((w) => options.uppercase ? w.text.toUpperCase() : w.text)
  const lines = wrapWordTexts(wordTexts, options.maxCharsPerLine)

  const x = width / 2
  const yMap = {
    top: fs + marginV,
    center: height / 2,
    bottom: height - marginV,
  }
  const baseY = yMap[options.position]

  let lineYs: number[]
  if (options.position === 'bottom') {
    lineYs = lines.map((_, i) => baseY - (lines.length - 1 - i) * lineHeight)
  } else if (options.position === 'top') {
    lineYs = lines.map((_, i) => baseY + i * lineHeight)
  } else {
    const totalH = (lines.length - 1) * lineHeight
    lineYs = lines.map((_, i) => baseY - totalH / 2 + i * lineHeight)
  }

  if (options.styleId === 'netflix') {
    const pad = outlinePx
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    for (let i = 0; i < lines.length; i++) {
      const metrics = ctx.measureText(lines[i])
      ctx.beginPath()
      ctx.roundRect(x - metrics.width / 2 - pad, lineYs[i] - fs - pad / 2, metrics.width + pad * 2, fs + pad, Math.max(2, Math.round(outlinePx * 0.6)))
      ctx.fill()
    }
  } else if (outlinePx > 0) {
    ctx.strokeStyle = options.outlineColor
    ctx.lineWidth = outlinePx * 2
    ctx.lineJoin = 'round'
    for (let i = 0; i < lines.length; i++) {
      ctx.strokeText(lines[i], x, lineYs[i])
    }
  }

  if (options.styleId === 'karaoke') {
    const lineChunks = wrapWordChunks(activeWords, options.maxCharsPerLine, options.uppercase ?? false)
    const activeWord = words.find((w) => currentTime >= w.start && currentTime < w.end)
    ctx.textAlign = 'left'
    for (let i = 0; i < lineChunks.length; i++) {
      const { text: lineText, chunks: lineWords } = lineChunks[i]
      let offsetX = x - ctx.measureText(lineText).width / 2
      const baseFont = ctx.font
      const scaledFs = Math.max(1, Math.round(fs * FOLLOW_ACTIVE_WORD_SCALE))
      const weight = isWordByWord ? 'bold ' : ''
      for (const word of lineWords) {
        const t = (options.uppercase ? word.text.toUpperCase() : word.text) + ' '
        const active = word === activeWord
        ctx.fillStyle = active ? options.highlightColor : options.primaryColor
        ctx.font = active ? `${weight}${scaledFs}px "${fontName}", Arial` : baseFont
        ctx.fillText(t, offsetX, lineYs[i])
        offsetX += ctx.measureText(t).width
      }
      ctx.font = baseFont
    }
  } else {
    ctx.fillStyle = options.primaryColor
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, lineYs[i])
    }
  }
}

export function drawCaption(
  canvas: HTMLCanvasElement,
  words: WordChunk[],
  options: CaptionOptions,
  currentTime: number,
  fontName: string,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawCaptionOverlay(ctx, canvas.width, canvas.height, words, options, currentTime, fontName)
}
