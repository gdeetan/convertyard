'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { ToolOptions } from '@/lib/types'

const ASPECT_PRESETS = [
  { label: 'Free', value: 'free', ratio: null },
  { label: '1:1 — Square (UPSC, NEET, JEE)', value: '1:1', ratio: 1 },
  { label: 'Passport 3.5:4.5 (SSC, IBPS)', value: 'passport', ratio: 3.5 / 4.5 },
  { label: '4:3', value: '4:3', ratio: 4 / 3 },
  { label: '16:9', value: '16:9', ratio: 16 / 9 },
  { label: '9:16', value: '9:16', ratio: 9 / 16 },
]

type Handle = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface Rect { x: number; y: number; w: number; h: number }

interface DragState {
  handle: Handle
  startMouseX: number
  startMouseY: number
  startRect: Rect
  containerW: number
  containerH: number
}

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}

const MIN_SIZE = 0.05

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function applyDrag(drag: DragState, mouseX: number, mouseY: number, aspectRatio: number | null, naturalW: number, naturalH: number): Rect {
  const dx = (mouseX - drag.startMouseX) / drag.containerW
  const dy = (mouseY - drag.startMouseY) / drag.containerH
  const s = drag.startRect
  let { x, y, w, h } = s

  switch (drag.handle) {
    case 'move':
      x = clamp(s.x + dx, 0, 1 - s.w)
      y = clamp(s.y + dy, 0, 1 - s.h)
      return { x, y, w, h }
    case 'nw':
      x = s.x + dx; y = s.y + dy; w = s.w - dx; h = s.h - dy; break
    case 'n':
      y = s.y + dy; h = s.h - dy; break
    case 'ne':
      y = s.y + dy; w = s.w + dx; h = s.h - dy; break
    case 'e':
      w = s.w + dx; break
    case 'se':
      w = s.w + dx; h = s.h + dy; break
    case 's':
      h = s.h + dy; break
    case 'sw':
      x = s.x + dx; w = s.w - dx; h = s.h + dy; break
    case 'w':
      x = s.x + dx; w = s.w - dx; break
  }

  // aspectRatio is in pixel space; convert to normalized-coord space:
  // pixelW/pixelH = ratio → (w*naturalW)/(h*naturalH) = ratio
  if (aspectRatio !== null && naturalW > 0 && naturalH > 0) {
    if (drag.handle === 'n' || drag.handle === 's') {
      w = h * naturalH * aspectRatio / naturalW
    } else {
      h = w * naturalW / (naturalH * aspectRatio)
      if (drag.handle === 'nw' || drag.handle === 'ne') {
        y = (s.y + s.h) - h
      }
    }
  }

  w = Math.max(MIN_SIZE, w)
  h = Math.max(MIN_SIZE, h)
  x = clamp(x, 0, 1 - w)
  y = clamp(y, 0, 1 - h)
  if (x + w > 1) w = 1 - x
  if (y + h > 1) h = 1 - y

  return { x, y, w, h }
}

function enforceAspect(rect: Rect, ratio: number | null, naturalW: number, naturalH: number): Rect {
  if (ratio === null || naturalW === 0 || naturalH === 0) return rect
  const centerX = rect.x + rect.w / 2
  const centerY = rect.y + rect.h / 2
  const w = rect.w
  // pixelW/pixelH = ratio → h = w * naturalW / (naturalH * ratio)
  const h = w * naturalW / (naturalH * ratio)
  return {
    x: clamp(centerX - w / 2, 0, 1 - w),
    y: clamp(centerY - h / 2, 0, 1 - h),
    w,
    h: Math.min(h, 1),
  }
}

const DEFAULT_RECT: Rect = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }

