'use client'

import { useEffect, useRef, useState } from 'react'
import { GripVertical, RotateCw, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
import { buildThumbnailDataUrl } from '@/components/exif-viewer/thumbnail-fallback'
import { sortFilesByExifDate } from '@/lib/converters/heic-to-pdf'
import type { ToolOptions } from '@/lib/types'

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
  onReorder?: (from: number, to: number) => void
  onRemove?: (index: number) => void
  onRotate?: (index: number) => void
  onReplaceFiles?: (files: File[]) => void
  rotations?: number[]
}

export function HeicPdfPageList({
  files,
  onChange: _onChange,
  onReorder,
  onRemove,
  onRotate,
  onReplaceFiles,
  rotations = [],
}: Props) {
  void _onChange
  const [thumbs, setThumbs] = useState<(string | null)[]>([])
  const [sorting, setSorting] = useState(false)
  const dragIndex = useRef<number | null>(null)
  const cacheRef = useRef(new Map<File, string | null>())

  useEffect(() => {
    let cancelled = false
    const cache = cacheRef.current
    setThumbs(files.map((f) => cache.get(f) ?? null))
    ;(async () => {
      for (const file of files) {
        if (cache.has(file)) continue
        const url = await buildThumbnailDataUrl(file)
        if (cancelled) return
        cache.set(file, url)
        setThumbs(files.map((f) => cache.get(f) ?? null))
      }
    })()
    return () => { cancelled = true }
  }, [files])

  const onDragStart = (index: number) => { dragIndex.current = index }
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const from = dragIndex.current
    if (from == null || from === index) return
    onReorder?.(from, index)
    dragIndex.current = index
  }
  const onDragEnd = () => { dragIndex.current = null }

  const sortByDate = async () => {
    if (!onReplaceFiles || files.length < 2) return
    setSorting(true)
    try {
      const { parse } = await import('exifr')
      const dates = await Promise.all(files.map(async (file) => {
        try {
          const raw = await parse(file, { pick: ['DateTimeOriginal', 'CreateDate', 'DateTime'], reviveValues: true }) as Record<string, unknown> | undefined
          const value = raw?.DateTimeOriginal ?? raw?.CreateDate ?? raw?.DateTime
          if (value instanceof Date) return value
          if (typeof value === 'string') {
            const d = new Date(value)
            return Number.isNaN(d.getTime()) ? undefined : d
          }
          return undefined
        } catch {
          return undefined
        }
      }))
      onReplaceFiles(sortFilesByExifDate(files, dates))
    } finally {
      setSorting(false)
    }
  }

  if (files.length === 0) return null

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs text-fg-subtle">
          Drag rows to set page order. Rotate if a photo is sideways.
        </p>
        {files.length > 1 && onReplaceFiles && (
          <button
            type="button"
            onClick={sortByDate}
            disabled={sorting}
            className="shrink-0 text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {sorting ? 'Sorting…' : 'Sort by date'}
          </button>
        )}
      </div>
      <ul className="space-y-1.5" aria-label="Images to convert">
        {files.map((file, idx) => {
          const rotation = rotations[idx] ?? 0
          return (
            <li
              key={`${file.name}-${file.lastModified}-${idx}`}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={onDragEnd}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5',
                'cursor-grab active:cursor-grabbing select-none',
                'hover:border-primary/40 transition-colors'
              )}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              {thumbs[idx] ? (
                <img
                  src={thumbs[idx]!}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded object-cover border border-border"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded border border-border bg-bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">{file.name}</p>
                <p className="text-xs text-fg-subtle">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRotate?.(idx)}
                aria-label={`Rotate ${file.name} 90 degrees`}
                className={cn(
                  'shrink-0 rounded p-1 text-fg-subtle transition-colors',
                  'hover:text-fg hover:bg-bg-muted',
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                )}
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemove?.(idx)}
                aria-label={`Remove ${file.name}`}
                className={cn(
                  'shrink-0 rounded p-1 text-fg-subtle transition-colors',
                  'hover:text-error hover:bg-bg-muted',
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
