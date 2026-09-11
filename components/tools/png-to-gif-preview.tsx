'use client'

import { useEffect, useRef, useState } from 'react'
import { gifPreview, isAnimatedPng } from '@/lib/converters/gif-convert'
import type { ToolOptions } from '@/lib/types'

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}

interface PreviewItem {
  file: File
  sourceUrl: string
  gifUrl: string | null
  encoding: boolean
  error: string | null
}

type PreviewState =
  | { kind: 'idle' }
  | { kind: 'detecting' }
  | { kind: 'static' }
  | { kind: 'animated'; items: PreviewItem[] }

const DEBOUNCE_MS = 500
const PREVIEW_FRAMES = 12
const MAX_PREVIEWS = 5

export function PngToGifPreview({ files, options }: Props) {
  const [state, setState] = useState<PreviewState>({ kind: 'idle' })
  const requestId = useRef(0)
  const sourceUrlsRef = useRef<string[]>([])
  const gifUrlsRef = useRef<string[]>([])

  const revokeAll = () => {
    for (const u of sourceUrlsRef.current) URL.revokeObjectURL(u)
    for (const u of gifUrlsRef.current) URL.revokeObjectURL(u)
    sourceUrlsRef.current = []
    gifUrlsRef.current = []
  }

  useEffect(() => {
    revokeAll()

    if (files.length === 0) {
      setState({ kind: 'idle' })
      return
    }
    setState({ kind: 'detecting' })
    let cancelled = false
    ;(async () => {
      const flags = await Promise.all(files.map((f) => isAnimatedPng(f)))
      if (cancelled) return
      const animated = files.filter((_, i) => flags[i]).slice(0, MAX_PREVIEWS)
      if (animated.length === 0) {
        setState({ kind: 'static' })
        return
      }
      const items: PreviewItem[] = animated.map((file) => {
        const url = URL.createObjectURL(file)
        sourceUrlsRef.current.push(url)
        return { file, sourceUrl: url, gifUrl: null, encoding: true, error: null }
      })
      setState({ kind: 'animated', items })
    })()
    return () => {
      cancelled = true
    }
  }, [files])

  // Debounced re-encode of all animated items on option change.
  useEffect(() => {
    if (state.kind !== 'animated') return
    const items = state.items
    const id = ++requestId.current
    setState((s) =>
      s.kind === 'animated'
        ? { ...s, items: s.items.map((it) => ({ ...it, encoding: true, error: null })) }
        : s,
    )
    const t = setTimeout(async () => {
      for (const [i, item] of items.entries()) {
        try {
          const out = await gifPreview(item.file, options, PREVIEW_FRAMES)
          if (id !== requestId.current) return
          const url = URL.createObjectURL(out)
          gifUrlsRef.current.push(url)
          setState((s) => {
            if (s.kind !== 'animated') return s
            const next = s.items.slice()
            const prev = next[i]?.gifUrl
            if (prev) URL.revokeObjectURL(prev)
            next[i] = { ...next[i], gifUrl: url, encoding: false }
            return { ...s, items: next }
          })
        } catch (err) {
          if (id !== requestId.current) return
          const msg = err instanceof Error ? err.message : String(err)
          setState((s) => {
            if (s.kind !== 'animated') return s
            const next = s.items.slice()
            next[i] = { ...next[i], encoding: false, error: msg }
            return { ...s, items: next }
          })
        }
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind === 'animated' ? JSON.stringify(options) : null, state.kind, state.kind === 'animated' ? state.items.length : 0])

  useEffect(() => {
    return () => {
      revokeAll()
    }
  }, [])

  if (state.kind === 'idle' || state.kind === 'detecting' || state.kind === 'static') return null

  const { items } = state
  const anyEncoding = items.some((it) => it.encoding)
  const total = files.filter((f) => f.type === 'image/apng' || f.name.toLowerCase().endsWith('.apng')).length
  const shownNote =
    items.length < total
      ? `Showing first ${items.length} of ${total} animated PNGs`
      : `${items.length} animated PNG${items.length === 1 ? '' : 's'}`

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-fg-subtle">
          Live preview · first {PREVIEW_FRAMES} frames · {shownNote}
        </span>
        {anyEncoding && <span className="text-xs text-fg-subtle">Rendering sample…</span>}
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-2 gap-3">
            <figure className="space-y-1">
              <img
                src={item.sourceUrl}
                alt={`Source animated PNG ${i + 1}`}
                className="h-40 w-full rounded border border-border bg-checker object-contain"
              />
              <figcaption className="truncate text-center text-xs text-fg-subtle" title={item.file.name}>
                Source APNG · {item.file.name}
              </figcaption>
            </figure>
            <figure className="space-y-1">
              {item.gifUrl ? (
                <img
                  src={item.gifUrl}
                  alt={`GIF preview ${i + 1} at current settings`}
                  className="h-40 w-full rounded border border-border bg-checker object-contain"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded border border-dashed border-border text-xs text-fg-subtle">
                  {item.error ? 'Preview failed' : 'Rendering…'}
                </div>
              )}
              <figcaption className="text-center text-xs text-fg-subtle">GIF preview</figcaption>
            </figure>
            {item.error && (
              <p className="col-span-2 text-xs text-red-600 dark:text-red-400">{item.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
