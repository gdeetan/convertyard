'use client'

import { useEffect, useState, useRef } from 'react'
import { renderPagePng, getPageSizes } from '@/lib/converters/mupdf-client'
import { resolveText } from '@/lib/converters/pdf-tier3'
import type { ToolOptions } from '@/lib/types'

const MAX_PREVIEW_PAGES = 4
const PREVIEW_DPI = 72

interface PageData {
  url: string
  widthPt: number
  heightPt: number
}

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}

export function HeaderFooterPreview({ files, options }: Props) {
  // onChange required by interactivePanel slot in ToolConfig, not used by this component
  const [pages, setPages] = useState<PageData[]>([])
  const [loading, setLoading] = useState(false)
  const urlsRef = useRef<string[]>([])
  const firstFile = files[0]

  useEffect(() => {
    if (!firstFile) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setPages([])

      try {
        const buffer = await firstFile.arrayBuffer()
        const sizes = await getPageSizes(buffer)
        const count = Math.min(sizes.length, MAX_PREVIEW_PAGES)

        const loaded: PageData[] = []
        for (let i = 0; i < count; i++) {
          if (cancelled) return
          const png = await renderPagePng(buffer, i, PREVIEW_DPI, false)
          const url = URL.createObjectURL(new Blob([png], { type: 'image/png' }))
          urlsRef.current.push(url)
          loaded.push({ url, widthPt: sizes[i].width, heightPt: sizes[i].height })
        }

        if (!cancelled) {
          setPages(loaded)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      for (const u of urlsRef.current) URL.revokeObjectURL(u)
      urlsRef.current = []
    }
  }, [firstFile])

  useEffect(() => {
    if (!firstFile) {
      setLoading(false)
      setPages([])
    }
  }, [firstFile])

  const rawHeaderText = (options.headerText as string) ?? ''
  const rawFooterText = (options.footerText as string) ?? ''
  const headerTemplate = rawHeaderText === 'custom'
    ? (options.headerCustomText as string) ?? ''
    : rawHeaderText
  const footerTemplate = rawFooterText === 'custom'
    ? (options.footerCustomText as string) ?? ''
    : rawFooterText
  const headerMargin = typeof options.headerMargin === 'number' ? options.headerMargin : 30
  const footerMargin = typeof options.footerMargin === 'number' ? options.footerMargin : 30
  const expandPage = options.expandPage === true
  const showHeader = headerTemplate.trim() !== ''
  const showFooter = footerTemplate.trim() !== ''

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded bg-bg-muted" />
        ))}
      </div>
    )
  }

  if (pages.length === 0) return null

  const BAND_STYLE = {
    background: 'rgba(59,130,246,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as const

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {pages.map((page, i) => {
          const headerLabel = resolveText(headerTemplate, i + 1, pages.length)
          const footerLabel = resolveText(footerTemplate, i + 1, pages.length)

          if (expandPage) {
            const headerExpansion = showHeader ? headerMargin : 0
            const footerExpansion = showFooter ? footerMargin : 0
            const totalHeightPt = (page.heightPt + headerExpansion + footerExpansion) || 1
            const headerBandPct = (headerExpansion / totalHeightPt) * 100
            const imgHeightPct = (page.heightPt / totalHeightPt) * 100
            const footerBandPct = (footerExpansion / totalHeightPt) * 100

            return (
              <div
                key={i}
                className="relative w-full flex flex-col rounded border border-border overflow-hidden"
                style={{ aspectRatio: `${page.widthPt} / ${totalHeightPt}` }}
              >
                {showHeader && (
                  <div
                    style={{
                      ...BAND_STYLE,
                      height: `${headerBandPct}%`,
                      borderBottom: '1.5px dashed rgba(59,130,246,0.6)',
                    }}
                  >
                    <span className="truncate px-1 text-[8px] leading-none text-blue-700 dark:text-blue-300">
                      {headerLabel}
                    </span>
                  </div>
                )}
                <img
                  src={page.url}
                  alt={`Page ${i + 1}`}
                  style={{ height: `${imgHeightPct}%`, objectFit: 'cover' }}
                  className="w-full"
                  draggable={false}
                />
                {showFooter && (
                  <div
                    style={{
                      ...BAND_STYLE,
                      height: `${footerBandPct}%`,
                      borderTop: '1.5px dashed rgba(59,130,246,0.6)',
                    }}
                  >
                    <span className="truncate px-1 text-[8px] leading-none text-blue-700 dark:text-blue-300">
                      {footerLabel}
                    </span>
                  </div>
                )}
                <span className="absolute top-1 left-1/2 -translate-x-1/2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] leading-none text-white">
                  p.{i + 1}
                </span>
              </div>
            )
          }

          // Non-expansion: overlay bands on the page thumbnail (existing behaviour)
          const headerPct = (headerMargin / page.heightPt) * 100
          const footerPct = (footerMargin / page.heightPt) * 100

          return (
            <div
              key={i}
              className="relative w-full overflow-hidden rounded border border-border"
              style={{ aspectRatio: `${page.widthPt} / ${page.heightPt}` }}
            >
              <img
                src={page.url}
                alt={`Page ${i + 1}`}
                className="h-full w-full object-contain"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0">
                {showHeader && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${headerPct}%`,
                      background: 'rgba(59,130,246,0.18)',
                      borderBottom: '1.5px dashed rgba(59,130,246,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <span className="truncate px-1 text-[8px] leading-none text-blue-700 dark:text-blue-300">
                      {headerLabel}
                    </span>
                  </div>
                )}
                {showFooter && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${footerPct}%`,
                      background: 'rgba(59,130,246,0.18)',
                      borderTop: '1.5px dashed rgba(59,130,246,0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <span className="truncate px-1 text-[8px] leading-none text-blue-700 dark:text-blue-300">
                      {footerLabel}
                    </span>
                  </div>
                )}
              </div>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] leading-none text-white">
                p.{i + 1}
              </span>
            </div>
          )
        })}
      </div>
      <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        {expandPage
          ? 'Blue bands show new whitespace being added to the page. Your existing content will not be touched.'
          : 'Blue bands show where header and footer text will be placed. Increase the margin if the band overlaps your content.'}
      </p>
    </div>
  )
}
