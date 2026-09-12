'use client'

import { useEffect, useState } from 'react'
import { ComparisonSlider } from './ComparisonSlider'

interface BeforeAfterCompareProps {
  beforeSrc: string
  beforeAlt: string
  beforeLabel: string
  afterSrc: string
  afterAlt: string
  afterLabel: string
  aspectRatio?: string
  caption?: string
  beforeSrcSet?: string
  afterSrcSet?: string
  sizes?: string
  width?: number
  height?: number
  zoomable?: boolean
}

export function BeforeAfterCompare({
  beforeSrc,
  beforeAlt,
  beforeLabel,
  afterSrc,
  afterAlt,
  afterLabel,
  aspectRatio = '4 / 3',
  caption = 'Drag the slider to compare. Same photo, same 4032 × 3024 resolution — but JPG ends up ~60% larger than the HEIC original.',
  beforeSrcSet,
  afterSrcSet,
  sizes,
  width,
  height,
  zoomable = false,
}: BeforeAfterCompareProps) {
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!zoomed) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomed(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [zoomed])
  return (
    <div className="my-8 relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-xl border border-border bg-bg-elevated"
          style={{ aspectRatio }}
        >
          <ComparisonSlider
            left={
              <>
                <img
                  src={beforeSrc}
                  srcSet={beforeSrcSet}
                  sizes={sizes}
                  width={width}
                  height={height}
                  alt={beforeAlt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  draggable={false}
                />
                <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white sm:left-4 sm:top-4 sm:text-sm">
                  {beforeLabel}
                </span>
              </>
            }
            right={
              <>
                <img
                  src={afterSrc}
                  srcSet={afterSrcSet}
                  sizes={sizes}
                  width={width}
                  height={height}
                  alt={afterAlt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  draggable={false}
                />
                <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white sm:right-4 sm:top-4 sm:text-sm">
                  {afterLabel}
                </span>
              </>
            }
          />
          {zoomable && (
            <button
              type="button"
              onClick={() => setZoomed(true)}
              className="absolute bottom-3 right-3 z-10 rounded-md bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-black/85 sm:text-sm"
              aria-label="Zoom in to compare at full size"
            >
              🔍 Zoom in
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-sm text-fg-subtle">
          {caption}
        </p>
      </div>
      {zoomable && zoomed && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed comparison view"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm opacity-80">Drag the slider · Scroll to pan · Esc to close</span>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            >
              Close ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <div
              className="relative mx-auto"
              style={{ width: width ?? 1400, maxWidth: '100%' }}
            >
              <div className="relative" style={{ aspectRatio: width && height ? `${width} / ${height}` : aspectRatio }}>
                <ComparisonSlider
                  left={
                    <>
                      <img
                        src={beforeSrc}
                        alt={beforeAlt}
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                      <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white sm:text-sm">
                        {beforeLabel}
                      </span>
                    </>
                  }
                  right={
                    <>
                      <img
                        src={afterSrc}
                        alt={afterAlt}
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                      <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white sm:text-sm">
                        {afterLabel}
                      </span>
                    </>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
