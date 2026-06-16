'use client'

import { useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ComparisonSliderProps {
  left: React.ReactNode
  right: React.ReactNode
  className?: string
}

export function ComparisonSlider({ left, right, className }: ComparisonSliderProps) {
  const [position, setPosition] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPosition(Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width)))
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }, [updatePosition])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }, [updatePosition])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPosition(p => Math.max(0.05, p - 0.05))
    if (e.key === 'ArrowRight') setPosition(p => Math.min(0.95, p + 0.05))
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('relative h-full w-full select-none overflow-hidden', className)}
    >
      {/* Left panel */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${(1 - position) * 100}% 0 0)` }}
      >
        {left}
      </div>

      {/* Right panel */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${position * 100}%)` }}
      >
        {right}
      </div>

      {/* Drag handle */}
      <div
        role="slider"
        aria-label="Comparison slider"
        aria-valuenow={Math.round(position * 100)}
        aria-valuemin={5}
        aria-valuemax={95}
        tabIndex={0}
        className="absolute inset-y-0 flex w-8 -translate-x-1/2 cursor-col-resize items-center justify-center"
        style={{ left: `${position * 100}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <div className="h-full w-0.5 bg-white/80 shadow-sm" />
        <div className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md text-xs font-bold text-fg">
          ⇔
        </div>
      </div>
    </div>
  )
}
