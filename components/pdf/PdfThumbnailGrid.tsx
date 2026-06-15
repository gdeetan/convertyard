'use client'
import { useEffect, useRef, useState } from 'react'
import { getPageCount, renderPage } from '@/lib/converters/mupdf-client'

interface ThumbnailEntry {
  src: string | null
  loading: boolean
}

export interface PdfThumbnailGridProps {
  file: File
  thumbnailWidth?: number
  columns?: number
  getImgStyle?: (pageIndex: number) => React.CSSProperties
  renderPageOverlay?: (pageIndex: number) => React.ReactNode
  onPageClick?: (pageIndex: number) => void
  onReady?: (pageCount: number) => void
  className?: string
}

export function PdfThumbnailGrid({
  file,
  thumbnailWidth = 140,
  columns = 4,
  getImgStyle,
  renderPageOverlay,
  onPageClick,
  onReady,
  className,
}: PdfThumbnailGridProps) {
  const [thumbnails, setThumbnails] = useState<ThumbnailEntry[]>([])
  const bufferRef = useRef<ArrayBuffer | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const blobUrlsRef = useRef<string[]>([])
  const generationRef = useRef(0)

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
      blobUrlsRef.current = []
    }
  }, [file])

  useEffect(() => {
    let cancelled = false
    const generation = ++generationRef.current
    setThumbnails([])
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
    blobUrlsRef.current = []
    ;(async () => {
      const buffer = await file.arrayBuffer()
      if (cancelled) return
      bufferRef.current = buffer
      const count = await getPageCount(buffer.slice(0))
      if (cancelled) return
      setThumbnails(Array.from({ length: count }, () => ({ src: null, loading: false })))
      onReady?.(count)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // onReady intentionally omitted — only called once on file load; callers must memoize or use useCallback
  }, [file])

  // Re-run only when page count changes (file load), not on every thumbnail render
  useEffect(() => {
    if (thumbnails.length === 0 || !containerRef.current) return

    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const idx = Number((entry.target as HTMLElement).dataset.pageIndex)
        if (isNaN(idx)) continue
        observerRef.current?.unobserve(entry.target)

        setThumbnails(prev => {
          if (prev[idx]?.src || prev[idx]?.loading) return prev
          const next = [...prev]
          next[idx] = { ...next[idx], loading: true }
          return next
        })
        ;(async () => {
          const gen = generationRef.current  // capture at dispatch time
          const buffer = bufferRef.current
          if (!buffer) return
          try {
            const jpeg = await renderPage(buffer.slice(0), idx, 72, 80)
            if (generationRef.current !== gen) return  // file changed, discard
            const src = URL.createObjectURL(new Blob([jpeg], { type: 'image/jpeg' }))
            blobUrlsRef.current.push(src)
            setThumbnails(prev => {
              const next = [...prev]
              next[idx] = { src, loading: false }
              return next
            })
          } catch {
            if (generationRef.current !== gen) return
            setThumbnails(prev => {
              const next = [...prev]
              next[idx] = { src: null, loading: false }
              return next
            })
          }
        })()
      }
    }, { threshold: 0.05 })

    containerRef.current.querySelectorAll('[data-page-index]').forEach(el => {
      observerRef.current!.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [thumbnails.length])

  if (thumbnails.length === 0) {
    return <div className="text-sm text-gray-400 py-8 text-center">Loading pages…</div>
  }

  return (
    <div
      ref={containerRef}
      className={`grid gap-3 ${className ?? ''}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {thumbnails.map((t, i) => (
        <div
          key={i}
          data-page-index={i}
          className={`relative group ${onPageClick ? 'cursor-pointer' : ''}`}
          style={{ width: thumbnailWidth }}
          onClick={() => onPageClick?.(i)}
        >
          {t.src ? (
            <img
              src={t.src}
              alt={`Page ${i + 1}`}
              className="w-full border border-gray-200 rounded shadow-sm"
              style={getImgStyle?.(i)}
              draggable={false}
            />
          ) : (
            <div
              className="w-full border border-gray-200 rounded bg-gray-50 flex items-center justify-center text-xs text-gray-400"
              style={{ aspectRatio: '0.707', width: thumbnailWidth, ...getImgStyle?.(i) }}
            >
              {t.loading ? 'Loading…' : ''}
            </div>
          )}
          <div aria-hidden="true" className="absolute top-1 left-1 text-xs bg-black/50 text-white px-1 rounded leading-tight">
            {i + 1}
          </div>
          {renderPageOverlay?.(i)}
        </div>
      ))}
    </div>
  )
}
