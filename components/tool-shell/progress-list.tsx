'use client'

import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
import type { FileEntry } from '@/lib/types'

// Estimate remaining time from a monotonic progress percentage. Uses a
// rolling EMA of "elapsed per percent" so late-run rate changes don't jerk
// the estimate around. Returns a human string like "about 45s remaining"
// or null when we don't have enough signal yet.
function useEtaLabel(pct: number, active: boolean): string | null {
  const startAtRef = useRef<number | null>(null)
  const emaMsPerPctRef = useRef<number | null>(null)
  const lastPctRef = useRef(0)
  const lastAtRef = useRef<number | null>(null)
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!active) {
      startAtRef.current = null
      emaMsPerPctRef.current = null
      lastPctRef.current = 0
      lastAtRef.current = null
      setLabel(null)
      return
    }
    const now = Date.now()
    if (startAtRef.current === null && pct > 0) {
      startAtRef.current = now
      lastAtRef.current = now
      lastPctRef.current = pct
      return
    }
    if (startAtRef.current === null || pct <= lastPctRef.current) return
    const dPct = pct - lastPctRef.current
    const dMs = now - (lastAtRef.current ?? now)
    if (dPct > 0 && dMs > 0) {
      const instant = dMs / dPct
      // Blend 20% new sample so the estimate stays responsive but not jumpy.
      emaMsPerPctRef.current = emaMsPerPctRef.current == null
        ? instant
        : emaMsPerPctRef.current * 0.8 + instant * 0.2
    }
    lastPctRef.current = pct
    lastAtRef.current = now
    // Only surface an estimate once we've made real progress; the first
    // few percent are dominated by wasm/hardware warmup and give wildly
    // pessimistic numbers.
    if (pct < 5 || pct >= 99 || emaMsPerPctRef.current == null) return
    const remainingMs = emaMsPerPctRef.current * (100 - pct)
    setLabel(formatRemaining(remainingMs))
  }, [pct, active])

  return label
}

function formatRemaining(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  if (s < 60) return `about ${s}s remaining`
  const m = Math.round(s / 60)
  if (m < 60) return `about ${m} min remaining`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `about ${h}h ${mm}m remaining`
}

interface ProgressListProps {
  entries: FileEntry[]
  announcement?: string
}

const ROW_H = 56
const VIRTUALIZE_AT = 50
const MAX_LIST_H = 420

export function ProgressList({ entries, announcement }: ProgressListProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const useVirt = entries.length > VIRTUALIZE_AT

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 8,
    enabled: useVirt,
  })

  const done = entries.filter((e) => e.status === 'done').length
  const errors = entries.filter((e) => e.status === 'error').length
  const total = entries.length
  const overallPct = total > 0
    ? Math.round(entries.reduce((sum, e) => sum + (e.status === 'done' ? 100 : e.status === 'error' ? 100 : e.progress || 0), 0) / total)
    : 0
  const active = total > 0 && done + errors < total
  const eta = useEtaLabel(overallPct, active)

  return (
    <div className="space-y-3">
      {/* Summary + live announcement */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-fg">
          Converting {total} file{total !== 1 ? 's' : ''}… <span className="text-primary tabular-nums font-semibold">{overallPct}%</span>
          {eta && (
            <span className="ml-2 text-fg-muted font-normal tabular-nums">· {eta}</span>
          )}
        </span>
        <span className="text-fg-muted tabular-nums">
          {done + errors} / {total}
        </span>
      </div>

      {/* Accessible live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* List */}
      <div
        ref={parentRef}
        className="overflow-y-auto rounded-lg border border-border"
        style={{ maxHeight: MAX_LIST_H }}
        role="list"
        aria-label="File conversion progress"
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
                <ProgressRow entry={entries[vi.index]} />
              </div>
            ))}
          </div>
        ) : (
          entries.map((entry) => <ProgressRow key={entry.id} entry={entry} />)
        )}
      </div>

      {errors > 0 && (
        <p className="text-xs text-error" role="alert">
          {errors} file{errors > 1 ? 's' : ''} failed — successful files are still available below.
        </p>
      )}
    </div>
  )
}

function ProgressRow({ entry }: { entry: FileEntry }) {
  const { file, status, progress, error } = entry
  const isPending = status === 'pending'
  const isProcessing = status === 'processing'
  const isDone = status === 'done'
  const isError = status === 'error'

  return (
    <div
      role="listitem"
      data-testid="progress-item"
      className={cn(
        'flex items-center gap-3 border-b border-border px-4 last:border-0',
        'bg-bg-elevated',
      )}
      style={{ height: ROW_H }}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {(isPending || isProcessing) && (
          <Loader2
            className={cn('h-4 w-4 text-fg-subtle', isProcessing && 'animate-spin text-primary')}
            aria-hidden="true"
          />
        )}
        {isDone && (
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
        )}
        {isError && (
          <XCircle className="h-4 w-4 text-error" aria-hidden="true" />
        )}
      </div>

      {/* Filename + progress */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="truncate text-sm font-medium text-fg"
            title={file.name}
          >
            {file.name}
          </span>
          <span className="shrink-0 text-xs text-fg-muted tabular-nums">
            {isProcessing || isPending ? `${Math.round(progress)}% · ` : ''}{formatBytes(file.size)}
          </span>
        </div>

        {isError && error ? (
          <p className="mt-0.5 truncate text-xs text-error">{error}</p>
        ) : (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label={`${file.name}: ${progress}%`}
            className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-bg-muted"
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-200',
                isDone ? 'bg-success' : isError ? 'bg-error' : 'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
