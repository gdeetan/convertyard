/**
 * mp3-to-mp4-mediabunny.ts
 *
 * Fast MP3→MP4 path. Decodes MP3 via WebCodecs (through Mediabunny's
 * AudioSampleSink), re-encodes to AAC via Mediabunny's AudioSampleSource,
 * and muxes with a static-color video track. Avoids ffmpeg.wasm entirely
 * on the simple case → seconds instead of minutes on long podcasts.
 *
 * Why AAC and not MP3 passthrough? MP3-in-MP4 is spec-legal but Safari and
 * QuickTime routinely drop the track → silent output. AAC is universally
 * supported.
 */
import type { WordChunk } from './caption-types'
import { classicCaptionCues } from './caption-ass-builder'
import {
  amplitudeBucketsFromPrefix,
  captionCueAtTime,
  computeAmplitudeBuckets,
  drawCaptionFrame,
  drawWaveformFrame,
  squarePrefix,
} from './mp3-to-mp4-overlay'

// Prefix is 8 bytes per sample. Past this, keep the raw PCM and scan each
// frame — the scan is cheap next to the encoder, and the prefix is not.
const WAVEFORM_PREFIX_MAX_SAMPLES = 24_000_000

export interface Mp3PassthroughOpts {
  w: number
  h: number
  bgColor: string
  trimStartSec: number
  trimEndSec: number
  waveform: 'none' | 'bar' | 'line'
  captions: boolean
  captionWords: WordChunk[] // empty when captions === false
}

export function isMp3PassthroughSupported(): boolean {
  if (typeof navigator === 'undefined') return false
  if (typeof VideoEncoder === 'undefined') return false
  if (typeof AudioEncoder === 'undefined') return false
  if (typeof AudioDecoder === 'undefined') return false
  if (typeof OffscreenCanvas === 'undefined') return false
  const ua = navigator.userAgent
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return false
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return false
  return true
}

export async function mp3ToMp4Passthrough(
  file: File,
  opts: Mp3PassthroughOpts,
  onProgress?: (pct: number) => void,
): Promise<File> {
  try {
    return await _mp3ToMp4Passthrough(file, opts, onProgress)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`mp3 passthrough failed: ${msg}`)
  }
}

