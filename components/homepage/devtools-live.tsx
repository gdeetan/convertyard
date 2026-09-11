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
      if (!file.type.startsWith('image/')) {
        setError('Pick an image file (JPG, PNG, WebP, etc.)')
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
        // give the observer a tick to flush entries
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
      <div className="flex flex-col items-start justify-center rounded-xl border border-dashed border-border bg-bg-muted/40 p-6">
        <p className="mb-3 text-sm text-fg-muted">
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
      {/* Dropzone */}
      <label
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm transition',
          phase === 'converting'
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-border bg-white text-fg-muted hover:border-primary/60',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        {phase === 'converting'
          ? `Converting ${droppedName}…`
          : phase === 'done'
            ? `Done — drop another to re-run`
            : 'Drop a JPG here or click to pick one'}
      </label>

      {/* DevTools panel */}
      <div className="overflow-hidden rounded-xl border border-border bg-white font-mono text-[11px] shadow-sm">
        <div className="flex items-center border-b border-[#dadce0] bg-[#f1f3f4] px-2">
          {['Elements', 'Console', 'Sources', 'Network', 'Performance'].map((tab) => (
            <span
              key={tab}
              className={cn(
                'px-3 py-2 font-sans text-[11px]',
                tab === 'Network'
                  ? 'border-b-2 border-[#1a73e8] text-[#1a73e8]'
                  : 'text-[#5f6368]',
              )}
            >
              {tab}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-1 text-[10px] text-[#5f6368]">
          <span>Name</span>
          <span>Type</span>
          <span>Size</span>
          <span>Time</span>
        </div>

        <div className="max-h-[240px] min-h-[130px] divide-y divide-[#f1f3f4] overflow-y-auto bg-white">
          {rows.length === 0 && phase === 'idle' && (
            <div className="px-3 py-3 italic text-[#80868b]">
              Requests captured during conversion appear here.
            </div>
          )}

          {rows.map((row, i) => (
            <div
              key={`${row.name}-${i}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-3 py-1.5"
            >
              <span className="truncate text-[#1a73e8]" title={row.name}>
                {row.name}
              </span>
              <span className="text-[#5f6368]">{row.type}</span>
              <span className="text-[#5f6368]">{row.size}</span>
              <span className="text-[#5f6368]">{row.time}</span>
            </div>
          ))}

          {droppedName && (
            <div className="flex items-center gap-2 bg-[#fff8e1] px-3 py-1.5">
              <span className="text-[10px] text-[#e65100]">▶ {droppedName} dropped</span>
              {phase === 'converting' && (
                <span className="ml-auto flex items-center gap-1 text-[#5f6368]">
                  <span className="inline-block h-2 w-2 animate-spin rounded-full border border-[#1a73e8] border-t-transparent" />
                  running in browser
                </span>
              )}
            </div>
          )}

          {phase === 'done' && result && (
            <div className="flex items-center gap-2 bg-[#e8f5e9] px-3 py-1.5">
              <span className="text-[#2e7d32]">✓</span>
              <span className="text-[#2e7d32]">
                Done — {formatBytes(result.size)} WebP created locally.
              </span>
              <a
                href={result.url}
                download={result.name}
                className="ml-auto text-[#1a73e8] underline"
              >
                download
              </a>
            </div>
          )}

          {phase === 'error' && error && (
            <div className="bg-[#ffebee] px-3 py-1.5 text-[#c62828]">✗ {error}</div>
          )}
        </div>

        <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1 text-[10px] text-[#5f6368]">
          {rows.length} requests · {externalCount} to external servers
        </div>
      </div>
    </div>
  )
}
