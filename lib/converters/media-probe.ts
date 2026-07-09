const PROBE_TIMEOUT_MS = 1500

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
