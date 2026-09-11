'use client'

import { useEffect, useRef, useState } from 'react'
import { gifPreview, isAnimatedPng } from '@/lib/converters/gif-convert'
import type { ToolOptions } from '@/lib/types'

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}

type PreviewState =
  | { kind: 'idle' }
  | { kind: 'detecting' }
  | { kind: 'static' }
  | { kind: 'animated'; sourceUrl: string; gifUrl: string | null; encoding: boolean; error: string | null }

const DEBOUNCE_MS = 500
const PREVIEW_FRAMES = 12

export function PngToGifPreview({ files, options }: Props) {
  const [state, setState] = useState<PreviewState>({ kind: 'idle' })
  const requestId = useRef(0)
  const sourceUrlRef = useRef<string | null>(null)
  const gifUrlRef = useRef<string | null>(null)

  // Detect on file change.
  useEffect(() => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
    if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current)
    sourceUrlRef.current = null
    gifUrlRef.current = null

    if (files.length !== 1) {
      setState({ kind: 'idle' })
      return
    }
    const file = files[0]
    setState({ kind: 'detecting' })
    let cancelled = false
    ;(async () => {
      const animated = await isAnimatedPng(file)
      if (cancelled) return
      if (!animated) {
        setState({ kind: 'static' })
        return
      }
      const url = URL.createObjectURL(file)
      sourceUrlRef.current = url
      setState({ kind: 'animated', sourceUrl: url, gifUrl: null, encoding: true, error: null })
    })()
    return () => {
      cancelled = true
    }
  }, [files])

  // Debounced re-encode on option change while APNG is loaded.
  useEffect(() => {
    if (state.kind !== 'animated' || files.length !== 1) return
    const file = files[0]
    const id = ++requestId.current
    setState((s) => (s.kind === 'animated' ? { ...s, encoding: true, error: null } : s))
    const t = setTimeout(async () => {
      try {
        const out = await gifPreview(file, options, PREVIEW_FRAMES)
        if (id !== requestId.current) return
        const url = URL.createObjectURL(out)
        if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current)
        gifUrlRef.current = url
        setState((s) => (s.kind === 'animated' ? { ...s, gifUrl: url, encoding: false } : s))
      } catch (err) {
        if (id !== requestId.current) return
        const msg = err instanceof Error ? err.message : String(err)
        setState((s) => (s.kind === 'animated' ? { ...s, encoding: false, error: msg } : s))
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
    // Re-run when options change (JSON.stringify keeps effect stable across referentially new but equal objects)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.kind === 'animated' ? JSON.stringify(options) : null, state.kind])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current)
      if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current)
    }
  }, [])

  if (state.kind === 'idle' || state.kind === 'detecting' || state.kind === 'static') return null

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-fg-subtle">Live preview · first {PREVIEW_FRAMES} frames</span>
        {state.encoding && <span className="text-xs text-fg-subtle">Rendering sample…</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <figure className="space-y-1">
          <img
            src={state.sourceUrl}
            alt="Source animated PNG"
            className="h-40 w-full rounded border border-border bg-checker object-contain"
          />
          <figcaption className="text-center text-xs text-fg-subtle">Source APNG</figcaption>
        </figure>
        <figure className="space-y-1">
          {state.gifUrl ? (
            <img
              src={state.gifUrl}
              alt="GIF preview at current settings"
              className="h-40 w-full rounded border border-border bg-checker object-contain"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded border border-dashed border-border text-xs text-fg-subtle">
              {state.error ? 'Preview failed' : 'Rendering…'}
            </div>
          )}
          <figcaption className="text-center text-xs text-fg-subtle">GIF preview</figcaption>
        </figure>
      </div>
      {state.error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{state.error}</p>
      )}
    </div>
  )
}
