'use client'

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
}: BeforeAfterCompareProps) {
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
        </div>
        <p className="mt-3 text-center text-sm text-fg-subtle">
          {caption}
        </p>
      </div>
    </div>
  )
}
