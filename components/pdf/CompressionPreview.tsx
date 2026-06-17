'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ComparisonSlider } from '@/components/ui/ComparisonSlider'
import { renderPagePng, getPageCount } from '@/lib/converters/mupdf-client'
import { formatBytes } from '@/lib/utils/download'
import { cn } from '@/lib/utils/cn'

interface CompressionPreviewProps {
  files: File[]
  results: (File | null)[]
  selectedIndex: number
  onSelectIndex: (i: number) => void
}

type RenderState = 'idle' | 'rendering-original' | 'ready-original' | 'rendering-compressed' | 'ready-both'

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

  const currentFile = files[selectedIndex]
  const currentResult = results[selectedIndex] ?? null

  useEffect(() => {
    if (!currentFile) return
    let cancelled = false
    currentFile.arrayBuffer().then(buf =>
      getPageCount(buf).then(n => { if (!cancelled) setPageCount(n) }).catch(() => {})
    )
    return () => { cancelled = true }
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
        const buffer = await currentFile.arrayBuffer()
        const pngBuffer = await renderPagePng(buffer, selectedPage, 96)
        if (cancelled) return
        const blob = new Blob([pngBuffer], { type: 'image/png' })
        setOriginalUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
        setRenderState(currentResult || prevResultRef.current ? 'ready-both' : 'ready-original')
      } catch {
        if (!cancelled) setRenderState('idle')
      }
    })()

    return () => { cancelled = true }
  }, [currentFile, selectedPage])

  useEffect(() => {
    if (!currentResult) return
    prevResultRef.current = currentResult
    setRenderState('rendering-compressed')

    let cancelled = false
    ;(async () => {
      try {
        const buffer = await currentResult.arrayBuffer()
        const pngBuffer = await renderPagePng(buffer, selectedPage, 96)
        if (cancelled) return
        const blob = new Blob([pngBuffer], { type: 'image/png' })
        setCompressedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob) })
        setRenderState('ready-both')
      } catch {
        if (!cancelled) setRenderState('ready-original')
      }
    })()

    return () => { cancelled = true }
  }, [currentResult, selectedPage])

  if (!currentFile) return null

  const originalLabel = `Before (${formatBytes(currentFile.size)})`
  const compressedLabel = currentResult ? `After (${formatBytes(currentResult.size)})` : 'After'

  return (
    <div className="space-y-2">
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

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1 text-xs text-fg-muted">
          <span className="mr-1">Page:</span>
          {Array.from({ length: Math.min(3, pageCount) }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedPage(i)}
              className={cn(
                'rounded px-2 py-0.5 transition-colors',
                selectedPage === i
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:text-fg'
              )}
            >
              {i + 1}
            </button>
          ))}
          {pageCount > 3 && <span className="text-fg-subtle">…</span>}
        </div>
      )}

      <div
        className="overflow-hidden rounded-lg border border-border bg-bg-muted"
        style={{ aspectRatio: '3/4', maxHeight: '480px' }}
      >
        {renderState === 'idle' || renderState === 'rendering-original' ? (
          <div className="flex h-full items-center justify-center text-sm text-fg-subtle">
            {renderState === 'rendering-original' ? 'Loading preview…' : ''}
          </div>
        ) : (
          <>
            {/* Desktop: side-by-side slider */}
            <div className="hidden h-full md:block">
              <ComparisonSlider
                left={
                  <div className="relative h-full bg-bg-muted">
                    {originalUrl && (
                      <img src={originalUrl} alt="Original PDF page 1" className="h-full w-full object-contain" />
                    )}
                    <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                      {originalLabel}
                    </span>
                  </div>
                }
                right={
                  <div className="relative h-full bg-bg-muted">
                    {compressedUrl ? (
                      <img src={compressedUrl} alt="Compressed PDF page 1" className="h-full w-full object-contain" />
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
                  <img src={originalUrl} alt="Original PDF page 1" className="h-full w-full object-contain" />
                )}
                <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {originalLabel}
                </span>
              </div>
              <div className="relative flex-1 bg-bg-muted">
                {compressedUrl ? (
                  <img src={compressedUrl} alt="Compressed PDF page 1" className="h-full w-full object-contain" />
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
          </>
        )}
      </div>
    </div>
  )
}
