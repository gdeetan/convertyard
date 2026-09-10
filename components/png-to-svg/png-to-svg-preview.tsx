'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const CHECKERBOARD = {
  backgroundImage:
    'linear-gradient(45deg, rgba(120,113,108,.22) 25%, transparent 25%), linear-gradient(-45deg, rgba(120,113,108,.22) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(120,113,108,.22) 75%), linear-gradient(-45deg, transparent 75%, rgba(120,113,108,.22) 75%)',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
  backgroundSize: '20px 20px',
} as const

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

function ZoomToolbar({
  zoom,
  onZoom,
  onFit,
}: {
  zoom: number
  onZoom: (next: number) => void
  onFit: () => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => onZoom(Math.max(1, Math.round((zoom / 1.25) * 100) / 100))}
        disabled={zoom <= 1}
        className="rounded-md border border-border p-1.5 text-fg hover:bg-bg-muted disabled:opacity-40"
      >
        <ZoomOut className="h-4 w-4" />
      </button>
      <span className="min-w-12 text-center text-xs tabular-nums text-fg-muted">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => onZoom(Math.min(8, Math.round(zoom * 1.25 * 100) / 100))}
        disabled={zoom >= 8}
        className="rounded-md border border-border p-1.5 text-fg hover:bg-bg-muted disabled:opacity-40"
      >
        <ZoomIn className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onFit}
        className={cn(
          'rounded-md border px-2 py-1 text-xs font-medium',
          zoom === 1
            ? 'border-primary bg-primary text-primary-fg'
            : 'border-border text-fg hover:bg-bg-muted',
        )}
      >
        Fit
      </button>
    </div>
  )
}

interface Props {
  files: File[]
  results: (File | null)[]
  options: Record<string, unknown>
}

export function PngToSvgPreview({ files, results }: Props) {
  const [selected, setSelected] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [divider, setDivider] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dividerDragging = useRef(false)
  const panDragging = useRef(false)
  const panStart = useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 })

  const safeIndex = Math.min(selected, Math.max(0, files.length - 1))
  const source = files[safeIndex] ?? null
  const result = results[safeIndex] ?? null
  const sourceUrl = useObjectUrl(source)
  const svgUrl = useObjectUrl(result)

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setDivider(50)
  }, [source, result])

  const fit = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const updateDivider = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setDivider(Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      setZoom((z) => Math.max(1, Math.min(8, z * factor)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [sourceUrl])

  if (!source || !sourceUrl) return null

  const imgStyle = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: 'center center',
  } as const

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-fg">
          {result ? 'Original vs SVG' : 'Preview'}
        </p>
        <ZoomToolbar zoom={zoom} onZoom={setZoom} onFit={fit} />
      </div>

      {files.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {files.map((file, i) => (
            <button
              key={`${file.name}-${i}`}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium',
                i === safeIndex
                  ? 'border-primary bg-primary/10 text-fg'
                  : 'border-border text-fg-muted hover:text-fg',
              )}
            >
              {file.name}
            </button>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative h-80 overflow-hidden rounded-lg border border-border"
        style={CHECKERBOARD}
      >
        {result && svgUrl ? (
          <>
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - divider}% 0 0)` }}>
              <img
                src={sourceUrl}
                alt="Original PNG"
                className="h-full w-full object-contain"
                style={imgStyle}
                draggable={false}
              />
            </div>
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${divider}%)` }}>
              <img
                src={svgUrl}
                alt="Traced SVG"
                className="h-full w-full object-contain"
                style={imgStyle}
                draggable={false}
              />
            </div>
            <div
              role="slider"
              aria-label="Comparison slider"
              aria-valuenow={Math.round(divider)}
              tabIndex={0}
              className="absolute inset-y-0 z-20 flex w-8 -translate-x-1/2 cursor-col-resize items-center justify-center"
              style={{ left: `${divider}%` }}
              onPointerDown={(e) => {
                dividerDragging.current = true
                ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                updateDivider(e.clientX)
              }}
              onPointerMove={(e) => {
                if (dividerDragging.current) updateDivider(e.clientX)
              }}
              onPointerUp={() => {
                dividerDragging.current = false
              }}
            >
              <div className="h-full w-0.5 bg-white/80 shadow-sm" />
              <div className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-fg shadow-md">
                ⇔
              </div>
            </div>
            {zoom > 1 && (
              <div
                className="absolute inset-0 z-10 cursor-grab touch-none active:cursor-grabbing"
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest('[role="slider"]')) return
                  panDragging.current = true
                  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                  panStart.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y }
                }}
                onPointerMove={(e) => {
                  if (!panDragging.current) return
                  setPan({
                    x: panStart.current.panX + (e.clientX - panStart.current.clientX),
                    y: panStart.current.panY + (e.clientY - panStart.current.clientY),
                  })
                }}
                onPointerUp={() => {
                  panDragging.current = false
                }}
              />
            )}
            <span className="pointer-events-none absolute left-2 top-2 z-30 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              Original
            </span>
            <span className="pointer-events-none absolute right-2 top-2 z-30 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              SVG
            </span>
          </>
        ) : (
          <>
            <img
              src={sourceUrl}
              alt="Original PNG"
              className={cn('h-full w-full object-contain', zoom > 1 && 'cursor-grab active:cursor-grabbing')}
              style={imgStyle}
              draggable={false}
              onPointerDown={(e) => {
                if (zoom <= 1) return
                panDragging.current = true
                ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                panStart.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y }
              }}
              onPointerMove={(e) => {
                if (!panDragging.current) return
                setPan({
                  x: panStart.current.panX + (e.clientX - panStart.current.clientX),
                  y: panStart.current.panY + (e.clientY - panStart.current.clientY),
                })
              }}
              onPointerUp={() => {
                panDragging.current = false
              }}
            />
            <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
              Original
            </span>
            <span className="pointer-events-none absolute bottom-2 left-2 right-2 rounded bg-black/70 px-2 py-1 text-center text-xs text-white">
              Not converted yet — click Convert below to trace the SVG
            </span>
          </>
        )}
      </div>
    </div>
  )
}
