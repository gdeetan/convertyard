'use client'

import { useEffect, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/merge-audio'

export default function Page() {
  const [engineReady, setEngineReady] = useState(false)

  useEffect(() => {
    import('@/lib/converters/ffmpeg-client').then(({ preloadFFmpeg, getFFmpeg }) => {
      preloadFFmpeg()
      getFFmpeg()
        .then(() => setEngineReady(true))
        .catch(() => setEngineReady(true))
    })
  }, [])

  return (
    <>
      {!engineReady && (
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
            Preparing audio merger… (downloading ~25 MB, one-time)
          </div>
        </div>
      )}
      <ToolShell config={config} />
    </>
  )
}
