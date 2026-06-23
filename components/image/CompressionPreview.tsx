'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

interface Props {
  files: File[]
  results: (File | null)[]
  options: Record<string, unknown>
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function pct(original: number, compressed: number): string {
  if (original === 0) return '0%'
  return `${Math.round((1 - compressed / original) * 100)}%`
}

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) { setUrl(null); return }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])
  return url
}

function ComparisonSlider({
  originalUrl,
  compressedUrl,
  originalSize,
  compressedSize,
}: {
  originalUrl: string
  compressedUrl: string
  originalSize: number
  compressedSize: number
}) {
  const [dividerX, setDividerX] = useState(50) // percent
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updateFromEvent = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setDividerX(x)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as Element).setPointerCapture(e.pointerId)
    updateFromEvent(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) updateFromEvent(e.clientX)
  }
  const onPointerUp = () => { dragging.current = false }

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-lg border border-border bg-bg-elevated"
      style={{ minHeight: 200 }}
    >
      {/* Original (left) */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalUrl}
          alt="Original"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>

      {/* Compressed (right), clipped from left */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${dividerX}%)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={compressedUrl}
          alt="Compressed"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
        style={{ left: `${dividerX}%`, transform: 'translateX(-50%)' }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-border bg-white shadow-md"
        style={{ left: `${dividerX}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M4 3L1 6L4 9M8 3L11 6L8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Labels */}
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
        Original · {formatBytes(originalSize)}
      </div>
      <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
        Compressed · {formatBytes(compressedSize)} · {pct(originalSize, compressedSize)} smaller
      </div>

      {/* Overlay for full-width drag */}
      <div
        className="absolute inset-0 cursor-ew-resize"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  )
}

function Thumbnail({ file, active, onClick }: { file: File; active: boolean; onClick: () => void }) {
  const url = useObjectUrl(file)
  if (!url) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded border-2 transition-colors ${
        active ? 'border-primary' : 'border-border hover:border-border-hover'
      }`}
      title={file.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={file.name} className="h-12 w-12 rounded object-cover" />
    </button>
  )
}

export function ImageCompressionPreview({ files, results }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  // Find first file with a result
  useEffect(() => {
    const firstDone = results.findIndex((r) => r !== null)
    if (firstDone >= 0) setActiveIdx(firstDone)
  }, [results])

  const doneCount = results.filter(Boolean).length
  if (doneCount === 0) return null

  const activeFile = files[activeIdx] ?? null
  const activeResult = results[activeIdx] ?? null

  const originalUrl = useObjectUrl(activeFile)
  const compressedUrl = useObjectUrl(activeResult)

  if (!originalUrl || !compressedUrl || !activeFile || !activeResult) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg">Before / After</span>
        <span className="text-xs text-fg-subtle">Drag the divider to compare</span>
      </div>

      <ComparisonSlider
        originalUrl={originalUrl}
        compressedUrl={compressedUrl}
        originalSize={activeFile.size}
        compressedSize={activeResult.size}
      />

      {/* Thumbnail strip for batch */}
      {files.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {files.map((file, i) => {
            const result = results[i]
            if (!result) return null
            return (
              <Thumbnail
                key={`${file.name}-${file.size}`}
                file={file}
                active={i === activeIdx}
                onClick={() => setActiveIdx(i)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
