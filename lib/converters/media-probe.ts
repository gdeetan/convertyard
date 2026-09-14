const PROBE_TIMEOUT_MS = 1500

// iOS Safari with `preload="metadata"` on <video> often over-fetches when
// the moov atom sits at the end of the file (common in phone captures),
// which turns a "cheap" probe into a multi-second wait for large clips.
// mediabunny's BlobSource does explicit range reads for the moov only.
function isIOSBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  return /Mac/.test(ua) && navigator.maxTouchPoints > 1
}

async function probeWithMediabunny(file: File): Promise<
  { durationSeconds: number; width: number; height: number } | null
> {
  try {
    const { Input, BlobSource, ALL_FORMATS } = await import('mediabunny')
    const probe = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
    try {
      const track = await probe.getPrimaryVideoTrack()
      if (!track) return null
      const durationSeconds = await probe.computeDuration()
      const width = await (track.getDisplayWidth?.() ?? track.getCodedWidth())
      const height = await (track.getDisplayHeight?.() ?? track.getCodedHeight())
      if (!width || !height) return null
      return { durationSeconds: isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0, width, height }
    } finally {
      probe.dispose()
    }
  } catch {
    return null
  }
}

export async function probeVideoDuration(file: File): Promise<number> {
  if (isIOSBrowser()) {
    const mb = await probeWithMediabunny(file)
    if (mb && mb.durationSeconds > 0) return mb.durationSeconds
  }
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
  if (isIOSBrowser()) {
    const mb = await probeWithMediabunny(file)
    if (mb) return { width: mb.width, height: mb.height }
  }
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

export async function probeAudioInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ffmpeg: { on: (event: string, handler: (data: { message: string }) => void) => void; off: (event: string, handler: unknown) => void; exec: (args: string[]) => Promise<void> },
  inputName: string
): Promise<{ codec: string; bitrateKbps: number } | null> {
  const lines: string[] = []
  const handler = ({ message }: { message: string }) => { lines.push(message) }
  ffmpeg.on('log', handler)
  try {
    // Header dump only. `-f null /dev/null` would decode the whole file.
    await ffmpeg.exec(['-i', inputName]).catch(() => {})
  } finally {
    ffmpeg.off('log', handler)
  }
  const output = lines.join('\n')
  // Returns null if no audio stream or bitrate absent from log — caller falls back to re-encoding
  const m = output.match(/Audio: (\w+).*?(\d+) kb\/s/)
  if (!m) return null
  return { codec: m[1], bitrateKbps: parseInt(m[2], 10) }
}

export async function probeVideoCodec(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ffmpeg: { on: (event: string, handler: (data: { message: string }) => void) => void; off: (event: string, handler: unknown) => void; exec: (args: string[]) => Promise<void> },
  inputName: string
): Promise<string | null> {
  const lines: string[] = []
  const handler = ({ message }: { message: string }) => { lines.push(message) }
  ffmpeg.on('log', handler)
  try {
    await ffmpeg.exec(['-i', inputName]).catch(() => {})
  } finally {
    ffmpeg.off('log', handler)
  }
  const m = lines.join('\n').match(/Video: (\w+)/)
  return m ? m[1] : null
}
