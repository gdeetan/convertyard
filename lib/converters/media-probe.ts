const PROBE_TIMEOUT_MS = 1500

export async function probeVideoDuration(file: File): Promise<number> {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    return 0
  }
  try {
    return await new Promise<number>((resolve) => {
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)
      let settled = false

      const finish = (duration: number) => {
        if (settled) return
        settled = true
        clearTimeout(timeoutId)
        video.removeAttribute('src')
        video.load()
        URL.revokeObjectURL(objectUrl)
        resolve(duration)
      }

      const timeoutId = window.setTimeout(() => finish(0), PROBE_TIMEOUT_MS)

      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.onloadedmetadata = () => {
        const dur = video.duration
        finish(isFinite(dur) && dur > 0 ? dur : 0)
      }
      video.onerror = () => finish(0)
      video.src = objectUrl
    })
  } catch {
    return 0
  }
}

export async function probeVideoTrack(file: File): Promise<boolean | null> {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null
  }

  return new Promise((resolve) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    let settled = false

    const finish = (result: boolean | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(objectUrl)
      resolve(result)
    }

    const timeoutId = window.setTimeout(() => finish(null), PROBE_TIMEOUT_MS)

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true
    video.onloadedmetadata = () => finish(video.videoWidth > 0 && video.videoHeight > 0)
    video.onerror = () => finish(null)
    video.src = objectUrl
  })
}

export async function probeVideoDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof document === 'undefined' || typeof URL?.createObjectURL !== 'function') {
    return null
  }
  try {
    return await new Promise<{ width: number; height: number } | null>((resolve) => {
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)
      let settled = false

      const finish = (result: { width: number; height: number } | null) => {
        if (settled) return
        settled = true
        clearTimeout(timeoutId)
        video.removeAttribute('src')
        video.load()
        URL.revokeObjectURL(objectUrl)
        resolve(result)
      }

      const timeoutId = window.setTimeout(() => finish(null), PROBE_TIMEOUT_MS)

      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.onloadedmetadata = () => {
        const w = video.videoWidth
        const h = video.videoHeight
        finish(w > 0 && h > 0 ? { width: w, height: h } : null)
      }
      video.onerror = () => finish(null)
      video.src = objectUrl
    })
  } catch {
    return null
  }
}
