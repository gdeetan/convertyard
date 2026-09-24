'use client'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  files: File[]
  options: Record<string, unknown>
  onChange: (name: string, value: unknown) => void
  onRemove?: (index: number) => void
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
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

function GifCard({
  file,
  index,
  isActive,
  onSelect,
  onRemove,
}: {
  file: File
  index: number
  isActive: boolean
  onSelect: () => void
  onRemove?: (index: number) => void
}) {
  const url = useObjectUrl(file)
  return (
    <div
      className={
        'group relative flex flex-col overflow-hidden rounded border transition-colors ' +
        (isActive ? 'border-primary' : 'border-border hover:border-fg-subtle')
      }
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex aspect-square items-center justify-center bg-bg-subtle"
        title={file.name}
      >
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </button>
      <div className="flex items-baseline justify-between gap-2 border-t border-border bg-bg px-2 py-1.5 text-xs">
        <span className="truncate text-fg" title={file.name}>{file.name}</span>
        <span className="shrink-0 text-fg-muted">{formatBytes(file.size)}</span>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(index) }}
          className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function GifInputPreview({ files, onRemove }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  const totalBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files])

  useEffect(() => {
    if (activeIndex >= files.length && files.length > 0) setActiveIndex(0)
  }, [files.length, activeIndex])

  const active = files[activeIndex] ?? null
  const activeUrl = useObjectUrl(active)

  if (files.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-fg-subtle">
          Preview {files.length > 1 ? `— ${files.length} files, ${formatBytes(totalBytes)} total` : ''}
        </span>
        {files.length > 1 && (
          <span className="text-xs text-fg-subtle">Click a thumbnail to preview larger</span>
        )}
      </div>

      {files.length === 1 ? (
        <div className="flex items-center justify-center overflow-hidden rounded border border-border bg-bg-subtle">
          {activeUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeUrl}
              alt={active.name}
              className="max-h-[360px] max-w-full object-contain"
            />
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center overflow-hidden rounded border border-border bg-bg-subtle">
            {activeUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeUrl}
                alt={active.name}
                className="max-h-[300px] max-w-full object-contain"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {files.slice(0, 30).map((f, i) => (
              <GifCard
                key={`${f.name}-${f.size}-${i}`}
                file={f}
                index={i}
                isActive={i === activeIndex}
                onSelect={() => setActiveIndex(i)}
                onRemove={onRemove}
              />
            ))}
            {files.length > 30 && (
              <div className="flex aspect-square items-center justify-center rounded border border-dashed border-border text-xs text-fg-muted">
                +{files.length - 30} more
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
