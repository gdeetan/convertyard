'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { ComparisonSlider } from '@/components/ui/ComparisonSlider'
import { renderPagePng, getPageCount, openPdf, closePdf } from '@/lib/converters/mupdf-client'
import { formatBytes } from '@/lib/utils/download'
import { cn } from '@/lib/utils/cn'

interface CompressionPreviewProps {
  files: File[]
  results: (File | null)[]
  selectedIndex: number
  onSelectIndex: (i: number) => void
}

type RenderState = 'idle' | 'rendering-original' | 'ready-original' | 'rendering-compressed' | 'ready-both'
type ZoomLevel = 1 | 2 | 3

// Lowered from 96 to 72 at zoom=1 — ~44% fewer pixels to render, which
// dominates preview wall time on the initial page load. 72 DPI is still
// crisp for a thumbnail preview; zoom-in ladder covers detail inspection.
const ZOOM_DPI: Record<ZoomLevel, number> = { 1: 72, 2: 144, 3: 216 }
const CONTAINER_HEIGHT: Record<ZoomLevel, string> = {
  1: 'h-[420px]',
  2: 'h-[680px]',
  3: 'h-[900px]',
}

function PagePicker({
  current,
  total,
  onSelect,
}: {
  current: number
  total: number
  onSelect: (p: number) => void
}) {
  const btn = (i: number) => (
    <button
      key={i}
      type="button"
      onClick={() => onSelect(i)}
      className={cn(
        'min-w-[1.75rem] rounded px-1.5 py-0.5 transition-colors tabular-nums',
        current === i
          ? 'bg-primary/10 text-primary font-medium'
          : 'hover:text-fg'
      )}
    >
      {i + 1}
    </button>
  )

  if (total <= 10) {
    return <>{Array.from({ length: total }, (_, i) => btn(i))}</>
  }

  // Windowed: always show first, last, and ±2 around current
  const visible = new Set(
    [0, total - 1, current - 2, current - 1, current, current + 1, current + 2].filter(
      p => p >= 0 && p < total
    )
  )
  const sorted = [...visible].sort((a, b) => a - b)
  const nodes: React.ReactNode[] = []
  let prev = -1
  for (const p of sorted) {
    if (prev !== -1 && p > prev + 1) {
      nodes.push(
        <span key={`gap-${p}`} className="px-0.5 text-fg-subtle select-none">
          …
        </span>
      )
    }
    nodes.push(btn(p))
    prev = p
  }
  return <>{nodes}</>
}

