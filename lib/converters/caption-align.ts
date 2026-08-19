import type { WordChunk } from './caption-types'

const FRAME_SEC = 0.01
const MAX_SNAP_SEC = 0.75
const MIN_SPAN = 0.05

function rmsFrames(audio: Float32Array, sampleRate: number): Float32Array {
  const n = Math.max(1, Math.round(sampleRate * FRAME_SEC))
  const frames = new Float32Array(Math.ceil(audio.length / n))
  for (let i = 0; i < frames.length; i++) {
    const start = i * n
    const end = Math.min(audio.length, start + n)
    let sum = 0
    for (let j = start; j < end; j++) sum += audio[j] * audio[j]
    frames[i] = Math.sqrt(sum / Math.max(1, end - start))
  }
  return frames
}

function detectOnsets(rms: Float32Array): number[] {
  if (rms.length < 3) return []
  const smooth = new Float32Array(rms.length)
  for (let i = 0; i < rms.length; i++) {
    const a = rms[Math.max(0, i - 1)]
    const b = rms[i]
    const c = rms[Math.min(rms.length - 1, i + 1)]
    smooth[i] = (a + b + c) / 3
  }
  const sorted = Array.from(smooth).sort((x, y) => x - y)
  const floor = sorted[Math.floor(sorted.length * 0.3)] ?? 0
  const peak = sorted[sorted.length - 1] ?? 0
  const thresh = Math.max(floor * 3.5, peak * 0.18, 0.02)
  const onsets: number[] = []
  let armed = true
  for (let i = 1; i < smooth.length; i++) {
    if (armed && smooth[i] >= thresh && smooth[i - 1] < thresh) {
      onsets.push(i * FRAME_SEC)
      armed = false
    }
    if (smooth[i] < thresh * 0.55) armed = true
  }
  return onsets
}

/**
 * Snap evenly-split Whisper words onto energy onsets in the 16 kHz PCM.
 * Returns the original list when no usable onsets exist.
 */
export function snapWordsToOnsets(
  words: WordChunk[],
  audio: Float32Array,
  sampleRate: number,
): WordChunk[] {
  if (words.length === 0 || audio.length === 0) return words
  const onsets = detectOnsets(rmsFrames(audio, sampleRate))
  if (onsets.length === 0) return words // no speech energy to snap to

  const used = new Set<number>()
  const starts = words.map((w) => {
    let best = -1
    let bestCost = MAX_SNAP_SEC
    for (let oi = 0; oi < onsets.length; oi++) {
      if (used.has(oi)) continue
      const onset = onsets[oi]
      const late = onset > w.start
      const dist = Math.abs(onset - w.start)
      const cost = late ? dist * 1.15 : dist
      if (cost <= MAX_SNAP_SEC && cost < bestCost) {
        bestCost = cost
        best = oi
      }
    }
    if (best < 0) return w.start
    used.add(best)
    return onsets[best]
  })

  for (let i = 1; i < starts.length; i++) {
    if (starts[i] < starts[i - 1] + MIN_SPAN) starts[i] = starts[i - 1] + MIN_SPAN
  }

  return words.map((w, i) => {
    const start = Math.max(0, starts[i])
    const next = starts[i + 1]
    const end = next != null ? next : Math.max(start + MIN_SPAN, w.end)
    return { ...w, start, end: Math.max(start + MIN_SPAN, end) }
  })
}
