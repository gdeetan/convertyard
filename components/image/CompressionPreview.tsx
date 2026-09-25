'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { imageCompress } from '@/lib/converters/image-compress'
import type { ToolOptions } from '@/lib/types'

interface Props {
  files: File[]
  results: (File | null)[]
  options: ToolOptions
  onResultEdit?: (index: number, newFile: File) => void
}

const MAX_PREVIEW = 4
const MIN_ZOOM = 1
const MAX_ZOOM = 8

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function pctSmaller(original: number, compressed: number): string {
  if (original === 0) return '0%'
  return `${Math.round((1 - compressed / original) * 100)}%`
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

// ── Single preview slot ──────────────────────────────────────────────────────

function PreviewSlot({
  index,
  file,
  initialResult,
  initialOptions,
  onResultEdit,
}: {
  index: number
  file: File
  initialResult: File | null
  initialOptions: ToolOptions
  onResultEdit?: (index: number, newFile: File) => void
}) {
  const baseQuality = typeof initialOptions.quality === 'number' ? initialOptions.quality : 80

  const [mode, setMode] = useState<'split' | 'side'>('split')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dividerX, setDividerX] = useState(50)
  const [quality, setQuality] = useState<number>(baseQuality)
  const [currentResult, setCurrentResult] = useState<File | null>(initialResult)
  const [reCompressing, setReCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const optionsRef = useRef(initialOptions)
  useEffect(() => { optionsRef.current = initialOptions }, [initialOptions])

  // Debounced re-compress on quality change (and initial seed when no result yet)
  const jobId = useRef(0)
  const lastAppliedQuality = useRef<number | null>(initialResult ? baseQuality : null)

  // Reset view when the underlying source file changes (not when initialResult
  // updates — that would clobber the user's per-image quality override, since
  // onResultEdit flows back through ToolShell and updates initialResult).
  const seededForFile = useRef<File | null>(null)
  useEffect(() => {
    if (seededForFile.current === file) return
    seededForFile.current = file
    setZoom(1); setPan({ x: 0, y: 0 }); setDividerX(50)
    setQuality(baseQuality)
    setCurrentResult(initialResult)
    setError(null)
    lastAppliedQuality.current = initialResult ? baseQuality : null
  }, [file, initialResult, baseQuality])

  useEffect(() => {
    // Run when quality drifts from the last applied value, OR when we've never
    // compressed this file yet (initial seed on idle-phase drop).
    if (lastAppliedQuality.current === quality) return
    const myId = ++jobId.current
    setReCompressing(true)
    setError(null)
    const delay = lastAppliedQuality.current === null ? 0 : 350
    const t = setTimeout(async () => {
      try {
        const res = await imageCompress([file], { ...optionsRef.current, quality })
        if (myId !== jobId.current) return
        const r = res[0]
        let outFile: File | null = null
        if (r instanceof File) outFile = r
        else if (r && !(r instanceof Error) && 'file' in r) outFile = r.file
        if (outFile) {
          setCurrentResult(outFile)
          lastAppliedQuality.current = quality
          onResultEdit?.(index, outFile)
        } else if (r instanceof Error) {
          setError(r.message)
        }
      } catch (e) {
        if (myId === jobId.current) setError(e instanceof Error ? e.message : 'Re-compression failed')
      } finally {
        if (myId === jobId.current) setReCompressing(false)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [quality, file, index, onResultEdit])

  const originalUrl = useObjectUrl(file)
  const compressedUrl = useObjectUrl(currentResult)

  // ── Pan drag ──
  const containerRef = useRef<HTMLDivElement>(null)
  const panDragging = useRef(false)
  const panStart = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 })

  const onPanPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return
    panDragging.current = true
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    panStart.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y }
  }
  const onPanPointerMove = (e: React.PointerEvent) => {
    if (!panDragging.current) return
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.clientX),
      y: panStart.current.panY + (e.clientY - panStart.current.clientY),
    })
  }
  const onPanPointerUp = () => { panDragging.current = false }

  // Wheel zoom (bonus — slider is primary)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      setZoom((z) => {
        const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor))
        const ratio = nz / z
        setPan((p) => ({ x: cx - ratio * (cx - p.x), y: cy - ratio * (cy - p.y) }))
        return nz
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // ── Divider drag (split mode only) ──
  const dividerDragging = useRef(false)
  const updateDivider = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDividerX(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)))
  }, [])
  const onDividerPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    dividerDragging.current = true
    ;(e.target as Element).setPointerCapture(e.pointerId)
    updateDivider(e.clientX)
  }
  const onDividerPointerMove = (e: React.PointerEvent) => {
    if (dividerDragging.current) updateDivider(e.clientX)
  }
  const onDividerPointerUp = () => { dividerDragging.current = false }

  const imgTransform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
  const savedPct = currentResult ? pctSmaller(file.size, currentResult.size) : '—'
  const qualityChanged = quality !== baseQuality

  if (!originalUrl) return null

  return (
    <div className="space-y-2 rounded-lg border border-border bg-bg-elevated p-3">
      {/* Filename + mode toggle */}
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-fg" title={file.name}>{file.name}</span>
        <div className="flex shrink-0 items-center gap-1 rounded border border-border bg-bg p-0.5">
          <button
            type="button"
            onClick={() => setMode('split')}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${mode === 'split' ? 'bg-primary text-white' : 'text-fg-muted hover:text-fg'}`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setMode('side')}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${mode === 'side' ? 'bg-primary text-white' : 'text-fg-muted hover:text-fg'}`}
          >
            Side-by-side
          </button>
        </div>
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-2">
        <span className="w-10 shrink-0 text-xs text-fg-subtle">Zoom</span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
        />
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-fg-muted">{zoom.toFixed(1)}×</span>
        <button
          type="button"
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
          disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
          className="shrink-0 rounded px-2 py-0.5 text-xs text-fg-muted transition-colors hover:bg-bg-hover disabled:opacity-40"
        >
          Fit
        </button>
      </div>

      {/* Viewer */}
      {mode === 'split' ? (
        <div
          ref={containerRef}
          className="relative select-none overflow-hidden rounded border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)] bg-[length:16px_16px]"
          style={{ height: 320 }}
        >
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - dividerX}% 0 0)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={originalUrl} alt="Original" className="absolute inset-0 h-full w-full object-contain"
              style={{ transform: imgTransform, transformOrigin: '0 0' }} draggable={false} />
          </div>
          <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${dividerX}%)` }}>
            {compressedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={compressedUrl} alt="Compressed" className="absolute inset-0 h-full w-full object-contain"
                style={{ transform: imgTransform, transformOrigin: '0 0' }} draggable={false} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-fg-subtle">Compressing…</div>
            )}
          </div>
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
            style={{ left: `${dividerX}%`, transform: 'translateX(-50%)' }} />
          <div
            className="absolute top-1/2 z-20 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border border-border bg-white shadow-md"
            style={{ left: `${dividerX}%` }}
            onPointerDown={onDividerPointerDown}
            onPointerMove={onDividerPointerMove}
            onPointerUp={onDividerPointerUp}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M4 3L1 6L4 9M8 3L11 6L8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div
            className={`absolute inset-0 z-10 touch-none ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-ew-resize'}`}
            onPointerDown={zoom > 1 ? onPanPointerDown : undefined}
            onPointerMove={zoom > 1 ? onPanPointerMove : undefined}
            onPointerUp={zoom > 1 ? onPanPointerUp : undefined}
          />
          <div className="pointer-events-none absolute bottom-1.5 left-1.5 z-30 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            Original · {formatBytes(file.size)}
          </div>
          <div className="pointer-events-none absolute bottom-1.5 right-1.5 z-30 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {currentResult
              ? `Compressed · ${formatBytes(currentResult.size)} · ${savedPct} smaller`
              : 'Compressing…'}
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className={`grid grid-cols-2 gap-1 overflow-hidden rounded border border-border ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ height: 320 }}
          onPointerDown={zoom > 1 ? onPanPointerDown : undefined}
          onPointerMove={zoom > 1 ? onPanPointerMove : undefined}
          onPointerUp={zoom > 1 ? onPanPointerUp : undefined}
        >
          {(['original', 'compressed'] as const).map((side) => {
            const url = side === 'original' ? originalUrl : compressedUrl
            const label = side === 'original'
              ? `Original · ${formatBytes(file.size)}`
              : currentResult
                ? `Compressed · ${formatBytes(currentResult.size)} · ${savedPct} smaller`
                : 'Compressing…'
            return (
              <div key={side} className="relative select-none overflow-hidden bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)] bg-[length:16px_16px]">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={side}
                    className="absolute inset-0 h-full w-full object-contain"
                    style={{ transform: imgTransform, transformOrigin: '0 0' }}
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-fg-subtle">Compressing…</div>
                )}
                <div className="pointer-events-none absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {label}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quality slider */}
      <div className="flex items-center gap-2">
        <span className="w-10 shrink-0 text-xs text-fg-subtle">Quality</span>
        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={quality}
          onChange={(e) => setQuality(parseInt(e.target.value, 10))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary"
        />
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-fg-muted">{quality}</span>
        <span className="w-24 shrink-0 text-right text-[10px] text-fg-subtle">
          {reCompressing ? 'Re-compressing…' : qualityChanged ? 'Override applied' : ` `}
        </span>
      </div>

      {error && <div className="text-[11px] text-red-600">{error}</div>}
    </div>
  )
}

// ── Root export ──────────────────────────────────────────────────────────────

export function ImageCompressionPreview({ files, results, options, onResultEdit }: Props) {
  // Preview the first MAX_PREVIEW files. Result can be null (idle phase before
  // Compress is clicked) — the slot will run its own initial compression.
  const slots = useMemo(() => {
    const out: Array<{ index: number; file: File; result: File | null }> = []
    for (let i = 0; i < files.length && out.length < MAX_PREVIEW; i++) {
      out.push({ index: i, file: files[i], result: results[i] ?? null })
    }
    return out
  }, [files, results])

  if (slots.length === 0) return null

  const remaining = files.length - slots.length
  const gridCols = slots.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-fg">Before / After preview</span>
        {remaining > 0 && (
          <span className="text-xs text-fg-subtle">
            Showing first {slots.length} of {files.length}. The rest are ready in the results below.
          </span>
        )}
      </div>

      <div className={`grid gap-3 ${gridCols}`}>
        {slots.map((s) => (
          <PreviewSlot
            key={`${s.file.name}-${s.file.size}-${s.index}`}
            index={s.index}
            file={s.file}
            initialResult={s.result}
            initialOptions={options}
            onResultEdit={onResultEdit}
          />
        ))}
      </div>

      <p className="text-[11px] text-fg-subtle">
        Tip: adjust each image&rsquo;s Quality slider to fine-tune — changes are applied to that file&rsquo;s
        download and to the ZIP.
      </p>
    </div>
  )
}
