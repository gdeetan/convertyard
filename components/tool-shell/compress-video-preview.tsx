'use client'

import { useEffect, useRef, useState } from 'react'

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
  fps: number
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
      if (!ctx) { cleanup(); return }
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      } catch {
        cleanup(); return
      }
      const frameUrl = canvas.toDataURL('image/png')
      // Probe real source fps via requestVideoFrameCallback. Sample 5 frames
      // and average the mediaTime deltas. Falls back to 30 if rVFC is missing
      // (Firefox) or the video doesn't tick within the window. Real fps
      // matters for the estimate: 60 fps sources encode at ~2× the bitrate a
      // 30 fps assumption predicts.
      const rvfcSupported = typeof (video as HTMLVideoElement & { requestVideoFrameCallback?: unknown }).requestVideoFrameCallback === 'function'
      const finish = (fps: number) => {
        if (cancelledRef.current) { cleanup(); return }
        setMeta({ frameUrl, width, height, durationSeconds, fps })
        cleanup()
      }
      if (!rvfcSupported) { finish(30); return }
      const times: number[] = []
      const rVFC = (video as HTMLVideoElement).requestVideoFrameCallback!.bind(video)
      const computeFps = (): number => {
        if (times.length < 2) return 30
        const totalDelta = times[times.length - 1] - times[0]
        const intervals = times.length - 1
        if (totalDelta <= 0 || intervals <= 0) return 30
        const avg = totalDelta / intervals
        return Math.min(240, Math.max(1, Math.round(1 / avg)))
      }
      const settleTimer = window.setTimeout(() => finish(computeFps()), 1200)
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        if (cancelledRef.current) { clearTimeout(settleTimer); return }
        times.push(meta.mediaTime)
        if (times.length >= 6) {
          clearTimeout(settleTimer)
          finish(computeFps())
          return
        }
        rVFC(onFrame)
      }
      video.muted = true
      video.play().then(() => rVFC(onFrame)).catch(() => { clearTimeout(settleTimer); finish(30) })
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

// Bits-per-pixel targets defining the "quality floor" bitrate for each level.
// Matches the encoder-side tables in compress-video-webcodecs.ts.
const AVC_BPP: Record<string, number> = { small: 0.12, medium: 0.075, high: 0.05, maximum: 0.028 }
const HEVC_BPP: Record<string, number> = { small: 0.08, medium: 0.05, high: 0.035, maximum: 0.02 }

// How much of the "excess bits above the quality floor" survives re-encoding.
// Higher levels preserve more (CRF ~18 preserves ~85%); lower levels compress
// harder. Split by platform because ffmpeg-wasm libx264 CRF (iOS) and the
// WebCodecs playback capture path (Android) both overshoot the target bitrate
// more than desktop's tighter WebCodecs / libx264 path. Values calibrated
// against real-device measurements (PROMPT-40, 2026-09-14).
const CRF_PRESERVATION_MOBILE: Record<string, number> = { small: 0.30, medium: 0.55, high: 0.75, maximum: 0.90 }
const CRF_PRESERVATION_DESKTOP: Record<string, number> = { small: 0.15, medium: 0.30, high: 0.50, maximum: 0.70 }

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

  // Mobile downshifts requested H.265 to H.264 (see ffmpeg.ts:1240) — mirror
  // that here so the estimate reflects the codec that will actually run.
  const isMobile = typeof navigator !== 'undefined' && (
    /Android|iPhone|iPod|iPad/i.test(navigator.userAgent)
    || (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  )
  const effectiveH265 = h265 && !isMobile

  // iOS runs hardware WebCodecs at whatever resolution the user picked and
  // only falls back to a 720p wasm downshift if WebCodecs fails at runtime.
  // Preview at the requested resolution — that's the expected outcome; the
  // fallback is a rare edge case.
  const targetH = RESOLUTION_HEIGHT[resolution] ?? meta.height
  const encodedH = Math.min(meta.height, targetH)
  const encodedW = Math.round(meta.width * (encodedH / meta.height))
  const fps = meta.fps > 0 ? meta.fps : 30

  // 1) Source bitrate = file size / duration. Fps- and codec-agnostic.
  const sourceBps = (file.size * 8) / meta.durationSeconds

  // 2) Scale source down to the target resolution. Empirically calibrated
  //    against the PROMPT-40 field data (Android 4K→1080p: exponent 1.35 on
  //    height ratio nails the observed 55.1 MB output; steeper exponents
  //    under-predict because CRF re-encoding preserves more source detail
  //    than a pure "bits per pixel" scaling would suggest).
  const downscale = Math.min(1, Math.pow(encodedH / meta.height, 1.35))
  const normalizedSourceBps = sourceBps * downscale

  // 3) Quality-floor bitrate the encoder targets at this level/resolution/fps.
  const bpp = effectiveH265 ? (HEVC_BPP[level] ?? HEVC_BPP.medium) : (AVC_BPP[level] ?? AVC_BPP.medium)
  const theoreticalBps = bpp * encodedW * encodedH * fps

  // 4) Source-anchored CRF-aware output:
  //    outputBps = theoretical + max(0, normalizedSource - theoretical) × preservation.
  //    If source is well above theoretical, encoder compresses partway toward
  //    the floor; if source is already at or below the floor, output ≈ source.
  const preservationTable = isMobile ? CRF_PRESERVATION_MOBILE : CRF_PRESERVATION_DESKTOP
  const preservation = preservationTable[level] ?? preservationTable.medium
  const excess = Math.max(0, normalizedSourceBps - theoreticalBps)
  let videoBps = theoreticalBps + excess * preservation

  // Cap at 95% of normalized source — re-encoding rarely inflates a
  // well-encoded source, and if the encoder does, the mobile size gate cuts
  // us off long before the estimate matters.
  videoBps = Math.min(videoBps, normalizedSourceBps * 0.95)

  const audioBps = stripAudio ? 0 : 128_000
  const bytes = Math.round(((videoBps + audioBps) * meta.durationSeconds) / 8)
  return Math.min(bytes, file.size)
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
