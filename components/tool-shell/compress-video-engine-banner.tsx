'use client'

import { useEffect, useState } from 'react'

export function CompressVideoEngineBanner() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    import('@/lib/converters/ffmpeg-client').then(({ preloadCompressVideoFFmpeg, getCompressVideoFFmpeg }) => {
      preloadCompressVideoFFmpeg()
      getCompressVideoFFmpeg()
        .then(() => setReady(true))
        .catch(() => setReady(true))
    })
  }, [])

  if (ready) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
      Preparing video compressor… (downloading ~25 MB, one-time)
    </div>
  )
}
