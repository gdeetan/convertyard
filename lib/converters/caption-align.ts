import type { WordChunk } from './caption-types'

const FRAME_SEC = 0.01
const MAX_SNAP_SEC = 0.75
const MIN_SPAN = 0.05
const ANCHOR_SLACK_SEC = 0.15

// Micro-snap tuning for real DTW word timings.
const MICRO_SNAP_WINDOW_SEC = 0.18
const MICRO_ATTACK_FRAMES = 3     // 30 ms attack window
const MICRO_MIN_PROMINENCE = 1.8  // peak must exceed 1.8× local mean flux
const MICRO_PREEMPH = 0.97        // pre-emphasis coefficient boosts consonant attack energy
const MICRO_SILENCE_QUANTILE = 0.15  // ignore frames below the 15th-percentile RMS (silence)

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

interface Segment {
  from: number      // inclusive index into words
  to: number        // exclusive
  anchorStart: number
  anchorEnd: number
}

function groupSegments(words: WordChunk[]): Segment[] {
  const groups: Segment[] = []
  let i = 0
  while (i < words.length) {
    const w = words[i]
    if (w.anchorStart == null || w.anchorEnd == null) {
      groups.push({ from: i, to: i + 1, anchorStart: w.start, anchorEnd: w.end })
      i++
      continue
    }
    const aStart = w.anchorStart
    const aEnd = w.anchorEnd
    let j = i + 1
    while (
      j < words.length &&
      words[j].anchorStart === aStart &&
      words[j].anchorEnd === aEnd
    ) j++
    groups.push({ from: i, to: j, anchorStart: aStart, anchorEnd: aEnd })
    i = j
  }
  return groups
}

/**
 * Pick W onsets (in order) whose positions best match interpolated word starts.
 * Used when a segment has more onsets than words — avoids bunching on the first.
 */
function pickBestOnsets(onsets: number[], targets: number[]): number[] {
  const W = targets.length
  const K = onsets.length
  if (K <= W) return onsets
  const picked: number[] = []
  let idx = 0
  for (let w = 0; w < W; w++) {
    const target = targets[w]
    // Leave enough onsets for remaining words.
    const upper = K - (W - w - 1)
    let best = idx
    let bestDist = Math.abs(onsets[idx] - target)
    for (let o = idx + 1; o < upper; o++) {
      const d = Math.abs(onsets[o] - target)
      if (d < bestDist) { bestDist = d; best = o }
    }
    picked.push(onsets[best])
    idx = best + 1
  }
  return picked
}

/** Place W words across effectiveK onset waypoints, distributing evenly between. */
function distributeAcrossOnsets(
  count: number,
  waypoints: number[],
  segEnd: number,
): number[] {
  const K = waypoints.length
  const starts = new Array<number>(count)
  for (let g = 0; g < K; g++) {
    const gStart = Math.floor((g * count) / K)
    const gEnd = Math.floor(((g + 1) * count) / K) // exclusive
    const anchor = waypoints[g]
    const nextAnchor = g + 1 < K ? waypoints[g + 1] : segEnd
    const groupCount = Math.max(1, gEnd - gStart)
    const span = Math.max(MIN_SPAN, nextAnchor - anchor)
    for (let j = 0; j < gEnd - gStart; j++) {
      starts[gStart + j] = anchor + (span * j) / groupCount
    }
  }
  return starts
}

function snapSegment(
  words: WordChunk[],
  seg: Segment,
  allOnsets: number[],
): number[] {
  const W = seg.to - seg.from
  const interpStarts: number[] = []
  for (let i = seg.from; i < seg.to; i++) interpStarts.push(words[i].start)

  const lo = seg.anchorStart - ANCHOR_SLACK_SEC
  const hi = seg.anchorEnd + ANCHOR_SLACK_SEC
  const inSeg: number[] = []
  for (const o of allOnsets) {
    if (o < lo) continue
    if (o > hi) break
    inSeg.push(o)
  }

  if (inSeg.length === 0) return interpStarts

  // Real-timestamp words (no anchors) — keep the older ±0.75s greedy behavior
  // by returning interpolated positions; caller enforces monotonic ordering.
  const hasAnchor = words[seg.from].anchorStart != null

  if (!hasAnchor) {
    // Single-word "real" segment: snap to nearest onset within MAX_SNAP_SEC.
    const target = interpStarts[0]
    let best = -1
    let bestDist = MAX_SNAP_SEC
    for (const o of inSeg) {
      const d = Math.abs(o - target)
      if (d < bestDist) { bestDist = d; best = o }
    }
    return [best >= 0 ? best : target]
  }

  const chosen = pickBestOnsets(inSeg, interpStarts)
  const effectiveK = Math.min(chosen.length, W)
  if (effectiveK === 0) return interpStarts
  return distributeAcrossOnsets(W, chosen.slice(0, effectiveK), seg.anchorEnd)
}

/**
 * Snap interpolated Whisper words onto energy onsets in the 16 kHz PCM.
 * Words carrying anchor bounds are grouped by segment and mapped to onsets
 * that fall within that segment, then interpolated between waypoints. Words
 * without anchors keep the older single-word snap.
 */
