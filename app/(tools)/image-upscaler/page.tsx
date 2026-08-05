'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
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
  const pairs = files
    .map((f, i) => ({ file: f, result: results[i] }))
    .filter((p): p is { file: File; result: File } => p.result !== null)

  const visible = pairs.slice(0, MAX_PREVIEW)
  const extra = pairs.length - MAX_PREVIEW

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
  const [modelReady, setModelReady] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    // Safety net: hide the banner after 30s regardless of model state
    const timeout = setTimeout(() => setModelReady(true), 30_000)

    import('@/lib/converters/upscaler-engine')
      .then(({ loadUpscalerModel }) =>
        loadUpscalerModel('4x').finally(() => setModelReady(true))
      )
      .catch(() => setModelReady(true))
      .finally(() => clearTimeout(timeout))
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
            <span>Loading AI model…</span>
          </div>
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
