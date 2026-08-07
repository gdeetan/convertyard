'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { WordChunk, CaptionOptions } from '@/lib/converters/caption-types'

interface Props {
  videoFile: File
  words: WordChunk[]
  options: CaptionOptions
  onTimeUpdate?: (time: number) => void
}

function getActiveWords(words: WordChunk[], time: number, wordByWord: boolean): WordChunk[] {
  if (wordByWord) {
    const w = words.find((w) => time >= w.start && time < w.end)
    return w ? [w] : []
  }
  const active = words.filter((w) => time >= w.start && time < w.end + 0.05)
  if (active.length === 0) return []
  const groupStart = active[0].start
  return words.filter((w) => w.start >= groupStart && w.start < groupStart + 3)
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
  const activeWords = getActiveWords(words, currentTime, isWordByWord)
  if (activeWords.length === 0) return

  const scale = canvas.height / 1080
  const fs = Math.round(options.fontSize * scale)

  ctx.font = `${options.styleId === 'mrbeast' || options.styleId === 'tiktok' ? 'bold ' : ''}${fs}px "${fontName}", Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'

  const text = activeWords
    .map((w) => (options.uppercase ? w.text.toUpperCase() : w.text))
    .join(' ')

  const x = canvas.width / 2
  const yMap = { top: fs + 20 * scale, center: canvas.height / 2, bottom: canvas.height - 40 * scale }
  const y = yMap[options.position]

  if (options.styleId === 'netflix') {
    const metrics = ctx.measureText(text)
    const pad = 12 * scale
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.beginPath()
    ctx.roundRect(x - metrics.width / 2 - pad, y - fs - pad / 2, metrics.width + pad * 2, fs + pad, 6 * scale)
    ctx.fill()
  } else if (options.outlineWidth > 0) {
    ctx.strokeStyle = options.outlineColor
    ctx.lineWidth = options.outlineWidth * scale * 2
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)
  }

  if (options.styleId === 'karaoke') {
    const activeWord = words.find((w) => currentTime >= w.start && currentTime < w.end)
    let offsetX = x - ctx.measureText(text).width / 2
    ctx.textAlign = 'left'
    for (const word of activeWords) {
      const t = (options.uppercase ? word.text.toUpperCase() : word.text) + ' '
      ctx.fillStyle = word === activeWord ? options.highlightColor : options.primaryColor
      ctx.fillText(t, offsetX, y)
      offsetX += ctx.measureText(t).width
    }
  } else {
    ctx.fillStyle = options.primaryColor
    ctx.fillText(text, x, y)
  }
}

export function CaptionPreview({ videoFile, words, options, onTimeUpdate }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const urlRef = useRef<string | null>(null)
  const rafRef = useRef<number>(0)

  const fontName =
    options.fontSource === 'builtin' ? options.builtinFont :
    options.fontSource === 'system'  ? options.systemFontFamily :
    options.uploadedFont?.name.replace(/\.[^.]+$/, '') ?? 'Arial'

  useEffect(() => {
    let blob: Blob | null = null
    if (options.fontSource === 'upload' && options.uploadedFont) blob = options.uploadedFont
    if (options.fontSource === 'system' && options.systemFontBlob) blob = options.systemFontBlob
    if (!blob || !fontName) return
    const url = URL.createObjectURL(blob)
    const face = new FontFace(fontName, `url(${url})`)
    face.load().then((loaded) => { document.fonts.add(loaded) }).catch(() => {})
    return () => URL.revokeObjectURL(url)
  }, [options.fontSource, options.uploadedFont, options.systemFontBlob, fontName])

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

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

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