export function CropBox({ files, options, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rects, setRects] = useState<Rect[]>(() => {
    const seed = options.cropRects as Rect[] | undefined
    if (Array.isArray(seed) && seed.length > 0) return seed
    return files.map(() => ({ ...DEFAULT_RECT }))
  })
  const dragRef = useRef<DragState | null>(null)
  const rectsRef = useRef(rects)
  rectsRef.current = rects
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  const cropRect = rects[activeIndex] ?? DEFAULT_RECT

  const currentAspect = (options.aspect as string) ?? 'free'
  const aspectRatio = ASPECT_PRESETS.find(p => p.value === currentAspect)?.ratio ?? null

  // Keep rects[] length in sync with files[] as items are added/removed
  useEffect(() => {
    setRects(prev => {
      if (prev.length === files.length) return prev
      const next = files.map((_, i) => prev[i] ?? { ...DEFAULT_RECT })
      return next
    })
    setActiveIndex(i => Math.min(i, Math.max(0, files.length - 1)))
  }, [files.length])

  // Load the active file as image preview
  useEffect(() => {
    const file = files[activeIndex]
    if (!file) { setImgSrc(null); return }
    const url = URL.createObjectURL(file)
    setImgSrc(url)
    setNaturalW(0)
    setNaturalH(0)
    return () => URL.revokeObjectURL(url)
  }, [files, activeIndex])

  // Enforce aspect ratio on the active rect when aspect changes
  const prevAspect = useRef(currentAspect)
  useEffect(() => {
    if (prevAspect.current === currentAspect) return
    prevAspect.current = currentAspect
    if (aspectRatio === null || naturalW === 0 || naturalH === 0) return
    const enforced = enforceAspect(rectsRef.current[activeIndexRef.current] ?? DEFAULT_RECT, aspectRatio, naturalW, naturalH)
    updateRect(activeIndexRef.current, enforced)
  }, [currentAspect, aspectRatio, naturalW, naturalH])

  const commitRects = useCallback((arr: Rect[]) => {
    onChange('cropRects', arr)
  }, [onChange])

  const updateRect = useCallback((idx: number, r: Rect) => {
    setRects(prev => {
      const next = prev.slice()
      next[idx] = r
      commitRects(next)
      return next
    })
  }, [commitRects])

  // Emit initial cropRects so the converter picks it up even if the user
  // never drags a handle (default centered crop).
  useEffect(() => {
    commitRects(rectsRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPointerDown = useCallback((handle: Handle, e: React.PointerEvent) => {
    e.stopPropagation()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const startRect = rectsRef.current[activeIndexRef.current] ?? DEFAULT_RECT
    dragRef.current = {
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startRect: { ...startRect },
      containerW: rect.width,
      containerH: rect.height,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const newRect = applyDrag(drag, e.clientX, e.clientY, aspectRatio, naturalW, naturalH)
    setRects(prev => {
      const next = prev.slice()
      next[activeIndexRef.current] = newRect
      return next
    })
  }, [aspectRatio, naturalW, naturalH])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    const finalRect = applyDrag(drag, e.clientX, e.clientY, aspectRatio, naturalW, naturalH)
    updateRect(activeIndexRef.current, finalRect)
  }, [aspectRatio, naturalW, naturalH, updateRect])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const NUDGE = e.shiftKey ? 0 : 0.01
    const RESIZE = e.shiftKey ? 0.01 : 0
    const r = rectsRef.current[activeIndexRef.current] ?? DEFAULT_RECT
    let { x, y, w, h } = r

    switch (e.key) {
      case 'ArrowLeft':  x = clamp(x - (NUDGE || 0), 0, 1 - w); w = Math.max(MIN_SIZE, w - RESIZE); break
      case 'ArrowRight': x = clamp(x + (NUDGE || 0), 0, 1 - w); w = Math.min(1 - x, w + RESIZE); break
      case 'ArrowUp':    y = clamp(y - (NUDGE || 0), 0, 1 - h); h = Math.max(MIN_SIZE, h - RESIZE); break
      case 'ArrowDown':  y = clamp(y + (NUDGE || 0), 0, 1 - h); h = Math.min(1 - y, h + RESIZE); break
      default: return
    }
    e.preventDefault()
    const newRect = enforceAspect({ x, y, w, h }, aspectRatio, naturalW, naturalH)
    updateRect(activeIndexRef.current, newRect)
  }, [aspectRatio, naturalW, naturalH, updateRect])

  const pxW = naturalW > 0 ? Math.round(cropRect.w * naturalW) : 0
  const pxH = naturalH > 0 ? Math.round(cropRect.h * naturalH) : 0

  const toPercent = (v: number) => `${(v * 100).toFixed(2)}%`

  return (
    <div className="space-y-3">
      {/* Aspect ratio selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-fg-muted">Aspect ratio:</span>
        <div className="flex flex-wrap gap-1">
          {ASPECT_PRESETS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange('aspect', p.value)}
              className={[
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                currentAspect === p.value
                  ? 'bg-primary text-primary-fg'
                  : 'bg-bg-muted text-fg-muted hover:bg-bg-elevated hover:text-fg border border-border',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prev/Next navigation */}
      {files.length > 1 && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-muted/40 px-3 py-2">
          <button
            type="button"
            onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="rounded px-2 py-1 text-sm font-medium text-fg hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous file"
          >
            ◀ Prev
          </button>
          <div className="min-w-0 flex-1 text-center text-xs text-fg-muted">
            <span className="font-medium text-fg">File {activeIndex + 1} of {files.length}</span>
            <span className="mx-2 text-fg-subtle">·</span>
            <span className="truncate align-middle inline-block max-w-[60%]">{files[activeIndex]?.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex(i => Math.min(files.length - 1, i + 1))}
            disabled={activeIndex >= files.length - 1}
            className="rounded px-2 py-1 text-sm font-medium text-fg hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next file"
          >
            Next ▶
          </button>
        </div>
      )}

      {/* Crop canvas */}
      {imgSrc && (
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg border border-border select-none"
          style={{ touchAction: 'none' }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="application"
          aria-label="Crop area. Arrow keys to move, Shift+Arrow to resize."
        >
          <img
            ref={imgRef}
            src={imgSrc}
            alt="Crop preview"
            draggable={false}
            onLoad={e => {
              const img = e.currentTarget
              setNaturalW(img.naturalWidth)
              setNaturalH(img.naturalHeight)
            }}
            style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none' }}
          />

          {/* Crop rect */}
          <div
            style={{
              position: 'absolute',
              left: toPercent(cropRect.x),
              top: toPercent(cropRect.y),
              width: toPercent(cropRect.w),
              height: toPercent(cropRect.h),
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
              border: '2px solid rgba(255,255,255,0.9)',
              cursor: 'move',
              boxSizing: 'border-box',
            }}
            onPointerDown={e => onPointerDown('move', e)}
          >
            {/* Output size label */}
            {pxW > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  marginBottom: 4,
                  background: 'rgba(0,0,0,0.75)',
                  color: '#fff',
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 3,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                {pxW} × {pxH} px
              </div>
            )}

            {/* Handles — edges first so corners paint on top and win overlapping hits */}
            {(['n','e','s','w','nw','ne','se','sw'] as Handle[]).map(h => (
              <Handle key={h} type={h} onPointerDown={e => onPointerDown(h, e)} />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-fg-subtle">
        {files.length > 1
          ? 'Each file gets its own crop. Use Prev/Next to set the region for every image.'
          : 'Drag the box, its edges, or its corners to set the crop.'}
      </p>
    </div>
  )
}

const HANDLE_CURSORS: Record<Handle, string> = {
  move: 'move', nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
}

const CORNER = 44
const EDGE_THICKNESS = 20

const HANDLE_POSITIONS: Record<Handle, React.CSSProperties> = {
  move: {},
  // Corners: fixed 44x44 hotspot centered on corner
  nw: { top: 0, left: 0, width: CORNER, height: CORNER, transform: 'translate(-50%, -50%)' },
  ne: { top: 0, right: 0, width: CORNER, height: CORNER, transform: 'translate(50%, -50%)' },
  se: { bottom: 0, right: 0, width: CORNER, height: CORNER, transform: 'translate(50%, 50%)' },
  sw: { bottom: 0, left: 0, width: CORNER, height: CORNER, transform: 'translate(-50%, 50%)' },
  // Edges: strip spanning the full length of the edge
  n: { top: 0, left: 0, right: 0, height: EDGE_THICKNESS, transform: 'translateY(-50%)' },
  s: { bottom: 0, left: 0, right: 0, height: EDGE_THICKNESS, transform: 'translateY(50%)' },
  e: { top: 0, bottom: 0, right: 0, width: EDGE_THICKNESS, transform: 'translateX(50%)' },
  w: { top: 0, bottom: 0, left: 0, width: EDGE_THICKNESS, transform: 'translateX(-50%)' },
}

function Handle({ type, onPointerDown }: { type: Handle; onPointerDown: (e: React.PointerEvent) => void }) {
  if (type === 'move') return null
  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: HANDLE_CURSORS[type],
        ...HANDLE_POSITIONS[type],
      }}
      onPointerDown={onPointerDown}
    >
      <div
        style={{
          width: 8,
          height: 8,
          background: '#fff',
          border: '1.5px solid rgba(0,0,0,0.5)',
          borderRadius: 1,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
