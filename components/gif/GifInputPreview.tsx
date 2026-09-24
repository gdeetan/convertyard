'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { gifCompress } from '@/lib/converters/gif-compress'
import type { ConversionResult } from '@/lib/types'

interface Props {
  files: File[]
  options: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
  onRemove?: (index: number) => void
}

const BIG_FILE_BYTES = 20 * 1024 * 1024
const DEBOUNCE_MS = 400

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function pctSaved(original: number, compressed: number): string {
  if (original === 0) return '0%'
  const saved = Math.round((1 - compressed / original) * 100)
  return saved >= 0 ? `${saved}% smaller` : `${Math.abs(saved)}% larger`
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) { setUrl(null); return }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

function GifCard({
  file,
  index,
  isActive,
  onSelect,
  onRemove,
}: {
  file: File
  index: number
  isActive: boolean
  onSelect: () => void
  onRemove?: (index: number) => void
}) {
  const url = useObjectUrl(file)
  return (
    <div
      className={
        'group relative flex flex-col overflow-hidden rounded border transition-colors ' +
        (isActive ? 'border-primary' : 'border-border hover:border-fg-subtle')
      }
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex aspect-square items-center justify-center bg-bg-subtle"
        title={file.name}
      >
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </button>
      <div className="flex items-baseline justify-between gap-2 border-t border-border bg-bg px-2 py-1.5 text-xs">
        <span className="truncate text-fg" title={file.name}>{file.name}</span>
        <span className="shrink-0 text-fg-muted">{formatBytes(file.size)}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(index) }}
          className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  )
}

type PreviewStatus = 'idle' | 'running' | 'done' | 'error' | 'skipped'

interface PreviewState {
  status: PreviewStatus
  file: File | null
  error: string | null
  forFileKey: string | null
  forOptionsKey: string | null
}

function fileKey(f: File | null): string {
  if (!f) return ''
  return `${f.name}|${f.size}|${f.lastModified}`
}

function optionsKey(o: Record<string, unknown>): string {
  const relevant = ['preset', 'maxSizeKb', 'advanced', 'lossy', 'colors', 'frameStride', 'dither']
  return relevant.map(k => `${k}=${String(o[k] ?? '')}`).join('&')
}

