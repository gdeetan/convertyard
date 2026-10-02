import type { WordChunk } from './caption-types'

/**
 * Compute `bucketCount` RMS amplitudes (in [0,1]) across the PCM window
 * [startSec, endSec). Used by the per-frame waveform draw: one call per
 * video frame, each producing one row of bars/line heights.
 */
export function computeAmplitudeBuckets(
  pcm: Float32Array,
  sampleRate: number,
  startSec: number,
  endSec: number,
  bucketCount: number,
): Float32Array {
  const out = new Float32Array(bucketCount)
  if (bucketCount <= 0) return out
  const total = pcm.length
  if (total === 0) return out
  const startIdx = Math.max(0, Math.floor(startSec * sampleRate))
  const endIdx = Math.min(total, Math.ceil(endSec * sampleRate))
  const windowLen = Math.max(0, endIdx - startIdx)
  if (windowLen === 0) return out
  const step = windowLen / bucketCount
  for (let b = 0; b < bucketCount; b++) {
    const s = startIdx + Math.floor(b * step)
    const e = startIdx + Math.floor((b + 1) * step)
    const n = Math.max(1, e - s)
    let sumSq = 0
    for (let i = s; i < e; i++) {
      const v = pcm[i] || 0
      sumSq += v * v
    }
    const rms = Math.sqrt(sumSq / n)
    out[b] = rms > 1 ? 1 : rms
  }
  return out
}

/**
 * Running sum of squares, `prefix[i] = sum(pcm[0..i)^2)`.
 * One pass, then each frame's bars are a handful of subtractions instead of
 * another walk over the 80 ms window. Same bucket edges as
 * `computeAmplitudeBuckets`.
 */
export function squarePrefix(pcm: Float32Array, length = pcm.length): Float64Array {
  const n = Math.max(0, Math.min(length, pcm.length))
  const prefix = new Float64Array(n + 1)
  let acc = 0
  for (let i = 0; i < n; i++) {
    const v = pcm[i] || 0
    acc += v * v
    prefix[i + 1] = acc
  }
  return prefix
}

/** Fill `into` when it is the right length so the 25 fps loop can reuse one buffer. */
export function amplitudeBucketsFromPrefix(
  prefix: Float64Array,
  sampleRate: number,
  startSec: number,
  endSec: number,
  bucketCount: number,
  into?: Float32Array,
): Float32Array {
  const out = into && into.length === bucketCount ? into : new Float32Array(bucketCount)
  out.fill(0)
  if (bucketCount <= 0) return out
  const total = prefix.length - 1
  if (total <= 0) return out
  const startIdx = Math.max(0, Math.floor(startSec * sampleRate))
  const endIdx = Math.min(total, Math.ceil(endSec * sampleRate))
  const windowLen = Math.max(0, endIdx - startIdx)
  if (windowLen === 0) return out
  const step = windowLen / bucketCount
  for (let b = 0; b < bucketCount; b++) {
    const s = startIdx + Math.floor(b * step)
    const e = startIdx + Math.floor((b + 1) * step)
    const n = Math.max(1, e - s)
    const sumSq = prefix[e] - prefix[s]
    const rms = Math.sqrt(Math.max(0, sumSq) / n)
    out[b] = rms > 1 ? 1 : rms
  }
  return out
}

export interface WordLookup<T> {
  word: T | null
  index: number
}

export function captionCueAtTime<T extends { start: number; end: number }>(
  cues: T[],
  tSec: number,
  startIndex = 0,
): { cue: T | null; index: number } {
  const from = Math.max(0, Math.min(startIndex, cues.length))
  for (let i = from; i < cues.length; i++) {
    const cue = cues[i]
    if (tSec < cue.start) return { cue: null, index: i }
    if (tSec < cue.end) return { cue, index: i }
  }
  return { cue: null, index: cues.length }
}

export function wordAtTime<T extends Pick<WordChunk, 'start' | 'end'>>(
  words: T[],
  tSec: number,
  startIndex = 0,
): WordLookup<T> {
  // Monotonic scan: callers that advance tSec monotonically should pass
  // back the previous `index` to amortize the scan to O(1) per call.
  const from = Math.max(0, Math.min(startIndex, words.length))
  for (let i = from; i < words.length; i++) {
    const w = words[i]
    if (tSec < w.start) return { word: null, index: i }
    if (tSec < w.end) return { word: w, index: i }
  }
  return { word: null, index: words.length }
}

export interface WaveformDrawOpts {
  mode: 'bar' | 'line'
  color: string
  yCenterFrac: number
  heightFrac: number
}

export function drawWaveformFrame(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  amps: Float32Array,
  w: number,
  h: number,
  opts: WaveformDrawOpts,
): void {
  const yCenter = h * opts.yCenterFrac
  const maxHalf = (h * opts.heightFrac) / 2
  ctx.save()
  ctx.strokeStyle = opts.color
  ctx.fillStyle = opts.color
  if (opts.mode === 'bar') {
    const barW = Math.max(1, Math.floor(w / amps.length))
    for (let i = 0; i < amps.length; i++) {
      const half = amps[i] * maxHalf
      ctx.fillRect(i * barW, yCenter - half, Math.max(1, barW - 1), half * 2)
    }
  } else {
    ctx.lineWidth = Math.max(1, Math.round(h / 360))
    // Top envelope
    ctx.beginPath()
    for (let i = 0; i < amps.length; i++) {
      const x = (i / Math.max(1, amps.length - 1)) * w
      const y = yCenter - amps[i] * maxHalf
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    // Bottom envelope (mirror)
    ctx.beginPath()
    for (let i = 0; i < amps.length; i++) {
      const x = (i / Math.max(1, amps.length - 1)) * w
      const y = yCenter + amps[i] * maxHalf
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.restore()
}

export interface CaptionDrawOpts {
  fontFamily: string
  fontSizePx: number
  color: string
  outlineColor: string
  outlineWidth: number
  yFrac: number
}

export function drawCaptionFrame(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  opts: CaptionDrawOpts,
): void {
  if (!text) return
  ctx.save()
  ctx.font = `bold ${opts.fontSizePx}px ${opts.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const x = w / 2
  const lines = text.split('\n')
  const lineGap = Math.round(opts.fontSizePx * 1.2)
  // Last line sits on yFrac. Extra wrap lines stack upward.
  const y0 = h * opts.yFrac - (lines.length - 1) * lineGap
  ctx.shadowColor = 'rgba(0,0,0,0.75)'
  ctx.shadowBlur = Math.max(2, Math.round(opts.fontSizePx / 20))
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = Math.max(1, Math.round(opts.fontSizePx / 24))
  ctx.fillStyle = opts.color
  if (opts.outlineWidth > 0) {
    ctx.lineWidth = opts.outlineWidth
    ctx.strokeStyle = opts.outlineColor
    ctx.lineJoin = 'round'
  }
  for (let i = 0; i < lines.length; i++) {
    const y = y0 + i * lineGap
    if (opts.outlineWidth > 0) ctx.strokeText(lines[i], x, y)
    ctx.shadowColor = 'transparent'
    ctx.fillText(lines[i], x, y)
    ctx.shadowColor = 'rgba(0,0,0,0.75)'
  }
  ctx.restore()
}
