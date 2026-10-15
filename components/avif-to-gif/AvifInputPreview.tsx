'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { avifGifPreview } from '@/lib/converters/gif-convert'

interface Props {
  files: File[]
  options: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
  onRemove?: (index: number) => void
}

const BIG_FILE_BYTES = 20 * 1024 * 1024
const DEBOUNCE_MS = 450
const PREVIEW_FRAMES = 24

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function sizeDelta(original: number, encoded: number): string {
  if (original === 0) return `${formatBytes(encoded)}`
  const ratio = encoded / original
  if (ratio >= 1) return `${Math.round((ratio - 1) * 100)}% larger`
  return `${Math.round((1 - ratio) * 100)}% smaller`
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

interface Meta {
  frameCount: number | null
  width: number | null
  height: number | null
}

function useAvifMeta(file: File | null): Meta {
  const [meta, setMeta] = useState<Meta>({ frameCount: null, width: null, height: null })
  useEffect(() => {
    if (!file) { setMeta({ frameCount: null, width: null, height: null }); return }
    let active = true
    const g = globalThis as unknown as {
      ImageDecoder?: new (init: { data: ArrayBuffer; type: string }) => {
        tracks: {
          ready: Promise<void>
          selectedTrack: { frameCount: number } | null
        }
        completed: Promise<void>
        decode: (opts: { frameIndex: number }) => Promise<{
          image: { displayWidth: number; displayHeight: number; close: () => void }
        }>
        close: () => void
      }
    }
    if (typeof g.ImageDecoder !== 'function') return
    file.arrayBuffer().then((buf) => {
      if (!active) return
      try {
        const decoder = new g.ImageDecoder!({ data: buf, type: 'image/avif' })
        decoder.tracks.ready.then(async () => {
          try {
            await decoder.completed
            if (!active) { decoder.close(); return }
            const track = decoder.tracks.selectedTrack
            const first = await decoder.decode({ frameIndex: 0 })
            if (!active) { first.image.close(); decoder.close(); return }
            setMeta({
              frameCount: track?.frameCount ?? 1,
              width: first.image.displayWidth,
              height: first.image.displayHeight,
            })
            first.image.close()
            decoder.close()
          } catch {
            decoder.close()
          }
        })
      } catch {
        // ignore — convert path will surface a clean error
      }
    })
    return () => { active = false }
  }, [file])
  return meta
}

function AvifCard({
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
          <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
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
  const relevant = ['framerate', 'outputWidth', 'loop']
  return relevant.map((k) => `${k}=${String(o[k] ?? '')}`).join('&')
}

export function AvifInputPreview({ files, options, onRemove }: Props) {
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

  const totalBytes = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files])

  useEffect(() => {
    if (activeIndex >= files.length && files.length > 0) setActiveIndex(0)
  }, [files.length, activeIndex])

  const active = files[activeIndex] ?? null
  const activeUrl = useObjectUrl(active)
  const previewUrl = useObjectUrl(preview.file)
  const meta = useAvifMeta(active)

  const activeKey = fileKey(active)
  const optKey = optionsKey(options)
  const isBigFile = active ? active.size > BIG_FILE_BYTES : false

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
        const out = await avifGifPreview(active, options, PREVIEW_FRAMES)
        if (myRunId !== runIdRef.current) return
        setPreview({
          status: 'done',
          file: out,
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

  useEffect(() => {
    setManualTriggerKey(0)
  }, [activeKey])

  if (files.length === 0) return null

  const previewStatusLabel = (() => {
    if (!active) return null
    if (preview.status === 'running') return 'Encoding preview…'
    if (preview.status === 'error') return preview.error
    if (preview.status === 'skipped') return 'File over 20 MB — click to preview'
    if (preview.status === 'done' && preview.file) {
      const label = meta.frameCount && meta.frameCount > PREVIEW_FRAMES
        ? `Preview — first ${PREVIEW_FRAMES} of ${meta.frameCount} frames`
        : 'Preview'
      return `${label} · ${formatBytes(preview.file.size)} · ${sizeDelta(active.size, preview.file.size)}`
    }
    return 'Waiting…'
  })()

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-fg-subtle">
          Live GIF preview {files.length > 1 ? `— ${files.length} files, ${formatBytes(totalBytes)} total` : ''}
        </span>
        {files.length > 1 && (
          <span className="text-xs text-fg-subtle">Click a thumbnail to preview a different file</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Original AVIF
            </span>
            {active && <span className="text-sm font-medium text-fg">{formatBytes(active.size)}</span>}
          </div>
          <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded border border-border bg-bg-subtle">
            {activeUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeUrl}
                alt={active?.name ?? 'Original AVIF'}
                className="max-h-[360px] max-w-full object-contain"
              />
            )}
          </div>
          {active && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
              <span className="truncate text-fg" title={active.name}>{active.name}</span>
              {meta.width && meta.height && <span>{meta.width} × {meta.height}</span>}
              {meta.frameCount != null && (
                <span>{meta.frameCount} {meta.frameCount === 1 ? 'frame (static)' : 'frames'}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              GIF preview at current settings
            </span>
            <span
              className={
                'text-xs ' +
                (preview.status === 'error' ? 'text-red-500' : 'text-fg-muted')
              }
            >
              {previewStatusLabel}
            </span>
          </div>
          <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded border border-border bg-bg-subtle">
            {preview.status === 'skipped' && (
              <button
                type="button"
                onClick={() => setManualTriggerKey((k) => k + 1)}
                className="rounded border border-border bg-bg px-3 py-1.5 text-sm text-fg hover:border-fg-subtle"
              >
                Generate preview
              </button>
            )}
            {preview.status === 'done' && previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="GIF preview"
                className="max-h-[360px] max-w-full object-contain"
              />
            )}
            {preview.status === 'running' && (
              <span className="text-sm text-fg-muted">Encoding sample GIF…</span>
            )}
            {preview.status === 'error' && (
              <span className="px-4 text-sm text-red-500">{preview.error}</span>
            )}
          </div>
        </div>
      </div>

      {files.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {files.map((f, i) => (
            <AvifCard
              key={`${f.name}-${f.lastModified}-${i}`}
              file={f}
              index={i}
              isActive={i === activeIndex}
              onSelect={() => setActiveIndex(i)}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
