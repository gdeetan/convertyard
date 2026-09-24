'use client'
import { useEffect, useMemo, useState } from 'react'

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

function pctSaved(original: number, compressed: number): string {
  if (original === 0) return '0%'
  const saved = Math.round((1 - compressed / original) * 100)
  return saved >= 0 ? `${saved}% smaller` : `${Math.abs(saved)}% larger`
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

export function GifCompressionPreview({ files, results }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  const pairs = useMemo(() => {
    return files
      .map((f, i) => ({ i, file: f, result: results[i] ?? null }))
      .filter((p) => p.result !== null)
  }, [files, results])

  useEffect(() => {
    if (activeIndex >= pairs.length && pairs.length > 0) setActiveIndex(0)
  }, [pairs.length, activeIndex])

  const active = pairs[activeIndex] ?? null
  const originalUrl = useObjectUrl(active?.file ?? null)
  const compressedUrl = useObjectUrl(active?.result ?? null)

  if (pairs.length === 0) return null

  const original = active?.file
  const compressed = active?.result

  return (
    <div className="w-full">
      {pairs.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {pairs.slice(0, 8).map((p, idx) => (
            <button
              key={p.i}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={
                'rounded border px-3 py-1 text-xs transition-colors ' +
                (idx === activeIndex
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg text-fg-muted hover:border-primary hover:text-fg')
              }
              title={p.file.name}
            >
              {p.file.name.length > 20 ? p.file.name.slice(0, 17) + '…' : p.file.name}
            </button>
          ))}
          {pairs.length > 8 && (
            <span className="self-center text-xs text-fg-muted">
              +{pairs.length - 8} more
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Original
            </span>
            {original && (
              <span className="text-sm font-medium text-fg">
                {formatBytes(original.size)}
              </span>
            )}
          </div>
          <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded border border-border bg-bg-subtle">
            {originalUrl && (
              // Native <img> preserves GIF playback — no decode needed.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={originalUrl}
                alt="Original GIF"
                className="max-h-[480px] max-w-full object-contain"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Compressed
            </span>
            {compressed && original && (
              <span className="text-sm font-medium text-fg">
                {formatBytes(compressed.size)}{' '}
                <span className="text-xs text-primary">
                  ({pctSaved(original.size, compressed.size)})
                </span>
              </span>
            )}
          </div>
          <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded border border-border bg-bg-subtle">
            {compressedUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={compressedUrl}
                alt="Compressed GIF"
                className="max-h-[480px] max-w-full object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {pairs.length > 1 && (
        <p className="mt-3 text-xs text-fg-muted">
          Showing file {activeIndex + 1} of {pairs.length}. Both animations loop natively.
        </p>
      )}
    </div>
  )
}
