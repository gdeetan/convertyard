'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { ToolOptions } from '@/lib/types'
import {
  SHORT_FILE_WARNING,
  clampSelectedIndex,
  endHandleWrite,
  loopPlayhead,
  resolveWindow,
  shortFileWarning,
  wouldInvert,
} from '@/lib/converters/video-to-gif-preview-utils'

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}

function asTime(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function roundStep(s: number): number {
  return Math.round(s * 10) / 10
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '0.0s'
  const m = Math.floor(s / 60)
  const sec = s - m * 60
  if (m > 0) {
    const padded = sec.toFixed(1).padStart(4, '0')
    return `${m}:${padded}`
  }
  return `${sec.toFixed(1)}s`
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => {
      URL.revokeObjectURL(next)
    }
  }, [file])
  return url
}

export function VideoToGifPreview({ files, options, onChange }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const index = clampSelectedIndex(selectedIndex, files.length)
  const file = files[index] ?? null
  const startTime = asTime(options.startTime)
  const endTime = asTime(options.endTime)

  useEffect(() => {
    setSelectedIndex((i) => clampSelectedIndex(i, files.length))
  }, [files.length])

  const sourceUrl = useObjectUrl(file)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [previewError, setPreviewError] = useState(false)
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null)

  useEffect(() => {
    setDuration(0)
    setCurrentTime(0)
    setPreviewError(false)
  }, [sourceUrl])

  const trim = duration > 0 ? resolveWindow(startTime, endTime, duration) : { start: 0, end: 0 }
  const showShortWarning = duration > 0 && shortFileWarning(startTime, endTime, duration)

  const commitStart = useCallback(
    (next: number) => {
      const rounded = roundStep(Math.max(0, next))
      const compareEnd = endTime > 0 ? endTime : duration
      if (wouldInvert(rounded, compareEnd)) return
      onChange('startTime', rounded)
    },
    [duration, endTime, onChange],
  )

  const commitEnd = useCallback(
    (next: number) => {
      if (!(duration > 0)) return
      const written = roundStep(endHandleWrite(next, duration))
      if (wouldInvert(startTime, written)) return
      onChange('endTime', written)
    },
    [duration, onChange, startTime],
  )

  const onLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    const d = v.duration
    if (!Number.isFinite(d) || d <= 0) {
      setPreviewError(true)
      setDuration(0)
      return
    }
    setPreviewError(false)
    setDuration(d)
    const w = resolveWindow(startTime, endTime, d)
    v.currentTime = w.start
    setCurrentTime(w.start)
  }

  const onTimeUpdate = () => {
    const v = videoRef.current
    if (!v || duration <= 0) return
    const { start, end } = resolveWindow(startTime, endTime, duration)
    if (v.currentTime < start) {
      v.currentTime = start
      setCurrentTime(start)
      return
    }
    const next = loopPlayhead(v.currentTime, start, end)
    if (next !== v.currentTime) {
      v.currentTime = next
    }
    setCurrentTime(v.currentTime)
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v || duration <= 0) return
    const { start, end } = resolveWindow(startTime, endTime, duration)
    if (v.currentTime < start || v.currentTime >= end) {
      v.currentTime = start
      setCurrentTime(start)
    }
  }, [startTime, endTime, duration])

  const markStart = () => commitStart(videoRef.current?.currentTime ?? currentTime)
  const markEnd = () => commitEnd(videoRef.current?.currentTime ?? currentTime)

  if (!file) return null

  return (
    <div
      data-testid="video-to-gif-preview"
      className="space-y-3 rounded-xl border border-border bg-bg-elevated p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-fg">Preview & trim</h3>
        {duration > 0 && (
          <span className="text-xs tabular-nums text-fg-muted">
            {formatTime(trim.start)} – {formatTime(trim.end)}
          </span>
        )}
      </div>

      {files.length > 1 && (
        <FileStrip
          files={files}
          selectedIndex={index}
          onSelect={setSelectedIndex}
        />
      )}

      {!sourceUrl ? (
        <div className="rounded-lg border border-border bg-bg-muted px-4 py-8 text-center text-xs text-fg-subtle">
          Loading preview…
        </div>
      ) : previewError ? (
        <div className="rounded-lg border border-border bg-bg-muted px-4 py-8 text-center">
          <p className="truncate text-sm font-medium text-fg">{file.name}</p>
          <p className="mt-1 text-xs text-fg-muted">
            Preview unavailable in this browser — conversion still works.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-black">
          <video
            ref={videoRef}
            key={sourceUrl}
            src={sourceUrl}
            controls
            muted
            playsInline
            preload="metadata"
            className="mx-auto max-h-72 w-full bg-black"
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onError={() => setPreviewError(true)}
          />
        </div>
      )}

      {duration > 0 && !previewError && (
        <Timeline
          duration={duration}
          start={trim.start}
          end={trim.end}
          currentTime={currentTime}
          dragging={dragging}
          onSeek={(t) => {
            const v = videoRef.current
            if (!v) return
            v.currentTime = t
            setCurrentTime(t)
          }}
          onDragStart={(handle) => setDragging(handle)}
          onDragEnd={() => setDragging(null)}
          onStartChange={commitStart}
          onEndChange={commitEnd}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={markStart}
          disabled={previewError || duration <= 0}
          className={cn(
            'rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg',
            'hover:bg-bg-muted disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          )}
        >
          Mark start
        </button>
        <button
          type="button"
          onClick={markEnd}
          disabled={previewError || duration <= 0}
          className={cn(
            'rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg',
            'hover:bg-bg-muted disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          )}
        >
          Mark end
        </button>
        <span className="text-xs text-fg-muted">
          Trim applies to every file. FPS, width, and loop stay in Options.
        </span>
      </div>

      {files.length > 1 && (
        <p className="text-xs text-fg-muted">
          All {files.length} files use this start/end window.
        </p>
      )}

      {showShortWarning && (
        <p className="text-xs text-amber-800 dark:text-amber-200">{SHORT_FILE_WARNING}</p>
      )}
    </div>
  )
}

function FileStrip({
  files,
  selectedIndex,
  onSelect,
}: {
  files: File[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {files.map((file, i) => (
        <FileThumb
          key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
          file={file}
          selected={i === selectedIndex}
          onSelect={() => onSelect(i)}
        />
      ))}
    </div>
  )
}

function FileThumb({
  file,
  selected,
  onSelect,
}: {
  file: File
  selected: boolean
  onSelect: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(false)
  const [posterUrl, setPosterUrl] = useState<string | null>(null)

  useEffect(() => {
    const el = btnRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { rootMargin: '80px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    const src = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.src = src

    const cleanup = () => {
      video.src = ''
      URL.revokeObjectURL(src)
    }

    const onLoaded = () => {
      try {
        video.currentTime = Math.min(0.1, (video.duration || 1) / 4)
      } catch {
        /* noop */
      }
    }
    const onSeeked = () => {
      if (cancelled) return
      const canvas = document.createElement('canvas')
      const maxW = 160
      const scale = Math.min(1, maxW / (video.videoWidth || maxW))
      canvas.width = Math.max(1, Math.round((video.videoWidth || maxW) * scale))
      canvas.height = Math.max(1, Math.round((video.videoHeight || maxW) * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => {
            if (cancelled || !blob) return
            setPosterUrl(URL.createObjectURL(blob))
          },
          'image/jpeg',
          0.7,
        )
      } catch {
        /* noop */
      }
    }

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('seeked', onSeeked)

    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('seeked', onSeeked)
      cleanup()
    }
  }, [visible, file])

  useEffect(() => {
    return () => {
      if (posterUrl) URL.revokeObjectURL(posterUrl)
    }
  }, [posterUrl])

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={onSelect}
      className={cn(
        'w-28 shrink-0 overflow-hidden rounded-lg border text-left',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-border-strong',
      )}
      aria-pressed={selected}
      aria-label={`Preview ${file.name}`}
    >
      <div className="flex h-16 items-center justify-center bg-black">
        {posterUrl ? (
          <img src={posterUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-fg-subtle">…</span>
        )}
      </div>
      <p className="truncate px-1.5 py-1 text-[11px] text-fg">{file.name}</p>
    </button>
  )
}

function Timeline({
  duration,
  start,
  end,
  currentTime,
  dragging,
  onSeek,
  onDragStart,
  onDragEnd,
  onStartChange,
  onEndChange,
}: {
  duration: number
  start: number
  end: number
  currentTime: number
  dragging: 'start' | 'end' | null
  onSeek: (time: number) => void
  onDragStart: (handle: 'start' | 'end') => void
  onDragEnd: () => void
  onStartChange: (time: number) => void
  onEndChange: (time: number) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<'start' | 'end' | null>(null)

  const timeFromX = (clientX: number) => {
    const el = trackRef.current
    if (!el || duration <= 0) return 0
    const rect = el.getBoundingClientRect()
    const pct = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(duration, pct * duration))
  }

  useEffect(() => {
    if (!dragging) return
    dragRef.current = dragging
    const onMove = (e: PointerEvent) => {
      const t = timeFromX(e.clientX)
      if (dragRef.current === 'start') onStartChange(t)
      else if (dragRef.current === 'end') onEndChange(t)
    }
    const onUp = () => {
      dragRef.current = null
      onDragEnd()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, duration, onDragEnd, onEndChange, onStartChange])

  const startPct = duration > 0 ? (start / duration) * 100 : 0
  const endPct = duration > 0 ? (end / duration) * 100 : 0
  const playPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="space-y-1">
      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).dataset.handle) return
          onSeek(timeFromX(e.clientX))
        }}
        role="slider"
        aria-label="Trim window"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={start}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-border" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${startPct}%`, width: `${Math.max(0, endPct - startPct)}%` }}
        />
        <div
          className="pointer-events-none absolute top-0 h-full w-0.5 bg-fg"
          style={{ left: `${playPct}%` }}
        />
        <Handle
          which="start"
          pct={startPct}
          label={`Start ${formatTime(start)}`}
          onPointerDown={() => onDragStart('start')}
        />
        <Handle
          which="end"
          pct={endPct}
          label={`End ${formatTime(end)}`}
          onPointerDown={() => onDragStart('end')}
        />
      </div>
    </div>
  )
}

function Handle({
  which,
  pct,
  label,
  onPointerDown,
}: {
  which: 'start' | 'end'
  pct: number
  label: string
  onPointerDown: () => void
}) {
  return (
    <button
      type="button"
      data-handle={which}
      aria-label={label}
      className="absolute top-1/2 z-10 h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none"
      style={{ left: `${pct}%` }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onPointerDown()
      }}
    >
      <span className="mx-auto block h-6 w-2.5 rounded-sm bg-primary shadow ring-2 ring-white" />
    </button>
  )
}
