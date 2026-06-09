'use client'

import { useEffect, useState, useRef } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/background-remover'

export default function Page() {
  const [modelProgress, setModelProgress] = useState<number | null>(null)
  const [modelReady, setModelReady] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true

    import('@/lib/converters/transformers-client').then(({ loadTransformersModel }) => {
      loadTransformersModel('bg-removal', (pct) => {
        setModelProgress(pct)
      }).then(() => {
        setModelReady(true)
        setModelProgress(null)
      }).catch(() => {
        // Let the tool surface the error on first conversion attempt
        setModelReady(true)
        setModelProgress(null)
      })
    })
  }, [])

  return (
    <>
      {!modelReady && (
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary shrink-0" aria-hidden="true" />
            <span className="flex-1 min-w-0">
              {modelProgress !== null && modelProgress > 0
                ? `Downloading AI model… ${modelProgress}% (176 MB, one-time)`
                : 'Loading AI model…'}
            </span>
            {modelProgress !== null && modelProgress > 0 && (
              <span className="shrink-0 font-medium text-primary" aria-live="polite">
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
      <ToolShell config={config} />
    </>
  )
}
