'use client'

import { useEffect, useState } from 'react'

function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS 13+ reports as Mac; disambiguate by touch support.
  return ua.includes('Mac') && navigator.maxTouchPoints > 1
}

export function CompressVideoEngineBanner() {
  const [ready, setReady] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    setIos(isIOS())
    import('@/lib/converters/ffmpeg-client').then(({ preloadCompressVideoFFmpeg, getCompressVideoFFmpeg }) => {
      preloadCompressVideoFFmpeg()
      getCompressVideoFFmpeg()
        .then(() => setReady(true))
        .catch(() => setReady(true))
    })
  }, [])

  return (
    <div className="space-y-3">
      {!ready && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
          Preparing video compressor… (downloading ~25 MB, one-time)
        </div>
      )}
      {ios && (
        <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
          <span className="font-medium text-fg">On iPhone,</span> H.265 (HEVC) uses a software encoder for smooth playback — expect 5–10× longer encode time than H.264. For fastest compression, leave H.265 unchecked.
        </div>
      )}
    </div>
  )
}
