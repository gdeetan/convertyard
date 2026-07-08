'use client'

import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { BeforeAfterSlider } from '@/components/image/BeforeAfterSlider'
import { config } from '@/content/tools/image-upscaler'
import type { ToolOptions } from '@/lib/types'

// ── Before/After preview panel ─────────────────────────────────────────────

const MAX_PREVIEW = 3

function PreviewPanel({
  files,
  results,
}: {
  files: File[]
  results: (File | null)[]
  options: ToolOptions
}) {
  // No results yet — show nothing
  const hasAnyResult = results.some((r) => r !== null)
  if (!hasAnyResult) return null

  return <PreviewPanelInner files={files} results={results} />
}

function PreviewPanelInner({
  files,
  results,
}: {
  files: File[]
  results: (File | null)[]
}) {
  // Pairs where we have both original + result
  const pairs = files
    .map((f, i) => ({ file: f, result: results[i] }))
    .filter((p): p is { file: File; result: File } => p.result !== null)

  const visible = pairs.slice(0, MAX_PREVIEW)
  const extra = pairs.length - MAX_PREVIEW

  // Object URLs — created per pair, revoked on unmount or change
  const [urls, setUrls] = useState<Array<{ before: string; after: string }>>([])

  useEffect(() => {
    const created = visible.map((p) => ({
      before: URL.createObjectURL(p.file),
      after: URL.createObjectURL(p.result),
    }))
    setUrls(created)
    return () => {
      for (const u of created) {
        URL.revokeObjectURL(u.before)
        URL.revokeObjectURL(u.after)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.map((p) => p.result.name + p.result.size).join('|')])

  if (urls.length === 0) return null

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-fg-muted">Before / After</p>
      {urls.map((u, i) => (
        <BeforeAfterSlider
          key={u.after}
          before={u.before}
          after={u.after}
          label={`${visible[i].file.name} — upscaled`}
        />
      ))}
      {extra > 0 && (
        <p className="text-center text-sm text-fg-muted">
          +{extra} more {extra === 1 ? 'result' : 'results'} available in the download
        </p>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

function ImageUpscalerPage() {
  const [modelProgress, setModelProgress] = useState<number | null>(null)
  const [modelReady, setModelReady] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    import('@/lib/converters/transformers-client').then(({ loadUpscaler }) => {
      // Pre-load the 4x model (default scale) so it's ready when user drops files
      loadUpscaler('4x', (pct) => {
        setModelProgress(pct)
      })
        .then(() => {
          setModelReady(true)
          setModelProgress(null)
        })
        .catch(() => {
          // Let convertFn surface the error on first conversion attempt
          setModelReady(true)
          setModelProgress(null)
        })
    })
  }, [])

  const configWithPreview = {
    ...config,
    previewPanel: PreviewPanel as typeof config.previewPanel,
  }

  return (
    <>
      {!modelReady && (
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div
              className="h-2 w-2 animate-pulse rounded-full bg-primary shrink-0"
              aria-hidden="true"
            />
            <span className="flex-1 min-w-0">
              {modelProgress !== null && modelProgress > 0
                ? `Downloading AI model… ${modelProgress}% (~200 MB, one-time)`
                : 'Loading AI model…'}
            </span>
            {modelProgress !== null && modelProgress > 0 && (
              <span
                className="shrink-0 font-medium text-primary"
                aria-live="polite"
              >
                {modelProgress}%
              </span>
            )}
          </div>
          {modelProgress !== null && modelProgress > 0 && (
            <div className="mx-4 sm:mx-6 mt-1 h-1 rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${modelProgress}%` }}
                role="progressbar"
                aria-valuenow={modelProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
        </div>
      )}
      <ToolShell config={configWithPreview} />
    </>
  )
}

export default function Page() {
  return (
    <Suspense>
      <ImageUpscalerPage />
    </Suspense>
  )
}
