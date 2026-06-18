'use client'

import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Download, Archive, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { downloadFile, formatBytes } from '@/lib/utils/download'
import { downloadAsZip } from '@/lib/utils/zip'
import type { FileEntry } from '@/lib/types'

interface ResultListProps {
  entries: FileEntry[]
  zipName?: string
}

const ROW_H = 72
const VIRTUALIZE_AT = 50
const MAX_LIST_H = 480

export function ResultList({ entries, zipName = 'convertyard.zip' }: ResultListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [zipping, setZipping] = useState(false)
  const useVirt = entries.length > VIRTUALIZE_AT

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

  return (
    <div className="space-y-4">
      {/* Summary + download all */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-fg">
            {succeeded.length} of {total} file{total !== 1 ? 's' : ''} converted
          </p>
          {failed.length > 0 && (
            <p className="text-xs text-error">
              {failed.length} failed — download the rest below
            </p>
          )}
        </div>

        {succeeded.length > 0 && (
          <button
            type="button"
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
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: ROW_H,
                  transform: `translateY(${vi.start}px)`,
                }}
              >
                <ResultRow entry={entries[vi.index]} />
              </div>
            ))}
          </div>
        ) : (
          entries.map((entry) => <ResultRow key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  )
}

function ResultRow({ entry }: { entry: FileEntry }) {
  const { file, status, result, error } = entry
  const isDone = status === 'done' && result
  const isError = status === 'error'
  const saved = isDone && result ? file.size - result.size : 0
  const savedPct = isDone && file.size > 0 ? Math.round((saved / file.size) * 100) : 0

  return (
    <div
      role="listitem"
      className={cn(
        'flex items-center gap-3 border-b border-border px-4 last:border-0',
        'bg-bg-elevated'
      )}
      style={{ height: ROW_H }}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {isDone
          ? <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
          : <XCircle className="h-4 w-4 text-error" aria-hidden="true" />
        }
      </div>

      {/* Filename + size info */}
      <div className="min-w-0 flex-1">
        <span
          className="block truncate text-sm font-medium text-fg"
          title={isDone ? result!.name : file.name}
        >
          {isDone ? result!.name : file.name}
        </span>
        <span className="text-xs text-fg-muted">
          {isError ? (
            <span className="text-error">{error}</span>
          ) : isDone ? (
            <>
              {formatBytes(file.size)}
              {' → '}
              {formatBytes(result!.size)}
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
          onClick={() => downloadFile(result!)}
          className={cn(
            'shrink-0 flex items-center justify-center h-9 w-9 rounded-lg',
            'border border-border text-fg-muted transition-colors',
            'hover:border-primary hover:text-primary hover:bg-bg-muted',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          )}
          aria-label={`Download ${result!.name}`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
