'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  files: File[]
  results: (File | null)[]
  options: Record<string, unknown>
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function pct(original: number, compressed: number): string {
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

// ── Comparison slider with zoom + pan ────────────────────────────────────────

function ComparisonSlider({
  originalUrl,
  compressedUrl,
  originalSize,
  compressedSize,
}: {
  originalUrl: string
  compressedUrl: string
  originalSize: number
  compressedSize: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Divider
  const [dividerX, setDividerX] = useState(50) // % of container width
  const dividerDragging = useRef(false)

  // Zoom + pan — transform-origin: top-left (0 0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const panDragging = useRef(false)
  const panStart = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 })

  // Reset zoom/pan when images change
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setDividerX(50)
  }, [originalUrl, compressedUrl])

  // Wheel zoom: zoom centered on cursor position
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      // Cursor relative to container top-left
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      setZoom((z) => {
        const newZoom = Math.max(1, Math.min(10, z * factor))
        const ratio = newZoom / z
        // Keep the point under the cursor stationary
        setPan((p) => ({
          x: cx - ratio * (cx - p.x),
          y: cy - ratio * (cy - p.y),
        }))
        return newZoom
      })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // ── Divider drag ────────────────────────────────────────────────────────
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

  // ── Pan drag ─────────────────────────────────────────────────────────
  const onPanPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return // nothing to pan at 1×
    panDragging.current = true
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    panStart.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y }
  }
  const onPanPointerMove = (e: React.PointerEvent) => {
    if (!panDragging.current) return
    const dx = e.clientX - panStart.current.clientX
    const dy = e.clientY - panStart.current.clientY
    setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy })
  }
  const onPanPointerUp = () => { panDragging.current = false }

  // Clamp pan so image can't drift entirely off-screen
  const clampedPan = pan // we could clamp here but it interrupts inertia feel; skip

  const imgTransform = `translate(${clampedPan.x}px, ${clampedPan.y}px) scale(${zoom})`

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-fg-subtle">Zoom:</span>
          <button
            type="button"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${zoom === 1 ? 'bg-primary text-white' : 'bg-bg-elevated text-fg hover:bg-bg-hover'}`}
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => { setZoom(2); setPan({ x: 0, y: 0 }) }}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${zoom === 2 ? 'bg-primary text-white' : 'bg-bg-elevated text-fg hover:bg-bg-hover'}`}
          >
            2×
          </button>
          <button
            type="button"
            onClick={() => { setZoom(4); setPan({ x: 0, y: 0 }) }}
            className={`rounded px-2 py-0.5 text-xs transition-colors ${zoom === 4 ? 'bg-primary text-white' : 'bg-bg-elevated text-fg hover:bg-bg-hover'}`}
          >
            4×
          </button>
          {zoom !== 1 && zoom !== 2 && zoom !== 4 && (
            <span className="text-xs text-fg-subtle">{zoom.toFixed(1)}×</span>
          )}
        </div>
        <span className="text-xs text-fg-subtle">
          {zoom > 1 ? 'Drag to pan · scroll to zoom' : 'Scroll to zoom · drag divider to compare'}
        </span>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className="relative select-none overflow-hidden rounded-lg border border-border bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)] bg-[length:16px_16px]"
        style={{ height: 400 }}
      >
        {/* Original image (left side — everything left of divider) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - dividerX}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={originalUrl}
            alt="Original"
            className="absolute inset-0 h-full w-full object-contain"
            style={{ transform: imgTransform, transformOrigin: '0 0' }}
            draggable={false}
          />
        </div>

        {/* Compressed image (right side — everything right of divider) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${dividerX}%)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={compressedUrl}
            alt="Compressed"
            className="absolute inset-0 h-full w-full object-contain"
            style={{ transform: imgTransform, transformOrigin: '0 0' }}
            draggable={false}
          />
        </div>

        {/* Divider line */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
          style={{ left: `${dividerX}%`, transform: 'translateX(-50%)' }}
        />

        {/* Divider handle — higher z-index than pan overlay */}
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

        {/* Pan overlay — behind handle, cursor changes with zoom */}
        <div
          className={`absolute inset-0 z-10 touch-none ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-ew-resize'}`}
          onPointerDown={zoom > 1 ? onPanPointerDown : undefined}
          onPointerMove={zoom > 1 ? onPanPointerMove : undefined}
          onPointerUp={zoom > 1 ? onPanPointerUp : undefined}
        />

        {/* Labels */}
        <div className="pointer-events-none absolute bottom-2 left-2 z-30 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
          Original · {formatBytes(originalSize)}
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 z-30 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
          Compressed · {formatBytes(compressedSize)} · {pct(originalSize, compressedSize)} smaller
        </div>
      </div>
    </div>
  )
}

// ── Thumbnail ─────────────────────────────────────────────────────────────────

function Thumbnail({ file, active, onClick }: { file: File; active: boolean; onClick: () => void }) {
  const url = useObjectUrl(file)
  if (!url) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded border-2 transition-colors ${
        active ? 'border-primary' : 'border-border hover:border-border-hover'
      }`}
      title={file.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={file.name} className="h-12 w-12 rounded object-cover" />
    </button>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

export function ImageCompressionPreview({ files, results }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  useEffect(() => {
    const firstDone = results.findIndex((r) => r !== null)
    if (firstDone >= 0) setActiveIdx(firstDone)
  }, [results])

  const doneCount = results.filter(Boolean).length
  if (doneCount === 0) return null

  const activeFile = files[activeIdx] ?? null
  const activeResult = results[activeIdx] ?? null

  const originalUrl = useObjectUrl(activeFile)
  const compressedUrl = useObjectUrl(activeResult)

  if (!originalUrl || !compressedUrl || !activeFile || !activeResult) return null

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-fg">Before / After</span>

      <ComparisonSlider
        originalUrl={originalUrl}
        compressedUrl={compressedUrl}
        originalSize={activeFile.size}
        compressedSize={activeResult.size}
      />

      {files.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {files.map((file, i) => {
            if (!results[i]) return null
            return (
              <Thumbnail
                key={`${file.name}-${file.size}`}
                file={file}
                active={i === activeIdx}
                onClick={() => setActiveIdx(i)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
