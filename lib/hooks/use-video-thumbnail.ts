'use client'

import { useEffect, useState } from 'react'

export function isVideoFile(file: File) {
  if (file.type.startsWith('video/')) return true
  return /\.(mp4|mov|webm|mkv|avi|flv|m4v|3gp)$/i.test(file.name)
}

// Extract a single frame from a video for a Finder-style thumbnail.
// Mirrors the approach used in compress-video-preview's useVideoMeta,
// which is known to work across Chrome/Safari/Firefox for the same
// blob sources the compressor accepts. Returns null on any failure so
// the caller falls back to a generic icon.
export function useVideoThumbnail(file?: File) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file || !isVideoFile(file)) {
      setUrl(null)
      return
    }
    let cancelled = false
    let captured = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = objectUrl
    video.muted = true
    video.playsInline = true
    // 'auto' pulls enough of the file to decode the first frame; 'metadata'
    // may stop after headers and the seek + drawImage never resolves.
    video.preload = 'auto'
    // NOTE: don't set crossOrigin on blob: URLs. Safari treats "anonymous"
    // on a blob URL as a CORS requirement it can't satisfy.

    const cleanup = () => {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null }
      video.removeAttribute('src')
      try { video.load() } catch { /* noop */ }
      URL.revokeObjectURL(objectUrl)
    }

    const onLoaded = () => {
      if (cancelled) return cleanup()
      // Force a tiny seek so `seeked` fires reliably across browsers and the
      // video pipeline decodes a real frame we can drawImage from. Setting
      // to a small non-zero value avoids the "already at 0, no seek needed"
      // browser optimization that would leave us waiting forever.
      try { video.currentTime = 0.1 } catch { /* some browsers throw on 0 */ }
    }

    const onSeeked = () => {
      if (cancelled || captured) return
      const w = video.videoWidth
      const h = video.videoHeight
      if (!w || !h) { cleanup(); return }
      const scale = Math.min(1, 128 / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(w * scale))
      canvas.height = Math.max(1, Math.round(h * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) { cleanup(); return }
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        captured = true
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setUrl(dataUrl)
        cleanup()
      } catch {
        cleanup()
      }
    }

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('error', cleanup)

    timeoutId = setTimeout(() => { if (!captured) cleanup() }, 8000)

    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('error', cleanup)
      cleanup()
    }
  }, [file])

  return url
}
