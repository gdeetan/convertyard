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

/**
 * Android Chrome file-picker videos (especially HEVC camera clips) often fail
 * decodeAudioData, and the failed decode still copies the whole file into RAM
 * before ffmpeg runs. Always take the ffmpeg path on Android.
 * Large iPhone camera files OOM if WebAudio copies the whole MOV into RAM.
 */
export function preferWebAudioExtract(profile: CaptionClientProfile, fileBytes: number): boolean {
  if (profile === 'android') return false
  if (profile === 'ios') return fileBytes < IOS_WEBAUDIO_MAX_BYTES
  return true
}

/** Android revokes gallery File handles. iOS does not — copying the MOV jetsams Safari. */
export function shouldMaterializePickerFile(profile: CaptionClientProfile): boolean {
  return profile === 'android'
}

/** One full-audio Whisper pass plus the model exceeds iPhone Safari’s tab budget. */
export function shouldSliceWhisperAudio(profile: CaptionClientProfile): boolean {
  return profile === 'ios'
}

export function shouldSnapWordOnsets(profile: CaptionClientProfile): boolean {
  return profile !== 'ios'
}

const IOS_FFMPEG_MAX_BYTES = 12 * 1024 * 1024

/** ffmpeg.wasm + a camera file is what reloads the iPhone tab. */
export function shouldUseFfmpegExtract(profile: CaptionClientProfile, fileBytes: number): boolean {
  if (profile === 'ios' && fileBytes > IOS_FFMPEG_MAX_BYTES) return false
  return true
}

const IOS_SLICE_SEC = 15
const IOS_SLICE_HOP_SEC = 12

export function whisperAudioWindows(
  sampleCount: number,
  sampleRate: number,
  profile: CaptionClientProfile,
): { start: number; end: number; offsetSec: number }[] {
  if (!shouldSliceWhisperAudio(profile) || sampleCount <= 0) {
    return [{ start: 0, end: sampleCount, offsetSec: 0 }]
  }
  const win = Math.round(IOS_SLICE_SEC * sampleRate)
  const hop = Math.round(IOS_SLICE_HOP_SEC * sampleRate)
  const out: { start: number; end: number; offsetSec: number }[] = []
  for (let start = 0; start < sampleCount; start += hop) {
    const end = Math.min(sampleCount, start + win)
    out.push({ start, end, offsetSec: start / sampleRate })
    if (end >= sampleCount) break
  }
  return out.length > 0 ? out : [{ start: 0, end: sampleCount, offsetSec: 0 }]
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
