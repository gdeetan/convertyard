'use client'

import { useEffect, useState } from 'react'

export function isVideoFile(file: File) {
  if (file.type.startsWith('video/')) return true
  return /\.(mp4|mov|webm|mkv|avi|flv|m4v|3gp)$/i.test(file.name)
}

// Extract a single frame from a video for a Finder-style thumbnail.
// Returns null on any failure so the caller falls back to a generic icon.
export function useVideoThumbnail(file?: File) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file || !isVideoFile(file)) {
      setUrl(null)
      return
    }
    let cancelled = false
    let generatedUrl: string | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    // Some browsers (notably iOS Safari and some Android Chromium builds)
    // won't fully decode a detached <video>. Park it off-screen so it lives
    // in the DOM and loads reliably.
    video.style.position = 'fixed'
    video.style.left = '-9999px'
    video.style.top = '-9999px'
    video.style.width = '1px'
    video.style.height = '1px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    document.body.appendChild(video)
    // NOTE: don't set crossOrigin on blob: URLs. Safari treats "anonymous"
    // on a blob URL as a CORS requirement it can't satisfy and refuses to
    // decode the video, which is why the thumbnail rendered as a black box
    // on macOS Safari. Blob URLs share the document origin — no CORS needed.
    video.src = objectUrl

    const cleanup = () => {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null }
      video.removeAttribute('src')
      try { video.load() } catch { /* noop */ }
      if (video.parentNode) video.parentNode.removeChild(video)
      URL.revokeObjectURL(objectUrl)
    }

    let captured = false
    const capture = () => {
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
        canvas.toBlob((blob) => {
          if (cancelled) { cleanup(); return }
          if (!blob) { cleanup(); return }
          generatedUrl = URL.createObjectURL(blob)
          setUrl(generatedUrl)
          cleanup()
        }, 'image/jpeg', 0.8)
      } catch {
        cleanup()
      }
    }

    // Safari fires `seeked` before the frame is actually decoded, so drawImage
    // captures a black frame. requestVideoFrameCallback (Safari 15.4+) only
    // fires after a frame is presentable. Fall back to `seeked` on browsers
    // without rVFC (older Safari, some mobile).
    const scheduleCapture = () => {
      if (cancelled || captured) return
      const rVFC = (video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback
      if (typeof rVFC === 'function') {
        rVFC.call(video, () => capture())
      } else {
        capture()
      }
    }

    video.onloadedmetadata = () => {
      if (cancelled) return
      const duration = video.duration || 0
      const seekTo = duration > 0
        ? Math.min(3, Math.max(1, duration * 0.1))
        : 1
      const target = Math.min(seekTo, Math.max(0, duration - 0.1))
      try { video.currentTime = 0 } catch { /* noop */ }
      video.currentTime = target
    }
    video.onseeked = scheduleCapture
    video.onloadeddata = () => {
      if (cancelled || captured) return
      setTimeout(() => { if (!captured) scheduleCapture() }, 400)
    }
    video.onerror = cleanup

    timeoutId = setTimeout(() => {
      if (!captured) cleanup()
    }, 6000)

    return () => {
      cancelled = true
      cleanup()
      if (generatedUrl) URL.revokeObjectURL(generatedUrl)
    }
  }, [file])

  return url
}
