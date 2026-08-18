export type CaptionClientProfile = 'desktop' | 'android' | 'ios'
export type CaptionJobStep = 'extract' | 'release-ffmpeg' | 'load-model' | 'transcribe'

export interface CaptionWorkload {
  durationSec: number
  width: number
  height: number
  bytes: number
}

const IOS_WEBAUDIO_MAX_BYTES = 8 * 1024 * 1024

/** Same iPhone / iPad-as-Mac detection as the upscaler. */
export function detectCaptionClientProfile(
  ua: string,
  maxTouchPoints = 0,
  platform = '',
): CaptionClientProfile {
  if (/iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
    return 'ios'
  }
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

/**
 * iOS Chrome/Firefox are WebKit but transformers.js only picks the Safari-safe
 * (non-asyncify) ORT WASM build when the UA looks like Safari. Asyncify WASM
 * fails session create on WebKit.
 */
export function needsSafariOnnxWasm(
  ua: string,
  maxTouchPoints = 0,
  platform = '',
): boolean {
  return detectCaptionClientProfile(ua, maxTouchPoints, platform) === 'ios'
}

export function defaultCaptionQuality(profile: CaptionClientProfile): 'fast' | 'balanced' | 'accurate' {
  return profile === 'desktop' ? 'balanced' : 'fast'
}

/** Preloading ffmpeg next to Whisper is what jetsams Safari mid-transcribe. */
export function shouldPreloadCaptionFfmpeg(profile: CaptionClientProfile): boolean {
  return profile === 'desktop'
}

/**
 * Never keep ffmpeg.wasm and Whisper resident together.
 * Extract PCM, terminate ffmpeg, then load the model.
 */
export function captionJobSteps(_profile: CaptionClientProfile): CaptionJobStep[] {
  return ['extract', 'release-ffmpeg', 'load-model', 'transcribe']
}

/** Large iPhone camera files OOM if WebAudio copies the whole MOV into RAM. */
export function preferWebAudioExtract(profile: CaptionClientProfile, fileBytes: number): boolean {
  if (profile === 'ios') return fileBytes < IOS_WEBAUDIO_MAX_BYTES
  return true
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
