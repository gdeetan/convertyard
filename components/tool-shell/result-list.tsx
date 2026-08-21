'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Download, Archive, CheckCircle2, XCircle, Loader2, AlertTriangle, FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { downloadFile, formatBytes } from '@/lib/utils/download'
import { downloadAsZip } from '@/lib/utils/zip'
import { ImageLightbox } from './image-lightbox'
import { resultRowPresentation } from '@/lib/utils/conversion-results'
import type { FileEntry } from '@/lib/types'

interface ResultListProps {
  entries: FileEntry[]
  zipName?: string
  resultMode?: 'per-file' | 'combined-output'
  allDone?: boolean
}

const ROW_H = 80
const VIRTUALIZE_AT = 50
const MAX_LIST_H = 480

export function ResultList({ entries, zipName = 'convertyard.zip', resultMode = 'per-file', allDone = true }: ResultListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [zipping, setZipping] = useState(false)
  const [lightbox, setLightbox] = useState<{
    entry: FileEntry
    side: 'before' | 'after'
  } | null>(null)
  const useVirt = entries.length > VIRTUALIZE_AT

  const handleOpenLightbox = useCallback(
    (entry: FileEntry) => setLightbox({ entry, side: 'after' }),
    []
  )

  const succeeded = entries.filter((e) => e.status === 'done' && e.result)
  const failed = entries.filter((e) => e.status === 'error')
  const total = entries.length

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 8,
    enabled: useVirt,
  })

  const totalSavedBytes = succeeded.reduce(
    (sum, e) => sum + (e.result ? e.file.size - e.result.size : 0),
    0
  )

  const handleDownloadAll = async () => {
    const files = succeeded.map((e) => e.result!)
    if (files.length === 0) return
    if (files.length === 1) {
      downloadFile(files[0])
      return
    }
    setZipping(true)
    try {
      await downloadAsZip(files, zipName)
    } finally {
      setZipping(false)
    }
  }

  if (resultMode === 'combined-output') {
    return (
      <CombinedOutputResult
        entries={entries}
        resultEntry={succeeded[0]}
        failedCount={failed.length}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary + download all */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-fg">
            {succeeded.length} of {total} file{total !== 1 ? 's' : ''} converted
          </p>
          {totalSavedBytes > 0 && succeeded.length > 1 && (
            <p className="text-xs text-success">
              Total saved: {formatBytes(totalSavedBytes)} across {succeeded.length} files
            </p>
          )}
          {failed.length > 0 && (
            <p className="text-xs text-error">
              {failed.length} failed — download the rest below
            </p>
          )}
        </div>

        {succeeded.length > 0 && allDone && (
          <button
            type="button"
            data-testid="download-all"
            onClick={handleDownloadAll}
            disabled={zipping}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5',
              'bg-primary text-primary-fg text-sm font-medium',
              'transition-colors hover:bg-primary-hover',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
            aria-label={
              succeeded.length === 1
                ? `Download ${succeeded[0].result!.name}`
                : `Download all ${succeeded.length} files as ZIP`
            }
          >
            {zipping ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : succeeded.length === 1 ? (
              <Download className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Archive className="h-4 w-4" aria-hidden="true" />
            )}
            {succeeded.length === 1
              ? 'Download'
              : zipping
              ? 'Preparing ZIP…'
              : `Download all (${succeeded.length})`}
          </button>
        )}
      </div>

      {/* File list */}
      <div
        ref={parentRef}
        className="overflow-y-auto rounded-lg border border-border"
        style={{ maxHeight: MAX_LIST_H }}
        role="list"
        aria-label="Converted files"
      >
        {useVirt ? (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((vi) => (
              <div
                key={vi.key}
                role="listitem"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: ROW_H,
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                <ResultRow
                  entry={entries[vi.index]}
                  onOpenLightbox={handleOpenLightbox}
                />
              </div>
            ))}
          </div>
        ) : (
          entries.map((entry) => (
            <ResultRow
              key={entry.id}
              entry={entry}
              onOpenLightbox={handleOpenLightbox}
            />
          ))
        )}
      </div>

      {lightbox && (
        <ImageLightbox
          entry={lightbox.entry}
          side={lightbox.side}
          onSideChange={(side) => setLightbox((prev) => prev ? { ...prev, side } : null)}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

function CombinedOutputResult({
  entries,
  resultEntry,
  failedCount,
}: {
  entries: FileEntry[]
  resultEntry?: FileEntry
  failedCount: number
}) {
  const result = resultEntry?.result
  const objectUrl = useObjectUrl(result)
  const sourceCount = entries.length
  const sourceBytes = entries.reduce((sum, entry) => sum + entry.file.size, 0)
  const canPreview = Boolean(result?.type.startsWith('image/') && objectUrl)

  if (!result) {
    const firstError = entries.find((entry) => entry.status === 'error')?.error
    return (
      <div className="rounded-lg border border-border bg-bg-elevated p-4">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">Animated GIF could not be created</p>
            <p className="mt-1 text-xs text-error">
              {firstError ?? `${failedCount || sourceCount} file${sourceCount !== 1 ? 's' : ''} failed.`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-fg">
            Animated GIF created from {sourceCount} PNG file{sourceCount !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-fg-muted">
            {formatBytes(sourceBytes)} source sequence → {formatBytes(result.size)} GIF
          </p>
        </div>

        <a
          href={objectUrl ?? '#'}
          download={result.name}
          data-testid="download-combined-output"
          onClick={(event) => {
            if (objectUrl) return
            event.preventDefault()
            downloadFile(result)
          }}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5',
            'bg-primary text-primary-fg text-sm font-medium',
            'transition-colors hover:bg-primary-hover',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          )}
          aria-label={`Download ${result.name}`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download GIF
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-bg-elevated">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-bg-muted sm:w-48">
            {canPreview ? (
              <img
                src={objectUrl ?? undefined}
                alt={`Preview of ${result.name}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-xs text-fg-muted">Preview unavailable</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              <span className="truncate text-sm font-medium text-fg" title={result.name}>
                {result.name}
              </span>
            </div>
            <p className="mt-1 text-xs text-fg-muted">
              {sourceCount} frame{sourceCount !== 1 ? 's' : ''} · {formatBytes(result.size)}
            </p>
          </div>

          <a
            href={objectUrl ?? '#'}
            download={result.name}
            onClick={(event) => {
              if (objectUrl) return
              event.preventDefault()
              downloadFile(result)
            }}
            className={cn(
              'flex shrink-0 items-center justify-center h-9 w-9 rounded-lg',
              'border border-border text-fg-muted transition-colors',
              'hover:border-primary hover:text-primary hover:bg-bg-muted',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
            )}
            aria-label={`Download ${result.name}`}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}

function useObjectUrl(file?: File) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(file)
    setUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  return url
}

function isImageFile(file: File) {
  return file.type.startsWith('image/')
}

function isVideoFile(file: File) {
  if (file.type.startsWith('video/')) return true
  return /\.(mp4|mov|webm|mkv|avi|flv|m4v|3gp)$/i.test(file.name)
}

// Extract a single frame from the source video for a Finder-style thumbnail.
// Returns null on any failure so the caller falls back to the generic FileIcon.
function useVideoThumbnail(file?: File) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file || !isVideoFile(file)) {
      setUrl(null)
      return
    }
    let cancelled = false
    let generatedUrl: string | null = null
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'
    video.src = objectUrl

    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(objectUrl)
    }

    const capture = () => {
      if (cancelled) return
      const w = video.videoWidth
      const h = video.videoHeight
      if (!w || !h) { cleanup(); return }
      // Cap the thumbnail at 128px on the long edge — plenty for the 64px slot.
      const scale = Math.min(1, 128 / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(w * scale))
      canvas.height = Math.max(1, Math.round(h * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) { cleanup(); return }
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (cancelled) { cleanup(); return }
          if (!blob) { cleanup(); return }
          generatedUrl = URL.createObjectURL(blob)
          setUrl(generatedUrl)
          cleanup()
        }, 'image/jpeg', 0.8)
      } catch {
        cleanup()
      }
    }

    video.onloadedmetadata = () => {
      if (cancelled) return
      // Seek slightly past the start to skip common all-black intro frames.
      const seekTo = Math.min(0.5, Math.max(0, (video.duration || 0) * 0.1))
      video.currentTime = seekTo
    }
    video.onseeked = capture
    video.onerror = cleanup

    return () => {
      cancelled = true
      cleanup()
      if (generatedUrl) URL.revokeObjectURL(generatedUrl)
    }
  }, [file])

  return url
}

function ResultRow({
  entry,
  onOpenLightbox,
}: {
  entry: FileEntry
  onOpenLightbox: (entry: FileEntry) => void
}) {
  const { file, result, error } = entry
  const kind = resultRowPresentation(entry)
  const doneResult = kind === 'success' && result ? result : null
  const isDone = kind === 'success'
  const isError = kind === 'error'
  const saved = doneResult ? file.size - doneResult.size : 0
  const savedPct = isDone && file.size > 0 ? Math.round((saved / file.size) * 100) : 0

  const imageThumbnailUrl = useObjectUrl(doneResult && isImageFile(doneResult) ? doneResult : undefined)
  // Video thumbnails come from the source file so the preview shows the moment
  // upload finishes — even while compression is still running.
  const videoThumbnailUrl = useVideoThumbnail(isVideoFile(file) ? file : undefined)
  const thumbnailUrl = imageThumbnailUrl ?? videoThumbnailUrl
  const canPreview = Boolean(imageThumbnailUrl)

  return (
    <div
      data-testid={isDone ? 'result-success' : isError ? 'result-error' : 'result-pending'}
      className={cn(
        'flex items-center gap-3 border-b border-border px-4 last:border-0',
        'bg-bg-elevated'
      )}
      style={{ height: ROW_H }}
    >
      {/* Thumbnail */}
      <div className="shrink-0">
        {canPreview ? (
          <button
            type="button"
            onClick={() => onOpenLightbox(entry)}
            className="h-16 w-16 overflow-hidden rounded-md border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={`Preview ${file.name}`}
          >
            <img
              src={thumbnailUrl!}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ) : thumbnailUrl ? (
          <div className="h-16 w-16 overflow-hidden rounded-md border border-border bg-bg-muted">
            <img
              src={thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-bg-muted">
            <FileIcon className="h-6 w-6 text-fg-subtle" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Status icon */}
      <div className="shrink-0">
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
        ) : isError ? (
          <XCircle className="h-4 w-4 text-error" aria-hidden="true" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        )}
      </div>

      {/* Filename + size info */}
      <div className="min-w-0 flex-1">
        <span
          className="block truncate text-sm font-medium text-fg"
          title={isDone ? doneResult!.name : file.name}
        >
          {isDone ? doneResult!.name : file.name}
        </span>
        <span className="text-xs text-fg-muted">
          {isError ? (
            <span className="text-error">{error}</span>
          ) : isDone ? (
            <>
              {formatBytes(file.size)}
              {' → '}
              {formatBytes(doneResult!.size)}
              {savedPct > 0 && (
                <span className="ml-1 text-success">−{savedPct}%</span>
              )}
              {savedPct < 0 && (
                <span className="ml-1 text-fg-subtle">+{Math.abs(savedPct)}%</span>
              )}
            </>
          ) : null}
        </span>
        {entry.resultMeta && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-fg-subtle">
            {entry.resultMeta.isUnchanged ? (
              <span className="text-fg-muted">
                Already {formatBytes(entry.resultMeta.originalBytes)} — smaller than{' '}
                {formatBytes(entry.resultMeta.targetBytes)} target. No compression needed.
              </span>
            ) : entry.resultMeta.reachedTarget ? (
              <>
                <span>target: {formatBytes(entry.resultMeta.targetBytes)}</span>
                <span className="text-success">Target reached</span>
              </>
            ) : (
              <>
                <span>target: {formatBytes(entry.resultMeta.targetBytes)}</span>
                <span
                  title={entry.resultMeta.message ?? 'Could not reach target size'}
                  className="inline-flex items-center gap-1 text-amber-600 cursor-help"
                >
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Couldn&apos;t reach target — download best possible
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Individual download */}
      {isDone && (
        <button
          type="button"
          onClick={() => downloadFile(doneResult!)}
          className={cn(
            'shrink-0 flex items-center justify-center h-9 w-9 rounded-lg',
            'border border-border text-fg-muted transition-colors',
            'hover:border-primary hover:text-primary hover:bg-bg-muted',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          )}
          aria-label={`Download ${doneResult!.name}`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
