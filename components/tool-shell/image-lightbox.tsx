'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
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

export function ImageLightbox({ entry, side, onSideChange, onClose }: ImageLightboxProps) {
  const beforeUrl = useObjectUrl(entry.file)
  const afterUrl = useObjectUrl(entry.result ?? undefined)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const activeUrl = side === 'before' ? beforeUrl : afterUrl
  const activeFile = side === 'before' ? entry.file : entry.result
  const saved = entry.result ? entry.file.size - entry.result.size : 0
  const savedPct = entry.file.size > 0 ? Math.round((saved / entry.file.size) * 100) : 0

  // SSR mount guard
  useEffect(() => {
    setMounted(true)
  }, [])

  // Focus management
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Reset dims on side switch
  useEffect(() => {
    setDims(null)
  }, [side])

  if (!mounted) return null

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
          <span className="truncate text-sm font-medium text-fg" title={activeFile?.name}>
            {activeFile?.name ?? entry.file.name}
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

        {/* Image */}
        <div className="flex items-center justify-center overflow-hidden rounded-lg bg-bg-muted min-h-[120px]">
          {activeUrl ? (
            <img
              key={activeUrl}
              src={activeUrl}
              alt={activeFile?.name ?? ''}
              loading="eager"
              className="max-w-[80vw] max-h-[60vh] object-contain"
              onLoad={(e) => {
                const img = e.currentTarget
                setDims({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />
          ) : (
            <span className="text-xs text-fg-muted p-8">Loading…</span>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Before / After toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              type="button"
              aria-pressed={side === 'before'}
              onClick={() => onSideChange('before')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                side === 'before'
                  ? 'bg-primary text-primary-fg font-medium'
                  : 'text-fg-muted hover:bg-bg-muted'
              )}
            >
              Before
            </button>
            <button
              type="button"
              disabled={!entry.result}
              aria-pressed={side === 'after'}
              onClick={() => onSideChange('after')}
              className={cn(
                'px-3 py-1.5 transition-colors border-l border-border',
                side === 'after'
                  ? 'bg-primary text-primary-fg font-medium'
                  : 'text-fg-muted hover:bg-bg-muted',
                !entry.result && 'opacity-40 cursor-not-allowed'
              )}
            >
              After
            </button>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-fg-muted">
            {dims && <span>{dims.w}×{dims.h}</span>}
            {activeFile && <span>{formatBytes(activeFile.size)}</span>}
            {side === 'after' && savedPct > 0 && (
              <span className="text-success">↓{savedPct}%</span>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
