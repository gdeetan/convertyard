'use client'
import { useState, useRef, useCallback } from 'react'

interface BeforeAfterSliderProps {
  before: string
  after: string
  label?: string
}

export function BeforeAfterSlider({ before, after, label }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setPosition(pct)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg cursor-col-resize select-none touch-none"
      onMouseMove={(e) => dragging && updatePosition(e.clientX)}
      onMouseDown={(e) => { setDragging(true); updatePosition(e.clientX) }}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={(e) => updatePosition(e.touches[0].clientX)}
    >
      <img src={after} className="w-full block" alt="Upscaled" draggable={false} />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={before}
          className="block"
          style={{ width: containerRef.current?.offsetWidth ?? '100%' }}
          alt="Original"
          draggable={false}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-px bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 text-sm font-bold pointer-events-none">
          ⇔
        </div>
      </div>
      <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
        Before
      </span>
      <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">
        {label ?? 'After'}
      </span>
    </div>
  )
}
