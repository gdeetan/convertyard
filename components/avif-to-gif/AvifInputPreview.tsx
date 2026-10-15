'use client'
import { useEffect, useState } from 'react'

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

interface Meta {
  frameCount: number | null
  width: number | null
  height: number | null
}

function useAvifMeta(file: File | null): Meta {
  const [meta, setMeta] = useState<Meta>({ frameCount: null, width: null, height: null })
  useEffect(() => {
    if (!file) { setMeta({ frameCount: null, width: null, height: null }); return }
    let active = true
    const g = globalThis as unknown as {
      ImageDecoder?: new (init: { data: ArrayBuffer; type: string }) => {
        tracks: {
          ready: Promise<void>
          selectedTrack: { frameCount: number } | null
        }
        completed: Promise<void>
        decode: (opts: { frameIndex: number }) => Promise<{
          image: { displayWidth: number; displayHeight: number; close: () => void }
        }>
        close: () => void
      }
    }
    if (typeof g.ImageDecoder !== 'function') return
    file.arrayBuffer().then((buf) => {
      if (!active) return
      try {
        const decoder = new g.ImageDecoder!({ data: buf, type: 'image/avif' })
        decoder.tracks.ready.then(async () => {
          try {
            await decoder.completed
            if (!active) { decoder.close(); return }
            const track = decoder.tracks.selectedTrack
            const first = await decoder.decode({ frameIndex: 0 })
            if (!active) { first.image.close(); decoder.close(); return }
            setMeta({
              frameCount: track?.frameCount ?? 1,
              width: first.image.displayWidth,
              height: first.image.displayHeight,
            })
            first.image.close()
            decoder.close()
          } catch {
            decoder.close()
          }
        })
      } catch {
        // ignore — the convert path will surface a clean error
      }
    })
    return () => { active = false }
  }, [file])
  return meta
}

function AvifCard({
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
          <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
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

export function AvifInputPreview({ files, onRemove }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeIndex >= files.length && files.length > 0) setActiveIndex(0)
  }, [files.length, activeIndex])

  const active = files[activeIndex] ?? null
  const activeUrl = useObjectUrl(active)
  const meta = useAvifMeta(active)

  if (files.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-bg-subtle p-3">
        <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded bg-black/5">
          {activeUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeUrl}
              alt={active?.name ?? ''}
              className="max-h-full max-w-full object-contain"
            />
          )}
        </div>
        {active && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
            <span className="truncate text-fg" title={active.name}>{active.name}</span>
            <span>{formatBytes(active.size)}</span>
            {meta.width && meta.height && <span>{meta.width} × {meta.height}</span>}
            {meta.frameCount != null && (
              <span>{meta.frameCount} {meta.frameCount === 1 ? 'frame (static)' : 'frames'}</span>
            )}
          </div>
        )}
      </div>

      {files.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {files.map((f, i) => (
            <AvifCard
              key={`${f.name}-${f.lastModified}-${i}`}
              file={f}
              index={i}
              isActive={i === activeIndex}
              onSelect={() => setActiveIndex(i)}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
