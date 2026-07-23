'use client'

import { useEffect, useState, useRef } from 'react'
import { renderPagePng, getPageSizes } from '@/lib/converters/mupdf-client'
import { resolveCropMargins, calcOverlayPct } from '@/lib/converters/crop-pdf-preview-utils'
import type { ToolOptions } from '@/lib/types'

const MAX_PREVIEW_PAGES = 4
const PREVIEW_DPI = 72
const THUMBNAIL_WIDTH = 96

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

export function CropPdfPreview({ files, options }: Props) {
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
      for (const u of urlsRef.current) URL.revokeObjectURL(u)
      urlsRef.current = []

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
    }

    load()
    return () => { cancelled = true }
  }, [firstFile])

  useEffect(() => {
    return () => {
      for (const u of urlsRef.current) URL.revokeObjectURL(u)
    }
  }, [])

  const margins = resolveCropMargins(options)

  if (loading) {
    return (
      <div className="flex gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 w-24 animate-pulse rounded bg-bg-muted" />
        ))}
      </div>
    )
  }

  if (pages.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {pages.map((page, i) => {
          const overlay = calcOverlayPct(margins, page.widthPt, page.heightPt)
          const thumbHeight = Math.round(THUMBNAIL_WIDTH * page.heightPt / page.widthPt)
          return (
            <div
              key={i}
              className="relative shrink-0 overflow-hidden rounded border border-border"
              style={{ width: THUMBNAIL_WIDTH, height: thumbHeight }}
            >
              <img
                src={page.url}
                alt={`Page ${i + 1}`}
                className="h-full w-full object-cover"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-0">
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${overlay.topPct}%`, background: 'rgba(239,68,68,0.22)', borderBottom: '1.5px dashed rgba(239,68,68,0.6)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${overlay.bottomPct}%`, background: 'rgba(239,68,68,0.22)', borderTop: '1.5px dashed rgba(239,68,68,0.6)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${overlay.leftPct}%`, background: 'rgba(239,68,68,0.22)', borderRight: '1.5px dashed rgba(239,68,68,0.6)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${overlay.rightPct}%`, background: 'rgba(239,68,68,0.22)', borderLeft: '1.5px dashed rgba(239,68,68,0.6)' }} />
              </div>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] leading-none text-white">
                p.{i + 1}
              </span>
            </div>
          )
        })}
      </div>
      <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        These settings apply to all pages in the document.
      </p>
    </div>
  )
}
