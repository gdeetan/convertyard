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

function applyDrag(drag: DragState, mouseX: number, mouseY: number, aspectRatio: number | null): Rect {
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

  if (aspectRatio !== null) {
    if (drag.handle === 'n' || drag.handle === 's') {
      w = h * aspectRatio
    } else {
      h = w / aspectRatio
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

function enforceAspect(rect: Rect, ratio: number | null): Rect {
  if (ratio === null) return rect
  const centerX = rect.x + rect.w / 2
  const centerY = rect.y + rect.h / 2
  const w = rect.w
  const h = w / ratio
  return {
    x: clamp(centerX - w / 2, 0, 1 - w),
    y: clamp(centerY - h / 2, 0, 1 - h),
    w,
    h: Math.min(h, 1),
  }
}

export function CropBox({ files, options, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [cropRect, setCropRect] = useState<Rect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })
  const dragRef = useRef<DragState | null>(null)
  const cropRectRef = useRef(cropRect)
  cropRectRef.current = cropRect

  const currentAspect = (options.aspect as string) ?? 'free'
  const aspectRatio = ASPECT_PRESETS.find(p => p.value === currentAspect)?.ratio ?? null

  // Load first file as image preview
  useEffect(() => {
    const file = files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [files])

  // Initialize crop coords from options if provided
  useEffect(() => {
    const cx = options.cropX as number | undefined
    const cy = options.cropY as number | undefined
    const cw = options.cropW as number | undefined
    const ch = options.cropH as number | undefined
    if (cx != null && cw != null) {
      setCropRect({ x: cx, y: cy ?? 0.1, w: cw, h: ch ?? 0.8 })
    }
  }, []) // only on mount

  // Enforce aspect ratio when it changes
  const prevAspect = useRef(currentAspect)
  useEffect(() => {
    if (prevAspect.current === currentAspect) return
    prevAspect.current = currentAspect
    const enforced = enforceAspect(cropRectRef.current, aspectRatio)
    setCropRect(enforced)
    onChange('cropX', enforced.x)
    onChange('cropY', enforced.y)
    onChange('cropW', enforced.w)
    onChange('cropH', enforced.h)
  }, [currentAspect, aspectRatio, onChange])

  const commitRect = useCallback((r: Rect) => {
    onChange('cropX', r.x)
    onChange('cropY', r.y)
    onChange('cropW', r.w)
    onChange('cropH', r.h)
  }, [onChange])

  const onPointerDown = useCallback((handle: Handle, e: React.PointerEvent) => {
    e.stopPropagation()
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    dragRef.current = {
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startRect: { ...cropRectRef.current },
      containerW: rect.width,
      containerH: rect.height,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const newRect = applyDrag(drag, e.clientX, e.clientY, aspectRatio)
    setCropRect(newRect)
  }, [aspectRatio])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    const finalRect = applyDrag(drag, e.clientX, e.clientY, aspectRatio)
    setCropRect(finalRect)
    commitRect(finalRect)
  }, [aspectRatio, commitRect])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const NUDGE = e.shiftKey ? 0 : 0.01
    const RESIZE = e.shiftKey ? 0.01 : 0
    const r = cropRectRef.current
    let { x, y, w, h } = r

    switch (e.key) {
      case 'ArrowLeft':  x = clamp(x - (NUDGE || 0), 0, 1 - w); w = Math.max(MIN_SIZE, w - RESIZE); break
      case 'ArrowRight': x = clamp(x + (NUDGE || 0), 0, 1 - w); w = Math.min(1 - x, w + RESIZE); break
      case 'ArrowUp':    y = clamp(y - (NUDGE || 0), 0, 1 - h); h = Math.max(MIN_SIZE, h - RESIZE); break
      case 'ArrowDown':  y = clamp(y + (NUDGE || 0), 0, 1 - h); h = Math.min(1 - y, h + RESIZE); break
      default: return
    }
    e.preventDefault()
    const newRect = enforceAspect({ x, y, w, h }, aspectRatio)
    setCropRect(newRect)
    commitRect(newRect)
  }, [aspectRatio, commitRect])

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

            {/* Handles */}
            {(['nw','n','ne','e','se','s','sw','w'] as Handle[]).map(h => (
              <Handle key={h} type={h} onPointerDown={e => onPointerDown(h, e)} />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-fg-subtle">
        The same crop region (as a % of each image) is applied to every file in the batch.
      </p>
    </div>
  )
}

const HANDLE_CURSORS: Record<Handle, string> = {
  move: 'move', nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  e: 'e-resize', se: 'se-resize', s: 's-resize', sw: 'sw-resize', w: 'w-resize',
}

const HANDLE_POSITIONS: Record<Handle, React.CSSProperties> = {
  move: {},
  nw: { top: 0, left: 0, transform: 'translate(-50%, -50%)' },
  n:  { top: 0, left: '50%', transform: 'translate(-50%, -50%)' },
  ne: { top: 0, right: 0, transform: 'translate(50%, -50%)' },
  e:  { top: '50%', right: 0, transform: 'translate(50%, -50%)' },
  se: { bottom: 0, right: 0, transform: 'translate(50%, 50%)' },
  s:  { bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' },
  sw: { bottom: 0, left: 0, transform: 'translate(-50%, 50%)' },
  w:  { top: '50%', left: 0, transform: 'translate(-50%, -50%)' },
}

function Handle({ type, onPointerDown }: { type: Handle; onPointerDown: (e: React.PointerEvent) => void }) {
  if (type === 'move') return null
  return (
    <div
      style={{
        position: 'absolute',
        width: 44,
        height: 44,
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
