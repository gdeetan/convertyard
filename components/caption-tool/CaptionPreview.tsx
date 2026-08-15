'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { WordChunk, CaptionOptions } from '@/lib/converters/caption-types'
import { BUILTIN_FONTS } from '@/lib/converters/caption-fonts'
import { drawCaption } from '@/lib/converters/caption-draw'

interface Props {
  videoFile: File
  words: WordChunk[]
  options: CaptionOptions
  onTimeUpdate?: (time: number) => void
  seekTime?: number
  seekNonce?: number
}

export function CaptionPreview({ videoFile, words, options, onTimeUpdate, seekTime, seekNonce }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const urlRef = useRef<string | null>(null)
  const rafRef = useRef<number>(0)
  const loadedFaceRef = useRef<FontFace | null>(null)
  const [aspectRatio, setAspectRatio] = useState<string | undefined>(undefined)
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
    const onMeta = () => {
      if (vid.videoWidth && vid.videoHeight) {
        setAspectRatio(`${vid.videoWidth} / ${vid.videoHeight}`)
      }
    }
    vid.addEventListener('loadedmetadata', onMeta)
    return () => {
      vid.removeEventListener('loadedmetadata', onMeta)
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
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

    draw()
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
    <div
      className="relative w-full overflow-hidden rounded-xl bg-black"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <video
        ref={videoRef}
        controls
        className={aspectRatio ? 'block h-full w-full object-contain' : 'block h-auto w-full'}
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  )
}
