'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { convertViaWorker } from '@/lib/converters/vips-client'

type Row = {
  name: string
  type: string
  size: string
  time: string
  external: boolean
}

type Phase = 'idle' | 'converting' | 'done' | 'error'

const ACCEPT_EXT_RE = /\.(jpe?g|png|webp|avif|heic|heif|gif|tiff?|bmp)$/i

function formatBytes(n: number): string {
  if (!n || n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function shortName(url: string): string {
  try {
    const u = new URL(url, window.location.href)
    const parts = u.pathname.split('/').filter(Boolean)
    return parts[parts.length - 1] || u.hostname
  } catch {
    return url
  }
}

function inferType(entry: PerformanceResourceTiming): string {
  const n = entry.name.toLowerCase()
  if (n.endsWith('.wasm')) return 'wasm'
  if (n.endsWith('.js') || entry.initiatorType === 'script') return 'script'
  if (n.endsWith('.css')) return 'stylesheet'
  if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') return 'fetch'
  return entry.initiatorType || 'other'
}

function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true
  return ACCEPT_EXT_RE.test(file.name)
}

export function DevToolsLive() {
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [rows, setRows] = useState<Row[]>([])
  const [droppedName, setDroppedName] = useState<string | null>(null)
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<PerformanceObserver | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentHost = useMemo(
    () => (typeof window !== 'undefined' ? window.location.host : ''),
    [],
  )

  const startObserving = useCallback(() => {
    if (typeof PerformanceObserver === 'undefined') return
    const startTime = performance.now()
    const obs = new PerformanceObserver((list) => {
      const captured: Row[] = []
      for (const e of list.getEntries()) {
        if (e.startTime < startTime) continue
        const entry = e as PerformanceResourceTiming
        let external = true
        try {
          external = new URL(entry.name).host !== currentHost
        } catch {
          external = false
        }
        captured.push({
          name: shortName(entry.name),
          type: inferType(entry),
          size: formatBytes(entry.transferSize || entry.encodedBodySize || 0),
          time: `${Math.round(entry.duration)} ms`,
          external,
        })
      }
      if (captured.length) setRows((r) => [...r, ...captured])
    })
    obs.observe({ type: 'resource', buffered: false })
    observerRef.current = obs
  }, [currentHost])

  const stopObserving = useCallback(() => {
    observerRef.current?.disconnect()
    observerRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      stopObserving()
      if (result) URL.revokeObjectURL(result.url)
    }
  }, [stopObserving, result])

  const handleFile = useCallback(
    async (file: File) => {
      if (!isImageFile(file)) {
        setError('Pick an image file (JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP).')
        setPhase('error')
        return
      }
      setError(null)
      setRows([])
      setResult(null)
      setDroppedName(file.name)
      setPhase('converting')
      startObserving()
      try {
        const out = await convertViaWorker(file, 'webp', { quality: 80 })
        const url = URL.createObjectURL(out)
        setResult({ url, name: out.name, size: out.size })
        setPhase('done')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Conversion failed')
        setPhase('error')
      } finally {
        setTimeout(stopObserving, 500)
      }
    },
    [startObserving, stopObserving],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const externalCount = rows.filter((r) => r.external).length

  if (!mounted) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg-muted/40 p-8 text-center">
        <p className="mb-4 text-sm text-fg-muted">
          Want to see it for real? Load a mini live demo below (adds ~2 MB of WASM).
        </p>
        <button
          type="button"
          onClick={() => setMounted(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          Load live demo
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Full-width Chrome DevTools console panel */}
      <div className="overflow-hidden rounded-lg border border-[#3c4043] bg-[#202124] font-mono text-[12px] shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-[#3c4043] bg-[#292a2d] px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-sans text-[11px] text-[#9aa0a6]">DevTools — convertyard.com</span>
        </div>

        {/* Tab strip */}
        <div className="flex items-center border-b border-[#3c4043] bg-[#292a2d] px-2">
          {['Elements', 'Console', 'Sources', 'Network', 'Performance', 'Application'].map((tab) => (
            <span
              key={tab}
              className={cn(
                'px-3 py-2 font-sans text-[11px]',
                tab === 'Network'
                  ? 'border-b-2 border-[#8ab4f8] text-[#e8eaed]'
                  : 'text-[#9aa0a6]',
              )}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 border-b border-[#3c4043] bg-[#202124] px-3 py-1.5 font-sans text-[11px] text-[#9aa0a6]">
          <span className="text-[#f28b82]">●</span>
          <span>Recording</span>
          <span className="text-[#3c4043]">|</span>
          <span>{rows.length} requests</span>
          <span className="text-[#3c4043]">|</span>
          <span className={externalCount ? 'text-[#f28b82]' : 'text-[#81c995]'}>
            {externalCount} to external servers
          </span>
        </div>

        {/* Column header */}
        <div className="grid grid-cols-[3fr_1fr_1fr_1fr] border-b border-[#3c4043] bg-[#292a2d] px-3 py-1 text-[10px] uppercase tracking-wide text-[#9aa0a6]">
          <span>Name</span>
          <span>Type</span>
          <span>Size</span>
          <span>Time</span>
        </div>

        {/* Log body */}
        <div className="max-h-[420px] min-h-[280px] divide-y divide-[#292a2d] overflow-y-auto bg-[#202124]">
          {rows.length === 0 && phase === 'idle' && (
            <div className="px-3 py-6 text-center font-sans italic text-[#5f6368]">
              Drop an image below — requests will stream in here.
            </div>
          )}

          {rows.map((row, i) => (
            <div
              key={`${row.name}-${i}`}
              className="grid grid-cols-[3fr_1fr_1fr_1fr] items-center px-3 py-1"
            >
              <span
                className={cn('truncate', row.external ? 'text-[#f28b82]' : 'text-[#8ab4f8]')}
                title={row.name}
              >
                {row.external ? '⚠ ' : ''}
                {row.name}
              </span>
              <span className="text-[#9aa0a6]">{row.type}</span>
              <span className="text-[#9aa0a6]">{row.size}</span>
              <span className="text-[#9aa0a6]">{row.time}</span>
            </div>
          ))}

          {droppedName && (
            <div className="flex items-center gap-2 border-l-2 border-[#fdd663] bg-[#2d2a1a] px-3 py-1.5">
              <span className="text-[11px] text-[#fdd663]">▶ dropped: {droppedName}</span>
              {phase === 'converting' && (
                <span className="ml-auto flex items-center gap-1 text-[#9aa0a6]">
                  <span className="inline-block h-2 w-2 animate-spin rounded-full border border-[#8ab4f8] border-t-transparent" />
                  running in browser (no upload)
                </span>
              )}
            </div>
          )}

          {phase === 'done' && result && (
            <div className="flex items-center gap-2 border-l-2 border-[#81c995] bg-[#1a2a1e] px-3 py-1.5">
              <span className="text-[#81c995]">✓</span>
              <span className="text-[#81c995]">
                Done — {formatBytes(result.size)} WebP created locally, zero uploads.
              </span>
              <a
                href={result.url}
                download={result.name}
                className="ml-auto text-[#8ab4f8] underline"
              >
                download
              </a>
            </div>
          )}

          {phase === 'error' && error && (
            <div className="border-l-2 border-[#f28b82] bg-[#2a1a1a] px-3 py-1.5 text-[#f28b82]">
              ✗ {error}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-[#3c4043] bg-[#292a2d] px-3 py-1 font-sans text-[10px] text-[#9aa0a6]">
          <span>{rows.length} requests</span>
          <span className={externalCount ? 'text-[#f28b82]' : 'text-[#81c995]'}>
            {externalCount === 0 ? 'No external requests during conversion' : `${externalCount} external`}
          </span>
        </div>
      </div>

      {/* Dropzone under the panel */}
      <label
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm transition',
          phase === 'converting'
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-bg-elevated text-fg-muted hover:border-primary/60',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif,.avif,.tif,.tiff,.bmp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        <p className="font-medium">
          {phase === 'converting'
            ? `Converting ${droppedName}…`
            : phase === 'done'
              ? 'Done — drop another to re-run'
              : 'Drop an image here or click to pick one'}
        </p>
        {phase !== 'converting' && (
          <p className="mt-1 text-xs text-fg-subtle">
            JPG · PNG · WebP · AVIF · HEIC · GIF · TIFF · BMP
          </p>
        )}
      </label>
    </div>
  )
}