export function GifInputPreview({ files, options, onRemove }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [manualTriggerKey, setManualTriggerKey] = useState(0)
  const [preview, setPreview] = useState<PreviewState>({
    status: 'idle',
    file: null,
    error: null,
    forFileKey: null,
    forOptionsKey: null,
  })
  const runIdRef = useRef(0)

  const totalBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files])

  useEffect(() => {
    if (activeIndex >= files.length && files.length > 0) setActiveIndex(0)
  }, [files.length, activeIndex])

  const active = files[activeIndex] ?? null
  const activeUrl = useObjectUrl(active)
  const previewUrl = useObjectUrl(preview.file)

  const activeKey = fileKey(active)
  const optKey = optionsKey(options)
  const isBigFile = active ? active.size > BIG_FILE_BYTES : false

  // Debounced re-compress on option / active-file change (or manual trigger for big files).
  useEffect(() => {
    if (!active) return
    if (isBigFile && manualTriggerKey === 0) {
      setPreview({
        status: 'skipped',
        file: null,
        error: null,
        forFileKey: activeKey,
        forOptionsKey: optKey,
      })
      return
    }
    // Skip if we already have a fresh preview for this file+options.
    if (
      preview.status === 'done' &&
      preview.forFileKey === activeKey &&
      preview.forOptionsKey === optKey
    ) {
      return
    }

    const myRunId = ++runIdRef.current
    const timer = setTimeout(async () => {
      setPreview((prev) => ({ ...prev, status: 'running', error: null }))
      try {
        const results: ConversionResult[] = await gifCompress([active], options)
        if (myRunId !== runIdRef.current) return
        const r = results[0]
        if (r instanceof Error) {
          setPreview({
            status: 'error',
            file: null,
            error: r.message,
            forFileKey: activeKey,
            forOptionsKey: optKey,
          })
          return
        }
        const outFile = r instanceof File ? r : r.file
        setPreview({
          status: 'done',
          file: outFile,
          error: null,
          forFileKey: activeKey,
          forOptionsKey: optKey,
        })
      } catch (err) {
        if (myRunId !== runIdRef.current) return
        setPreview({
          status: 'error',
          file: null,
          error: err instanceof Error ? err.message : 'preview failed',
          forFileKey: activeKey,
          forOptionsKey: optKey,
        })
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, optKey, isBigFile, manualTriggerKey])

  // Reset manual trigger when active file changes.
  useEffect(() => {
    setManualTriggerKey(0)
  }, [activeKey])

  if (files.length === 0) return null

  const previewSizeLabel = (() => {
    if (!active) return null
    if (preview.status === 'running') return 'Compressing preview…'
    if (preview.status === 'error') return preview.error
    if (preview.status === 'skipped') return `File over 20 MB — preview paused`
    if (preview.status === 'done' && preview.file) {
      return `${formatBytes(preview.file.size)} · ${pctSaved(active.size, preview.file.size)}`
    }
    return 'Waiting…'
  })()

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-fg-subtle">
          Live preview {files.length > 1 ? `— ${files.length} files, ${formatBytes(totalBytes)} total` : ''}
        </span>
        {files.length > 1 && (
          <span className="text-xs text-fg-subtle">Click a thumbnail to preview a different file</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Original
            </span>
            {active && (
              <span className="text-sm font-medium text-fg">{formatBytes(active.size)}</span>
            )}
          </div>
          <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded border border-border bg-bg-subtle">
            {activeUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeUrl}
                alt={active?.name ?? 'Original GIF'}
                className="max-h-[360px] max-w-full object-contain"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Preview at current settings
            </span>
            <span
              className={
                'truncate text-sm font-medium ' +
                (preview.status === 'error'
                  ? 'text-red-600'
                  : preview.status === 'done'
                  ? 'text-primary'
                  : 'text-fg-muted')
              }
              title={previewSizeLabel ?? ''}
            >
              {previewSizeLabel}
            </span>
          </div>
          <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded border border-border bg-bg-subtle">
            {preview.status === 'done' && previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Compressed preview"
                className="max-h-[360px] max-w-full object-contain"
              />
            )}
            {preview.status === 'running' && (
              <div className="flex flex-col items-center gap-2 text-xs text-fg-muted">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-fg-muted border-t-transparent" />
                <span>Rendering preview…</span>
              </div>
            )}
            {preview.status === 'skipped' && (
              <div className="flex flex-col items-center gap-2 p-4 text-center text-xs text-fg-muted">
                <span>File is over 20 MB. Live preview is paused so your browser stays responsive.</span>
                <button
                  type="button"
                  onClick={() => setManualTriggerKey((k) => k + 1)}
                  className="rounded border border-border bg-bg px-3 py-1 text-xs font-medium text-fg hover:border-primary hover:text-primary"
                >
                  Preview this file
                </button>
              </div>
            )}
            {preview.status === 'error' && (
              <div className="p-4 text-center text-xs text-red-600">{preview.error}</div>
            )}
            {preview.status === 'idle' && (
              <div className="text-xs text-fg-muted">Preview will appear here.</div>
            )}
          </div>
        </div>
      </div>

      {files.length > 1 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {files.slice(0, 30).map((f, i) => (
            <GifCard
              key={`${f.name}-${f.size}-${i}`}
              file={f}
              index={i}
              isActive={i === activeIndex}
              onSelect={() => setActiveIndex(i)}
              onRemove={onRemove}
            />
          ))}
          {files.length > 30 && (
            <div className="flex aspect-square items-center justify-center rounded border border-dashed border-border text-xs text-fg-muted">
              +{files.length - 30} more
            </div>
          )}
        </div>
      )}
    </div>
  )
}
