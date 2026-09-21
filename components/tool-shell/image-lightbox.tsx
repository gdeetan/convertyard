'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
import { ComparisonSlider } from '@/components/ui/ComparisonSlider'
import type { FileEntry } from '@/lib/types'

interface ImageLightboxProps {
  entry: FileEntry
  side: 'before' | 'after'
  onSideChange: (side: 'before' | 'after') => void
  onClose: () => void
}

function useObjectUrl(file?: File) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) { setUrl(null); return }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

export function ImageLightbox({ entry, onClose }: ImageLightboxProps) {
  const beforeUrl = useObjectUrl(entry.file)
  const afterUrl = useObjectUrl(entry.result ?? undefined)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const beforeBytes = entry.file.size
  const afterBytes = entry.result?.size ?? 0
  const savedBytes = afterBytes > 0 ? beforeBytes - afterBytes : 0
  const savedPct =
    beforeBytes > 0 && afterBytes > 0
      ? Math.round((savedBytes / beforeBytes) * 100)
      : 0
  const larger = afterBytes > beforeBytes

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { dialogRef.current?.focus() }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!mounted) return null

  const beforeExt = (entry.file.name.split('.').pop() || 'source').toUpperCase()
  const afterExt = (entry.result?.name.split('.').pop() || 'result').toUpperCase()
  const bothReady = beforeUrl && afterUrl
  const ratio = dims ? dims.w / dims.h : 4 / 3
  const aspectRatio = `${ratio}`

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${entry.file.name}`}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative flex flex-col gap-3 bg-bg-elevated rounded-xl shadow-2xl p-4 max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 min-w-0">
          <span className="truncate text-sm font-medium text-fg" title={entry.file.name}>
            {entry.file.name}
          </span>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'shrink-0 flex items-center justify-center h-7 w-7 rounded-md',
              'text-fg-muted hover:text-fg hover:bg-bg-muted transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            )}
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Image area */}
        <div
          className="relative overflow-hidden rounded-lg bg-bg-muted min-h-[120px]"
          style={{
            aspectRatio,
            width: `min(80vw, ${ratio * 60}vh)`,
          }}
        >
          {/* Hidden sizing image — establishes natural aspect ratio */}
          {afterUrl && !dims && (
            <img
              src={afterUrl}
              alt=""
              className="invisible absolute inset-0 h-full w-full object-contain"
              onLoad={(e) => {
                const img = e.currentTarget
                setDims({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />
          )}
          {bothReady ? (
            <ComparisonSlider
              className="h-full w-full"
              left={
                <>
                  <img
                    src={beforeUrl!}
                    alt={`Before: ${entry.file.name}`}
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                  <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white sm:text-sm">
                    Before · {beforeExt} · {formatBytes(beforeBytes)}
                  </span>
                </>
              }
              right={
                <>
                  <img
                    src={afterUrl!}
                    alt={`After: ${entry.result?.name ?? ''}`}
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                  <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white sm:text-sm">
                    After · {afterExt} · {formatBytes(afterBytes)}
                  </span>
                </>
              }
            />
          ) : beforeUrl ? (
            <img
              src={beforeUrl}
              alt={entry.file.name}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <span className="text-xs text-fg-muted p-8">Loading…</span>
          )}
        </div>

        {/* Metadata row */}
        <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-fg-muted">
          <span className="opacity-80">
            {bothReady ? 'Drag the slider to compare' : 'Preview'}
          </span>
          <div className="flex items-center gap-3">
            {dims && <span>{dims.w}×{dims.h}</span>}
            {bothReady && (
              larger ? (
                <span className="text-fg-muted">↑{Math.round(((afterBytes - beforeBytes) / beforeBytes) * 100)}% larger</span>
              ) : savedPct > 0 ? (
                <span className="text-success">↓{savedPct}% smaller</span>
              ) : null
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
