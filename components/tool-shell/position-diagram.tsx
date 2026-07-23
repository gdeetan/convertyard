'use client'

import type React from 'react'

interface PositionDiagramProps {
  position: string  // 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'
  margin: number    // pt value, 10–100
}

const DIAGRAM_W = 100  // px
const DIAGRAM_H = 130  // px
const PDF_W_PT = 595   // A4 width in pt (reference)
const SCALE = DIAGRAM_W / PDF_W_PT

export function PositionDiagram({ position, margin }: PositionDiagramProps) {
  const marginPx = Math.round(Math.max(2, Math.min(margin * SCALE, 20)))

  const isTop   = position.startsWith('top')
  const isLeft  = position.endsWith('left')
  const isRight = position.endsWith('right')

  const pillStyle: React.CSSProperties = {
    position: 'absolute',
    fontSize: '7px',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    padding: '2px 4px',
    borderRadius: '3px',
    background: '#3b82f6',
    color: '#fff',
    ...(isTop    ? { top: marginPx }    : { bottom: marginPx }),
    ...(isLeft   ? { left: marginPx }   :
        isRight  ? { right: marginPx }  :
        { left: '50%', transform: 'translateX(-50%)' }),
  }

  const guideStyle = (edge: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties => ({
    position: 'absolute',
    background: '#93c5fd',
    opacity: 0.6,
    ...(edge === 'top'    ? { top: marginPx - 1, left: 0, right: 0, height: 1 } :
        edge === 'bottom' ? { bottom: marginPx - 1, left: 0, right: 0, height: 1 } :
        edge === 'left'   ? { left: marginPx - 1, top: 0, bottom: 0, width: 1 } :
                            { right: marginPx - 1, top: 0, bottom: 0, width: 1 }),
  })

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div
        className="relative overflow-hidden rounded border border-border bg-bg-elevated shadow-sm"
        style={{ width: DIAGRAM_W, height: DIAGRAM_H }}
        aria-label={`Page number position: ${position}, margin: ${margin}pt`}
        role="img"
      >
        {/* Content area lines (simulate text) */}
        {[20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100].map((top) => (
          <div
            key={top}
            className="absolute rounded-full bg-border"
            style={{ top, left: 10, right: 10, height: 2 }}
          />
        ))}

        {/* Margin guide line */}
        <div style={guideStyle(isTop ? 'top' : 'bottom')} />
        {isLeft  && <div style={guideStyle('left')} />}
        {isRight && <div style={guideStyle('right')} />}

        {/* Page number label */}
        <div style={pillStyle}>pg 1</div>
      </div>
      <p className="text-xs text-fg-subtle">{margin}pt from edge</p>
    </div>
  )
}
