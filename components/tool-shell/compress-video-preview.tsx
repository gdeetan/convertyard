'use client'

import { useEffect, useRef, useState } from 'react'
import { avcBitrateForLevel, hevcBitrateForLevel } from '@/lib/converters/compress-video-webcodecs'

interface CompressVideoPreviewProps {
  files: File[]
  results: (File | null)[]
  options: Record<string, unknown>
}

type Meta = {
  frameUrl: string
  width: number
  height: number
  durationSeconds: number
}

function useVideoMeta(file: File | null): Meta | null {
  const [meta, setMeta] = useState<Meta | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    setMeta(null)
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = objectUrl
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'

    let width = 0
    let height = 0
    let durationSeconds = 0

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    const onLoaded = () => {
      if (cancelledRef.current) return cleanup()
      width = video.videoWidth || 0
      height = video.videoHeight || 0
      durationSeconds = Number.isFinite(video.duration) ? video.duration : 0
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2)
    }

    const onSeeked = () => {
      if (cancelledRef.current) return cleanup()
      const canvas = document.createElement('canvas')
      const targetW = Math.min(480, width || 480)
      const scale = width > 0 ? targetW / width : 1
      canvas.width = targetW
      canvas.height = Math.max(1, Math.round((height || 270) * scale))
      const ctx = canvas.getContext('2d')
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          setMeta({
            frameUrl: canvas.toDataURL('image/png'),
            width,
            height,
            durationSeconds,
          })
        } catch {
          // decode error — swallow
        }
      }
      cleanup()
    }

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', cleanup)

    return () => {
      cancelledRef.current = true
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', cleanup)
      cleanup()
    }
  }, [file])

  return meta
}

const RESOLUTION_HEIGHT: Record<string, number> = {
  '1080p': 1080,
  '720p': 720,
  '480p': 480,
  '360p': 360,
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const total = Math.round(seconds)
  const mm = Math.floor(total / 60)
  const ss = String(total % 60).padStart(2, '0')
  return mm > 0 ? `${mm}:${ss}` : `0:${ss}`
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(0)} KB`
}

function estimateOutputBytes(args: {
  meta: Meta
  file: File
  options: Record<string, unknown>
}): number | null {
  const { meta, file, options } = args
  const resolution = (options.resolution as string) ?? 'original'
  const level = (options.level as string) ?? 'medium'
  const h265 = options.h265 === true || options.h265 === 'true'
  const targetSizeMode = options.targetSizeMode === true || options.targetSizeMode === 'true'
  const stripAudio = options.stripAudio === true || options.stripAudio === 'true'

  if (targetSizeMode) {
    const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 51200
    return targetKB * 1024
  }
  if (meta.durationSeconds <= 0 || meta.width <= 0 || meta.height <= 0) return null

  const targetH = RESOLUTION_HEIGHT[resolution] ?? meta.height
  const encodedH = Math.min(meta.height, targetH)
  const encodedW = Math.round(meta.width * (encodedH / meta.height))
  const fps = 30

  const calc = h265 ? hevcBitrateForLevel : avcBitrateForLevel
  const bps = calc(encodedW, encodedH, fps, level, {
    sourceBytes: file.size,
    durationSeconds: meta.durationSeconds,
  })
  const audioBps = stripAudio ? 0 : 128_000
  return Math.round(((bps + audioBps) * meta.durationSeconds) / 8)
}

export function CompressVideoPreview({ files, options }: CompressVideoPreviewProps) {
  const file = files[0] ?? null
  const meta = useVideoMeta(file)

  if (!file) return null

  const estimatedBytes = meta ? estimateOutputBytes({ meta, file, options }) : null
  const savingsPct = estimatedBytes != null && file.size > 0
    ? Math.max(0, Math.min(99, Math.round((1 - estimatedBytes / file.size) * 100)))
    : null

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
      <div className="min-h-[120px]">
        {meta?.frameUrl
          ? <img src={meta.frameUrl} alt="First frame" className="w-full rounded-lg" />
          : <div className="grid h-full min-h-[160px] place-items-center rounded-lg bg-bg-elevated text-xs text-fg-muted">Loading preview…</div>}
      </div>
      <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-sm md:grid-cols-1">
        <div>
          <dt className="text-xs text-fg-muted">Length</dt>
          <dd className="font-medium">{formatDuration(meta?.durationSeconds ?? 0)}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">Resolution</dt>
          <dd className="font-medium">{meta ? `${meta.width}×${meta.height}` : '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">Source size</dt>
          <dd className="font-medium">{formatBytes(file.size)}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-muted">Estimated output</dt>
          <dd className="font-medium">
            {estimatedBytes != null ? formatBytes(estimatedBytes) : '—'}
            {savingsPct != null && savingsPct > 0 && (
              <span className="ml-2 text-xs text-fg-muted">−{savingsPct}%</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}
