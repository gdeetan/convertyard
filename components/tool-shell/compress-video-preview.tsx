'use client'

import { useEffect, useRef, useState } from 'react'

interface CompressVideoPreviewProps {
  files: File[]
  results: (File | null)[]
  options: Record<string, unknown>
}

function useFirstFrame(file: File | null): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    setDataUrl(null)
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = objectUrl
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      video.removeAttribute('src')
      video.load()
    }

    const onLoaded = () => {
      if (cancelledRef.current) return cleanup()
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2)
    }

    const onSeeked = () => {
      if (cancelledRef.current) return cleanup()
      const canvas = document.createElement('canvas')
      const targetW = Math.min(320, video.videoWidth || 320)
      const scale = video.videoWidth > 0 ? targetW / video.videoWidth : 1
      canvas.width = targetW
      canvas.height = Math.max(1, Math.round((video.videoHeight || 180) * scale))
      const ctx = canvas.getContext('2d')
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          setDataUrl(canvas.toDataURL('image/png'))
        } catch {
          // canvas taint from a decode error — skip preview silently
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

  return dataUrl
}

export function CompressVideoPreview({ files }: CompressVideoPreviewProps) {
  const file = files[0] ?? null
  const beforeUrl = useFirstFrame(file)

  if (!file) return null

  return (
    <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3">
      <div className="mb-2 text-sm text-fg-muted">Preview</div>
      <div className="flex gap-3">
        <div className="flex-1">
          <div className="mb-1 text-xs text-fg-muted">Original frame</div>
          <div className="grid min-h-[120px] place-items-center rounded border border-border bg-bg-base">
            {beforeUrl
              ? <img src={beforeUrl} alt="Original first frame" className="max-h-40 rounded" />
              : <span className="text-xs text-fg-muted">Loading…</span>}
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-1 text-xs text-fg-muted">Compressed preview</div>
          <div className="grid min-h-[120px] place-items-center rounded border border-dashed border-border bg-bg-base text-xs text-fg-muted">
            Available after first calibration run
          </div>
        </div>
      </div>
    </div>
  )
}
