'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ToolOptions } from '@/lib/types'

interface Props {
  files: File[]
  results: (File | null)[]
  options: ToolOptions
}

type Rotation = '90cw' | '90ccw' | '180' | 'flip-h' | 'flip-v'

function transformFor(rotation: Rotation): string {
  switch (rotation) {
    case '90cw':   return 'rotate(90deg)'
    case '90ccw':  return 'rotate(-90deg)'
    case '180':    return 'rotate(180deg)'
    case 'flip-h': return 'scaleX(-1)'
    case 'flip-v': return 'scaleY(-1)'
  }
}

function labelFor(rotation: Rotation): string {
  switch (rotation) {
    case '90cw':   return '90° clockwise'
    case '90ccw':  return '90° counter-clockwise'
    case '180':    return '180° upside down'
    case 'flip-h': return 'Horizontal flip'
    case 'flip-v': return 'Vertical flip'
  }
}

export function RotateVideoPreview({ files, options }: Props) {
  const file = files[0]
  const rotation = (typeof options.rotation === 'string' ? options.rotation : '90cw') as Rotation
  const [posterUrl, setPosterUrl] = useState<string | null>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const revokeRef = useRef<string | null>(null)

  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  useEffect(() => {
    if (!fileUrl) return
    let cancelled = false
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = fileUrl
    video.crossOrigin = 'anonymous'

    const onLoaded = () => {
      if (cancelled) return
      setDims({ w: video.videoWidth, h: video.videoHeight })
      try {
        video.currentTime = Math.min(0.1, (video.duration || 1) / 4)
      } catch {
        drawFallback()
      }
    }
    const onSeeked = () => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      const maxW = 320
      const scale = Math.min(1, maxW / (video.videoWidth || maxW))
      canvas.width = Math.max(1, Math.round((video.videoWidth || maxW) * scale))
      canvas.height = Math.max(1, Math.round((video.videoHeight || maxW) * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (cancelled || !blob) return
          const url = URL.createObjectURL(blob)
          if (revokeRef.current) URL.revokeObjectURL(revokeRef.current)
          revokeRef.current = url
          setPosterUrl(url)
        }, 'image/jpeg', 0.8)
      } catch {
        drawFallback()
      }
    }
    const drawFallback = () => {
      setPosterUrl(null)
    }

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', drawFallback)

    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', drawFallback)
      video.src = ''
    }
  }, [fileUrl])

  useEffect(() => {
    return () => {
      if (revokeRef.current) URL.revokeObjectURL(revokeRef.current)
    }
  }, [])

  if (!file) return null

  const isSwap = rotation === '90cw' || rotation === '90ccw'
  const aspect = dims ? dims.w / dims.h : 16 / 9
  const boxAspect = isSwap ? 1 / aspect : aspect

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-fg">Rotation preview</h3>
        <span className="text-xs text-fg-muted">{labelFor(rotation)}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <PreviewTile
          label="Before"
          posterUrl={posterUrl}
          aspect={aspect}
          transform="none"
        />
        <PreviewTile
          label="After"
          posterUrl={posterUrl}
          aspect={boxAspect}
          transform={transformFor(rotation)}
          highlight
        />
      </div>
      {files.length > 1 && (
        <p className="mt-3 text-xs text-fg-muted">
          Preview shows the first file. All {files.length} files will get the same rotation.
        </p>
      )}
    </div>
  )
}

function PreviewTile({
  label,
  posterUrl,
  aspect,
  transform,
  highlight = false,
}: {
  label: string
  posterUrl: string | null
  aspect: number
  transform: string
  highlight?: boolean
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className={`text-xs font-medium ${highlight ? 'text-primary' : 'text-fg-muted'}`}>
          {label}
        </span>
      </div>
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
        style={{ aspectRatio: aspect > 0 ? aspect : 16 / 9 }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={label}
              className="max-h-full max-w-full object-contain"
              style={{ transform, transformOrigin: 'center center' }}
            />
          ) : (
            <div className="text-xs text-fg-subtle">Loading preview…</div>
          )}
        </div>
      </div>
    </div>
  )
}
