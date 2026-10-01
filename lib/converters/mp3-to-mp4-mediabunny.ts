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
  opts: {
    w: number
    h: number
    bgColor: string
    trimStartSec: number
    trimEndSec: number
  },
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
  opts: { w: number; h: number; bgColor: string; trimStartSec: number; trimEndSec: number },
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

  // --- Feed video: 1-fps black frames spanning the duration -----------------
  const wholeSeconds = Math.max(1, Math.floor(effectiveDuration))
  for (let i = 0; i < wholeSeconds; i++) {
    await videoSrc.add(i, 1)
  }
  const remainder = effectiveDuration - wholeSeconds
  if (remainder > 0.01) {
    await videoSrc.add(wholeSeconds, remainder)
  }
  report(95)

  await output.finalize()
  const bytes = bufTarget.buffer
  if (!bytes) throw new Error('BufferTarget produced no data after finalize')

  report(100)
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([bytes], `${baseName}.mp4`, { type: 'video/mp4' })
}