async function _mp3ToMp4Passthrough(
  file: File,
  opts: Mp3PassthroughOpts,
  onProgress?: (pct: number) => void,
): Promise<File> {
  const report = (pct: number) => onProgress?.(Math.round(pct))
  report(0)

  const {
    Input,
    Output,
    BlobSource,
    BufferTarget,
    Mp4OutputFormat,
    ALL_FORMATS,
    AudioSampleSink,
    AudioSampleSource,
    CanvasSource,
    AudioSample,
    canEncodeAudio,
  } = await import('mediabunny')

  report(2)

  const AAC_BITRATE = 192_000
  if (!(await canEncodeAudio('aac', { bitrate: AAC_BITRATE }))) {
    throw new Error('Browser cannot encode AAC via WebCodecs')
  }

  // --- Probe input ----------------------------------------------------------
  const probeInput = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  let durationSec: number
  let sampleRate = 0
  let numberOfChannels = 0
  try {
    const audioTrack = await probeInput.getPrimaryAudioTrack()
    if (!audioTrack) throw new Error('No audio track found in file')
    durationSec = await probeInput.computeDuration()
    sampleRate = await audioTrack.getSampleRate()
    numberOfChannels = audioTrack.numberOfChannels
  } finally {
    probeInput.dispose()
  }
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new Error(`Invalid duration: ${durationSec}`)
  }
  if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new Error(`Invalid sample rate: ${sampleRate}`)
  }
  if (!Number.isInteger(numberOfChannels) || numberOfChannels <= 0) {
    throw new Error(`Invalid channel count: ${numberOfChannels}`)
  }

  const { trimStartSec, trimEndSec } = opts
  const effectiveEnd = trimEndSec > 0 ? Math.min(trimEndSec, durationSec) : durationSec
  const effectiveStart = trimStartSec > 0 ? Math.min(trimStartSec, effectiveEnd) : 0
  const effectiveDuration = Math.max(0, effectiveEnd - effectiveStart)
  if (effectiveDuration <= 0) throw new Error('Trim range produces an empty clip')

  report(5)

  // --- Build output ---------------------------------------------------------
  const { w, h, bgColor } = opts
  const bufTarget = new BufferTarget()
  const output = new Output({ format: new Mp4OutputFormat(), target: bufTarget })

  const audioSrc = new AudioSampleSource({
    codec: 'aac',
    bitrate: AAC_BITRATE,
  })
  output.addAudioTrack(audioSrc)
  void numberOfChannels; void sampleRate

  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('OffscreenCanvas 2d context unavailable')
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)

  const videoSrc = new CanvasSource(canvas, { codec: 'avc', bitrate: 100_000 })
  output.addVideoTrack(videoSrc)

  await output.start()
  report(8)

  // --- Feed audio (decode→AAC via WebCodecs, no ffmpeg) ---------------------
  const hasOverlay = opts.waveform !== 'none' || opts.captions
  let pcm: Float32Array | null = null
  let pcmSampleRate = 0
  let pcmLength = 0
  if (opts.waveform !== 'none') {
    const approx = Math.ceil(sampleRate * effectiveDuration) + sampleRate
    pcm = new Float32Array(approx)
    pcmSampleRate = sampleRate
  }

  const feedInput = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  try {
    const audioTrack = await feedInput.getPrimaryAudioTrack()
    if (!audioTrack) throw new Error('No audio track on second open')

    const sink = new AudioSampleSink(audioTrack)
    let lastReport = Date.now()
    let addedSeconds = 0

    for await (const sample of sink.samples(effectiveStart, effectiveEnd)) {
      // Shift timestamp so output starts at 0.
      const shiftedTs = sample.timestamp - effectiveStart
      let outSample: InstanceType<typeof AudioSample>
      if (shiftedTs === sample.timestamp) {
        outSample = sample
      } else {
        const bufSize = sample.allocationSize({ planeIndex: 0, format: sample.format })
        const data = new ArrayBuffer(bufSize)
        sample.copyTo(data, { planeIndex: 0, format: sample.format })
        outSample = new AudioSample({
          data,
          format: sample.format,
          numberOfChannels: sample.numberOfChannels,
          sampleRate: sample.sampleRate,
          timestamp: shiftedTs,
        })
        sample.close()
      }

      if (pcm) {
        try {
          const frames = outSample.numberOfFrames
          const need = pcmLength + frames
          if (need > pcm.length) {
            const grown = new Float32Array(need + sampleRate) // add 1s slack, linear
            grown.set(pcm)
            pcm = grown
          }
          const planeSize = outSample.allocationSize({ planeIndex: 0, format: 'f32-planar' })
          const planeBuf = new ArrayBuffer(planeSize)
          outSample.copyTo(planeBuf, { planeIndex: 0, format: 'f32-planar' })
          pcm.set(new Float32Array(planeBuf, 0, frames), pcmLength)
          pcmLength += frames
        } catch {
          pcm = null
        }
      }

      await audioSrc.add(outSample)
      addedSeconds = shiftedTs + outSample.duration

      const now = Date.now()
      if (now - lastReport >= 300) {
        const audioPct = Math.min(80, (addedSeconds / effectiveDuration) * 80)
        report(8 + audioPct)
        lastReport = now
      }
    }
  } finally {
    feedInput.dispose()
  }

  report(88)

  // --- Feed video ---------------------------------------------------------
  if (!hasOverlay) {
    const wholeSeconds = Math.max(1, Math.floor(effectiveDuration))
    for (let i = 0; i < wholeSeconds; i++) {
      await videoSrc.add(i, 1)
    }
    const remainder = effectiveDuration - wholeSeconds
    if (remainder > 0.01) {
      await videoSrc.add(wholeSeconds, remainder)
    }
  } else {
    const fps = 25
    const totalFrames = Math.max(1, Math.ceil(effectiveDuration * fps))
    const frameDur = 1 / fps
    const bucketCount = Math.max(32, Math.min(opts.w, 480))
    const captionsOn = opts.captions && opts.captionWords.length > 0
    const yCenterFrac = captionsOn ? 0.4 : 0.5
    const waveformColor = '#ffffff'
    let cueCursor = 0
    const captionCues = captionsOn ? classicCaptionCues(opts.captionWords) : []
    const waveformOn = opts.waveform !== 'none' && pcm != null && pcmLength > 0
    const waveformPrefix = waveformOn && pcmLength <= WAVEFORM_PREFIX_MAX_SAMPLES
      ? squarePrefix(pcm!, pcmLength)
      : null
    if (waveformPrefix) pcm = null
    const amps = new Float32Array(bucketCount)

    for (let f = 0; f < totalFrames; f++) {
      const t = f * frameDur
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, w, h)

      if (waveformOn) {
        const halfWin = 0.04
        const s = Math.max(0, t - halfWin)
        const e = Math.min(effectiveDuration, t + halfWin)
        if (waveformPrefix) {
          amplitudeBucketsFromPrefix(waveformPrefix, pcmSampleRate, s, e, bucketCount, amps)
        } else {
          const scanned = computeAmplitudeBuckets(
            pcm!.subarray(0, pcmLength),
            pcmSampleRate,
            s,
            e,
            bucketCount,
          )
          amps.set(scanned)
        }
        drawWaveformFrame(ctx, amps, w, h, {
          mode: opts.waveform,
          color: waveformColor,
          yCenterFrac,
          heightFrac: 0.35,
        })
      }

      if (captionsOn) {
        const lookup = captionCueAtTime(captionCues, t, cueCursor)
        cueCursor = lookup.index
        if (lookup.cue) {
          drawCaptionFrame(ctx, lookup.cue.lines.join('\n'), w, h, {
            fontFamily: 'system-ui, Roboto, Arial, sans-serif',
            fontSizePx: Math.round(h * 0.055),
            color: '#ffffff',
            outlineColor: '#000000',
            outlineWidth: Math.max(2, Math.round(h / 360)),
            yFrac: 0.88,
          })
        }
      }

      await videoSrc.add(t, frameDur)

      if ((f & 31) === 0) {
        const videoPct = 88 + Math.min(7, (f / totalFrames) * 7)
        report(videoPct)
      }
      if (f > 0 && f % 250 === 0) {
        await new Promise((r) => setTimeout(r, 0))
      }
    }
  }
  report(95)

  await output.finalize()
  const bytes = bufTarget.buffer
  if (!bytes) throw new Error('BufferTarget produced no data after finalize')

  report(100)
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([bytes], `${baseName}.mp4`, { type: 'video/mp4' })
}
