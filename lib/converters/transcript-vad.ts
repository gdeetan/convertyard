export interface SpeechInterval {
  start: number
  end: number
}

const FRAME_SEC = 0.03
const HOP_SEC = 0.01
const QUIET_ABS_RMS = 0.006
const SKIP_SILENCE_SEC = 2
const PAD_SEC = 0.5

function frameRms(pcm: Float32Array, start: number, frameSamples: number): number {
  const end = Math.min(pcm.length, start + frameSamples)
  if (end <= start) return 0
  let sum = 0
  for (let i = start; i < end; i++) sum += pcm[i] * pcm[i]
  return Math.sqrt(sum / (end - start))
}

function invertGaps(gaps: SpeechInterval[], total: number): SpeechInterval[] {
  const out: SpeechInterval[] = []
  let cursor = 0
  for (const gap of gaps) {
    if (gap.start > cursor) out.push({ start: cursor, end: gap.start })
    cursor = Math.max(cursor, gap.end)
  }
  if (cursor < total) out.push({ start: cursor, end: total })
  return out
}

/**
 * Keep speech including quiet talk and short pauses.
 * Only drop dead air that lasts SKIP_SILENCE_SEC or longer.
 */
export function detectSpeechIntervals(pcm: Float32Array, sampleRate: number): SpeechInterval[] {
  if (!pcm.length || sampleRate <= 0) return []

  const frameSamples = Math.max(1, Math.round(FRAME_SEC * sampleRate))
  const hopSamples = Math.max(1, Math.round(HOP_SEC * sampleRate))
  const rms: number[] = []
  for (let start = 0; start < pcm.length; start += hopSamples) {
    rms.push(frameRms(pcm, start, frameSamples))
  }
  if (rms.length === 0) return []

  let maxRms = 0
  for (const v of rms) if (v > maxRms) maxRms = v
  if (maxRms < QUIET_ABS_RMS) return []

  const skipFrames = Math.max(1, Math.round(SKIP_SILENCE_SEC / HOP_SEC))

  const skippable: SpeechInterval[] = []
  let i = 0
  while (i < rms.length) {
    if (rms[i] >= QUIET_ABS_RMS) {
      i += 1
      continue
    }
    const start = i
    while (i < rms.length && rms[i] < QUIET_ABS_RMS) i += 1
    if (i - start < skipFrames) continue
    skippable.push({
      start: start * hopSamples,
      end: Math.min(pcm.length, i * hopSamples),
    })
  }

  const speech = invertGaps(skippable, pcm.length)
  if (speech.length === 0) return [{ start: 0, end: pcm.length }]

  const pad = Math.round(PAD_SEC * sampleRate)
  const padded: SpeechInterval[] = []
  for (const iv of speech) {
    const start = Math.max(0, iv.start - pad)
    const end = Math.min(pcm.length, iv.end + pad)
    const last = padded[padded.length - 1]
    if (last && start <= last.end) {
      last.end = end
    } else {
      padded.push({ start, end })
    }
  }
  return padded
}