export function snapWordsToOnsets(
  words: WordChunk[],
  audio: Float32Array,
  sampleRate: number,
): WordChunk[] {
  if (words.length === 0 || audio.length === 0) return words
  const onsets = detectOnsets(rmsFrames(audio, sampleRate))
  if (onsets.length === 0) return words

  const segments = groupSegments(words)
  const starts = new Array<number>(words.length)
  for (const seg of segments) {
    const segStarts = snapSegment(words, seg, onsets)
    for (let i = 0; i < segStarts.length; i++) {
      starts[seg.from + i] = segStarts[i]
    }
  }

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

/**
 * Half-wave-rectified RMS difference over a 30 ms attack window, computed on
 * pre-emphasized audio (y[n] = x[n] − 0.97·x[n−1]). Pre-emphasis is what
 * MFCC pipelines use to flatten the ~-6 dB/oct speech spectrum — it boosts
 * consonant transients and vowel-onset formants so their attacks stand out.
 * No FFT; still cheap at 16 kHz mono.
 */
function attackFlux(audio: Float32Array, sampleRate: number): Float32Array {
  const emphasized = new Float32Array(audio.length)
  emphasized[0] = audio[0]
  for (let i = 1; i < audio.length; i++) {
    emphasized[i] = audio[i] - MICRO_PREEMPH * audio[i - 1]
  }
  const rms = rmsFrames(emphasized, sampleRate)
  const flux = new Float32Array(rms.length)
  for (let i = MICRO_ATTACK_FRAMES; i < rms.length; i++) {
    flux[i] = Math.max(0, rms[i] - rms[i - MICRO_ATTACK_FRAMES])
  }
  return flux
}

/** RMS floor at the given percentile — treats anything quieter as silence. */
function silenceThreshold(rms: Float32Array): number {
  if (rms.length === 0) return 0
  const sorted = Array.from(rms).sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length * MICRO_SILENCE_QUANTILE)] ?? 0
}

function localMean(flux: Float32Array, center: number, radius: number): number {
  let sum = 0
  let count = 0
  const lo = Math.max(0, center - radius)
  const hi = Math.min(flux.length, center + radius + 1)
  for (let i = lo; i < hi; i++) { sum += flux[i]; count++ }
  return count > 0 ? sum / count : 0
}

function findAttackPeakNear(
  flux: Float32Array,
  centerFrame: number,
  windowFrames: number,
): number {
  const lo = Math.max(1, centerFrame - windowFrames)
  const hi = Math.min(flux.length - 2, centerFrame + windowFrames)
  let bestFrame = -1
  let bestValue = 0
  for (let i = lo; i <= hi; i++) {
    if (flux[i] > flux[i - 1] && flux[i] >= flux[i + 1] && flux[i] > bestValue) {
      bestValue = flux[i]
      bestFrame = i
    }
  }
  if (bestFrame < 0) return -1
  const mean = localMean(flux, bestFrame, windowFrames * 2)
  if (mean > 0 && bestValue < mean * MICRO_MIN_PROMINENCE) return -1
  return bestFrame
}

/**
 * Fine-tune real DTW word timings to the nearest phoneme attack. Whisper's
 * cross-attention word stamps land ~50–150 ms before speech onset; browser
 * video decode + canvas repaint add ~100 ms more. Snapping each word to a
 * prominent attack peak within ±180 ms erases both biases per-word, without
 * dragging words to noise the way a wide RMS-onset search would.
 *
 * Words with no clear attack peak in range are left at their DTW estimate.
 * Monotonic order is preserved.
 */
export function microSnapToAttacks(
  words: WordChunk[],
  audio: Float32Array,
  sampleRate: number,
): WordChunk[] {
  if (words.length === 0 || audio.length === 0) return words
  const flux = attackFlux(audio, sampleRate)
  if (flux.length === 0) return words
  // Reference RMS on the raw signal — the pre-emphasized version's noise floor
  // is skewed by transient boosting, so we gate against untreated audio.
  const rmsRef = rmsFrames(audio, sampleRate)
  const silenceCap = silenceThreshold(rmsRef)
  const windowFrames = Math.max(1, Math.round(MICRO_SNAP_WINDOW_SEC / FRAME_SEC))
  const out: WordChunk[] = []
  let prevStart = -Infinity
  for (const w of words) {
    const targetFrame = Math.round(w.start / FRAME_SEC)
    const peakFrame = findAttackPeakNear(flux, targetFrame, windowFrames)
    let newStart = w.start
    if (peakFrame >= 0) {
      const candidate = peakFrame * FRAME_SEC
      // Reject candidates that land in a silent frame — the peak was noise or
      // a fricative tail, not a speech onset.
      const inSpeech = (rmsRef[peakFrame] ?? 0) > silenceCap
      if (inSpeech && candidate > prevStart + MIN_SPAN) newStart = candidate
    }
    prevStart = newStart
    const delta = newStart - w.start
    out.push({
      ...w,
      start: newStart,
      end: Math.max(newStart + MIN_SPAN, w.end + delta),
    })
  }
  return out
}