export function CompressionPreview({
  files,
  results,
  selectedIndex,
  onSelectIndex,
}: CompressionPreviewProps) {
  const [renderState, setRenderState] = useState<RenderState>('idle')
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null)
  const prevFileRef = useRef<File | null>(null)
  const prevResultRef = useRef<File | null>(null)
  const [selectedPage, setSelectedPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [zoom, setZoom] = useState<ZoomLevel>(1)

  const currentFile = files[selectedIndex]
  const currentResult = results[selectedIndex] ?? null
  const renderDpi = ZOOM_DPI[zoom]

  // Persist an open mupdf doc handle for the current original + compressed
  // file. Every subsequent getPageCount / renderPagePng call is a cheap
  // "look up docId in worker cache" — no parse. Prior code re-transferred
  // + re-parsed the whole PDF into the worker for both page count and
  // render, which on a 10 MB PDF is a wasted ~50–150 ms per parse.
  const originalDocIdRef = useRef<string | null>(null)
  const compressedDocIdRef = useRef<string | null>(null)

  // Open the original doc when the file changes. Close prior handle first.
  useEffect(() => {
    if (!currentFile) return
    let cancelled = false
    const prev = originalDocIdRef.current
    originalDocIdRef.current = null
    if (prev) closePdf({ docId: prev }).catch(() => {})
    ;(async () => {
      try {
        const buffer = await currentFile.arrayBuffer()
        const handle = await openPdf(buffer)
        if (cancelled) {
          closePdf(handle).catch(() => {})
          return
        }
        originalDocIdRef.current = handle.docId
        // Page count kicks off the picker; render happens in the next effect
        // once selectedPage/renderDpi settle. Both share the same docId.
        try {
          const n = await getPageCount(handle)
          if (!cancelled) setPageCount(n)
        } catch { /* best-effort */ }
      } catch { /* best-effort */ }
    })()
    return () => {
      cancelled = true
    }
  }, [currentFile])

  // Reset page when file changes
  useEffect(() => {
    setSelectedPage(0)
  }, [currentFile])

  useEffect(() => {
    if (!currentFile) return
    const fileChanged = currentFile !== prevFileRef.current
    if (fileChanged) {
      prevFileRef.current = currentFile
      prevResultRef.current = null
      setCompressedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
    }
    setRenderState('rendering-original')

    let cancelled = false
    ;(async () => {
      try {
        // Wait for the doc-open effect to hand us a docId. Poll cheaply —
        // openPdf typically resolves within a few tens of ms.
        let docId = originalDocIdRef.current
        for (let i = 0; docId === null && i < 200 && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 10))
          docId = originalDocIdRef.current
        }
        if (cancelled) return
        const source = docId
          ? { docId }
          : (await currentFile.arrayBuffer())
        const pngBuffer = await renderPagePng(source, selectedPage, renderDpi)
        if (cancelled) return
        const blob = new Blob([pngBuffer], { type: 'image/png' })
        setOriginalUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
        setRenderState(currentResult || prevResultRef.current ? 'ready-both' : 'ready-original')
      } catch {
        if (!cancelled) setRenderState('idle')
      }
    })()

    return () => { cancelled = true }
  }, [currentFile, selectedPage, renderDpi])

  useEffect(() => {
    if (!currentResult) return
    prevResultRef.current = currentResult
    setRenderState('rendering-compressed')

    let cancelled = false
    ;(async () => {
      try {
        // Compressed doc is opened lazily on first render — the result
        // arrives after compression, so there's no upfront open effect.
        // Cache the handle across zoom/page changes.
        if (!compressedDocIdRef.current) {
          const buffer = await currentResult.arrayBuffer()
          const handle = await openPdf(buffer)
          if (cancelled) {
            closePdf(handle).catch(() => {})
            return
          }
          compressedDocIdRef.current = handle.docId
        }
        const docId = compressedDocIdRef.current!
        const pngBuffer = await renderPagePng({ docId }, selectedPage, renderDpi)
        if (cancelled) return
        const blob = new Blob([pngBuffer], { type: 'image/png' })
        setCompressedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
        setRenderState('ready-both')
      } catch {
        if (!cancelled) setRenderState('ready-original')
      }
    })()

    return () => { cancelled = true }
  }, [currentResult, selectedPage, renderDpi])

  // Reset compressed handle when result changes.
  useEffect(() => {
    const prev = compressedDocIdRef.current
    compressedDocIdRef.current = null
    if (prev) closePdf({ docId: prev }).catch(() => {})
  }, [currentResult])

  // Close both handles on unmount.
  useEffect(() => {
    return () => {
      const a = originalDocIdRef.current
      const b = compressedDocIdRef.current
      originalDocIdRef.current = null
      compressedDocIdRef.current = null
      if (a) closePdf({ docId: a }).catch(() => {})
      if (b) closePdf({ docId: b }).catch(() => {})
    }
  }, [])

  if (!currentFile) return null

  const originalLabel = `Before (${formatBytes(currentFile.size)})`
  const compressedLabel = currentResult ? `After (${formatBytes(currentResult.size)})` : 'After'

  return (
    <div className="space-y-2">
      {/* File navigator */}
      {files.length > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm text-fg-muted">
          <button
            type="button"
            aria-label="Previous file"
            onClick={() => onSelectIndex(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
            className="disabled:opacity-40 hover:text-fg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums">
            {files[selectedIndex].name} ({selectedIndex + 1} of {files.length})
          </span>
          <button
            type="button"
            aria-label="Next file"
            onClick={() => onSelectIndex(Math.min(files.length - 1, selectedIndex + 1))}
            disabled={selectedIndex === files.length - 1}
            className="disabled:opacity-40 hover:text-fg transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page selector + zoom controls */}
      <div className="flex items-center justify-between gap-2 text-xs text-fg-muted">
        <div className="flex items-center gap-1 flex-wrap">
          {pageCount > 1 && (
            <>
              <span className="mr-1 shrink-0">Page:</span>
              <PagePicker
                current={selectedPage}
                total={pageCount}
                onSelect={p => setSelectedPage(p)}
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => setZoom(z => Math.max(1, z - 1) as ZoomLevel)}
            disabled={zoom === 1}
            className="rounded p-1 hover:bg-bg-muted transition-colors disabled:opacity-30"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="tabular-nums w-6 text-center">{zoom}×</span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => setZoom(z => Math.min(3, z + 1) as ZoomLevel)}
            disabled={zoom === 3}
            className="rounded p-1 hover:bg-bg-muted transition-colors disabled:opacity-30"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Preview container */}
      <div
        className={cn(
          'overflow-auto rounded-lg border border-border bg-bg-muted transition-[height] duration-200',
          CONTAINER_HEIGHT[zoom]
        )}
      >
        {renderState === 'idle' || renderState === 'rendering-original' ? (
          <div className="flex h-full items-center justify-center text-sm text-fg-subtle">
            {renderState === 'rendering-original' ? 'Loading preview…' : ''}
          </div>
        ) : (
          <div className="h-full">
            {/* Desktop: side-by-side slider */}
            <div className="hidden h-full md:block">
              <ComparisonSlider
                left={
                  <div className="relative h-full bg-bg-muted">
                    {originalUrl && (
                      <img src={originalUrl} alt={`Original PDF page ${selectedPage + 1}`} className="h-full w-full object-contain" />
                    )}
                    <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                      {originalLabel}
                    </span>
                  </div>
                }
                right={
                  <div className="relative h-full bg-bg-muted">
                    {compressedUrl ? (
                      <img src={compressedUrl} alt={`Compressed PDF page ${selectedPage + 1}`} className="h-full w-full object-contain" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-fg-subtle">
                        {renderState === 'rendering-compressed' ? 'Rendering…' : 'Compress to preview'}
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                      {compressedLabel}
                    </span>
                  </div>
                }
              />
            </div>

            {/* Mobile: stacked */}
            <div className="flex h-full flex-col divide-y divide-border md:hidden">
              <div className="relative flex-1 bg-bg-muted">
                {originalUrl && (
                  <img src={originalUrl} alt={`Original PDF page ${selectedPage + 1}`} className="h-full w-full object-contain" />
                )}
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {originalLabel}
                </span>
              </div>
              <div className="relative flex-1 bg-bg-muted">
                {compressedUrl ? (
                  <img src={compressedUrl} alt={`Compressed PDF page ${selectedPage + 1}`} className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-fg-subtle">
                    Compress to preview
                  </div>
                )}
                <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {compressedLabel}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
