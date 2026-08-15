export interface CaptionWorkload {
  durationSec: number
  width: number
  height: number
  bytes: number
}

const LONG_SEC = 180
const HD_PIXELS = 1920 * 1080
const LARGE_BYTES = 80 * 1024 * 1024

function formatMinutes(sec: number): string {
  const m = Math.max(1, Math.round(sec / 60))
  return `${m} minute${m === 1 ? '' : 's'}`
}

function formatMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

/** Human warning when a file is likely to be slow or memory-heavy. Null if fine. */
export function captionWorkloadWarning(w: CaptionWorkload): string | null {
  const reasons: string[] = []
  if (w.durationSec >= LONG_SEC) reasons.push(formatMinutes(w.durationSec))
  if (w.width * w.height > HD_PIXELS) reasons.push(`${w.width}×${w.height}`)
  if (w.bytes >= LARGE_BYTES) reasons.push(formatMb(w.bytes))
  if (reasons.length === 0) return null
  return `This file is large (${reasons.join(', ')}). Transcription and burning can take several minutes and may run out of memory on this device.`
}
