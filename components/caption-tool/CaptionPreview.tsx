'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { WordChunk, CaptionOptions } from '@/lib/converters/caption-types'
import { groupWordsIntoLines } from '@/lib/converters/caption-ass-builder'
import { BUILTIN_FONTS } from '@/lib/converters/caption-fonts'

interface Props {
  videoFile: File
  words: WordChunk[]
  options: CaptionOptions
  onTimeUpdate?: (time: number) => void
  seekTime?: number
  seekNonce?: number
}

function getActiveWords(words: WordChunk[], time: number, options: CaptionOptions): WordChunk[] {
  const isWordByWord = options.styleId === 'mrbeast' || options.styleId === 'tiktok'
  if (isWordByWord) {
    const w = words.find((w) => time >= w.start && time < w.end)
    return w ? [w] : []
  }

  if (options.styleId === 'karaoke') {
    // Mirror the exact grouping the ASS burn path uses so preview matches output
    const maxWords = options.maxCharsPerLine > 0
      ? Math.max(2, Math.floor(options.maxCharsPerLine / 7))
      : 8
    const groups = groupWordsIntoLines(words, maxWords, 3)
    const group = groups.find(
      (g) => time >= g[0].start && time <= g[g.length - 1].end + 0.05,
    )
    return group ?? []
  }

  // classic / netflix: group size scales with maxCharsPerLine so rows stay ~constant when slider changes
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

function drawCaption(
  canvas: HTMLCanvasElement,
  words: WordChunk[],
  options: CaptionOptions,
  currentTime: number,
  fontName: string,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const isWordByWord = options.styleId === 'mrbeast' || options.styleId === 'tiktok'
  const activeWords = getActiveWords(words, currentTime, options)
  if (activeWords.length === 0) return

  const scale = canvas.height / 1080
  const fs = Math.round(options.fontSize * scale)
  const lineHeight = fs * 1.3

  ctx.font = `${options.styleId === 'mrbeast' || options.styleId === 'tiktok' ? 'bold ' : ''}${fs}px "${fontName}", Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const wordTexts = activeWords.map((w) => options.uppercase ? w.text.toUpperCase() : w.text)
  const lines = wrapWordTexts(wordTexts, options.maxCharsPerLine)

  const x = canvas.width / 2
  const yMap = { top: fs + 20 * scale, center: canvas.height / 2, bottom: canvas.height - 40 * scale }
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
    const pad = 12 * scale
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    for (let i = 0; i < lines.length; i++) {
      const metrics = ctx.measureText(lines[i])
      ctx.beginPath()
      ctx.roundRect(x - metrics.width / 2 - pad, lineYs[i] - fs - pad / 2, metrics.width + pad * 2, fs + pad, 6 * scale)
      ctx.fill()
    }
  } else if (options.outlineWidth > 0) {
    ctx.strokeStyle = options.outlineColor
    ctx.lineWidth = options.outlineWidth * scale * 2
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
      for (const word of lineWords) {
        const t = (options.uppercase ? word.text.toUpperCase() : word.text) + ' '
        ctx.fillStyle = word === activeWord ? options.highlightColor : options.primaryColor
        ctx.fillText(t, offsetX, lineYs[i])
        offsetX += ctx.measureText(t).width
      }
    }
  } else {
    ctx.fillStyle = options.primaryColor
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, lineYs[i])
    }
  }
}

export function CaptionPreview({ videoFile, words, options, onTimeUpdate, seekTime, seekNonce }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const urlRef = useRef<string | null>(null)
  const rafRef = useRef<number>(0)
  const loadedFaceRef = useRef<FontFace | null>(null)
  // Always points to the latest draw fn so font-load can trigger one redraw without
  // adding draw to the font-load effect's dependency array (which would cause loops).
  const drawRef = useRef<() => void>(() => {})

  const fontName =
    options.fontSource === 'builtin' ? options.builtinFont :
    options.fontSource === 'system'  ? options.systemFontFamily :
    options.uploadedFont?.name.replace(/\.[^.]+$/, '') ?? 'Arial'

  useEffect(() => {
    let cancelled = false
    let blobUrl: string | null = null

    async function loadFont() {
      // Remove the previous custom face before loading the new one.
      if (loadedFaceRef.current) {
        document.fonts.delete(loadedFaceRef.current)
        loadedFaceRef.current = null
      }

      let fontUrl: string | null = null
      let isObjectUrl = false

      if (options.fontSource === 'builtin') {
        // Safari won't use fonts for canvas unless they're explicitly registered in
        // document.fonts via FontFace — CSS @font-face alone is not sufficient.
        // Fetch the static file and register it the same way upload/system fonts are.
        const entry = BUILTIN_FONTS.find(f => f.name === options.builtinFont)
        fontUrl = entry?.file ?? null
      } else if (options.fontSource === 'upload' && options.uploadedFont) {
        fontUrl = URL.createObjectURL(options.uploadedFont)
        isObjectUrl = true
        blobUrl = fontUrl
      } else if (options.fontSource === 'system' && options.systemFontBlob) {
        fontUrl = URL.createObjectURL(options.systemFontBlob)
        isObjectUrl = true
        blobUrl = fontUrl
      }

      if (!fontUrl || !fontName) return

      try {
        const face = new FontFace(fontName, `url(${fontUrl})`)
        const loaded = await face.load()
        if (cancelled) {
          if (isObjectUrl) URL.revokeObjectURL(fontUrl)
          return
        }
        document.fonts.add(loaded)
        loadedFaceRef.current = loaded
        // Redraw once so the font change is visible immediately on a paused video.
        drawRef.current()
      } catch {
        if (isObjectUrl) URL.revokeObjectURL(fontUrl)
      }
    }

    loadFont()

    return () => {
      cancelled = true
      if (loadedFaceRef.current) {
        document.fonts.delete(loadedFaceRef.current)
        loadedFaceRef.current = null
      }
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
        blobUrl = null
      }
    }
  }, [options.fontSource, options.builtinFont, options.uploadedFont, options.systemFontBlob, fontName])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = URL.createObjectURL(videoFile)
    vid.src = urlRef.current
    return () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }
  }, [videoFile])

  const draw = useCallback(() => {
    const vid = videoRef.current
    const canvas = canvasRef.current
    if (!vid || !canvas) return
    if (vid.videoWidth && canvas.width !== vid.videoWidth) {
      canvas.width  = vid.videoWidth
      canvas.height = vid.videoHeight
    }
    drawCaption(canvas, words, options, vid.currentTime, fontName)
    onTimeUpdate?.(vid.currentTime)
    rafRef.current = requestAnimationFrame(draw)
  }, [words, options, fontName, onTimeUpdate])

  // Keep drawRef pointing at the latest draw so the font-load effect can
  // call it without being listed as a dependency (which would cause loops).
  useEffect(() => { drawRef.current = draw }, [draw])

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    const startRAF = () => { rafRef.current = requestAnimationFrame(draw) }
    const stopRAF = () => cancelAnimationFrame(rafRef.current)

    const onSeeked = () => draw()

    vid.addEventListener('play', startRAF)
    vid.addEventListener('pause', stopRAF)
    vid.addEventListener('ended', stopRAF)
    vid.addEventListener('seeked', onSeeked)

    // Draw once immediately (handles seeked/paused state)
    draw()

    // Start if already playing
    if (!vid.paused) startRAF()

    return () => {
      stopRAF()
      vid.removeEventListener('play', startRAF)
      vid.removeEventListener('pause', stopRAF)
      vid.removeEventListener('ended', stopRAF)
      vid.removeEventListener('seeked', onSeeked)
    }
  }, [draw])

  useEffect(() => {
    if (seekNonce == null || seekTime == null) return
    const vid = videoRef.current
    if (!vid) return
    vid.currentTime = seekTime
    drawRef.current()
  }, [seekNonce, seekTime])

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        controls
        className="w-full"
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  )
}
