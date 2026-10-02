'use client'

import { useEffect, useMemo, useState } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/mp3-to-mp4'
import type { ToolOptions } from '@/lib/types'

export default function Page() {
  const [engineReady, setEngineReady] = useState(false)

  useEffect(() => {
    import('@/lib/converters/ffmpeg-client').then(({ getFFmpeg }) => {
      // Preload the multi-thread core: it serves the common path (black bg,
      // no waveform, no captions). The ST core loads on demand when a filter
      // graph is actually needed (image bg, waveform, or captions).
      getFFmpeg()
        .then(() => setEngineReady(true))
        .catch(() => setEngineReady(true))
    })
  }, [])

  const shellConfig = useMemo(() => ({
    ...config,
    onOptionsChange(options: ToolOptions) {
      if (options.captions !== true) return
      // Same 'balanced' model mp3ToMp4 transcribes with. Starting at toggle
      // time overlaps the ~290 MB download with file selection.
      void import('@/lib/converters/transcription-client').then(({ loadTranscriptionModel }) =>
        loadTranscriptionModel('balanced', () => {}).catch(() => {}),
      )
    },
  }), [])

  return (
    <>
      {!engineReady && (
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
            Preparing video converter… (downloading ~25 MB, one-time). Captions download an additional ~290 MB English speech model only if you turn captions on.
          </div>
        </div>
      )}
      <ToolShell config={shellConfig} />
    </>
  )
}
