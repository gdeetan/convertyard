import { describe, expect, it } from 'vitest'
import {
  captionJobSteps,
  captionWorkloadWarning,
  defaultCaptionQuality,
  detectCaptionClientProfile,
  needsSafariOnnxWasm,
  preferWebAudioExtract,
  shouldMaterializePickerFile,
  shouldPreloadCaptionFfmpeg,
  shouldSliceWhisperAudio,
  shouldSnapWordOnsets,
  shouldUseFfmpegExtract,
  whisperAudioWindows,
} from '../caption-workload'

describe('captionWorkloadWarning', () => {
  it('is silent for a short 1080p clip', () => {
    expect(captionWorkloadWarning({
      durationSec: 45,
      width: 1920,
      height: 1080,
      bytes: 12 * 1024 * 1024,
    })).toBeNull()
  })

  it('warns on long duration, 4K, or large files', () => {
    expect(captionWorkloadWarning({
      durationSec: 240,
      width: 1280,
      height: 720,
      bytes: 10 * 1024 * 1024,
    })).toMatch(/4 minutes/)

    expect(captionWorkloadWarning({
      durationSec: 30,
      width: 3840,
      height: 2160,
      bytes: 10 * 1024 * 1024,
    })).toMatch(/3840×2160/)

    expect(captionWorkloadWarning({
      durationSec: 30,
      width: 1280,
      height: 720,
      bytes: 120 * 1024 * 1024,
    })).toMatch(/120 MB/)
  })
})

describe('caption iOS memory policy', () => {
  it('detects iPhone, iPad-as-Mac, Android, and desktop', () => {
    expect(detectCaptionClientProfile('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5)).toBe('ios')
    expect(detectCaptionClientProfile('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5, 'MacIntel')).toBe('ios')
    expect(detectCaptionClientProfile('Mozilla/5.0 (Linux; Android 14) Chrome/120', 5)).toBe('android')
    expect(detectCaptionClientProfile('Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120', 0, 'MacIntel')).toBe('desktop')
  })

  it('defaults phones to Fast and does not preload ffmpeg next to Whisper', () => {
    expect(defaultCaptionQuality('ios')).toBe('fast')
    expect(defaultCaptionQuality('android')).toBe('fast')
    expect(defaultCaptionQuality('desktop')).toBe('balanced')
    expect(shouldPreloadCaptionFfmpeg('ios')).toBe(false)
    expect(shouldPreloadCaptionFfmpeg('android')).toBe(false)
    expect(shouldPreloadCaptionFfmpeg('desktop')).toBe(true)
  })

  it('extracts audio and frees ffmpeg before loading Whisper on phones', () => {
    expect(captionJobSteps('ios')).toEqual(['extract', 'release-ffmpeg', 'load-model', 'transcribe'])
    expect(captionJobSteps('android')).toEqual(['extract', 'release-ffmpeg', 'load-model', 'transcribe'])
    expect(captionJobSteps('desktop')).toEqual(['extract', 'release-ffmpeg', 'load-model', 'transcribe'])
  })

  it('avoids WebAudio decode of large iPhone camera files', () => {
    expect(preferWebAudioExtract('ios', 20 * 1024 * 1024)).toBe(false)
    expect(preferWebAudioExtract('ios', 4 * 1024 * 1024)).toBe(true)
    expect(preferWebAudioExtract('desktop', 80 * 1024 * 1024)).toBe(true)
  })

  it('skips WebAudio extract on Android so camera videos are not copied twice before ffmpeg', () => {
    expect(preferWebAudioExtract('android', 2 * 1024 * 1024)).toBe(false)
    expect(preferWebAudioExtract('android', 40 * 1024 * 1024)).toBe(false)
  })

  it('copies picker files only on Android — iOS keeps the original handle', () => {
    expect(shouldMaterializePickerFile('android')).toBe(true)
    expect(shouldMaterializePickerFile('ios')).toBe(false)
    expect(shouldMaterializePickerFile('desktop')).toBe(false)
  })

  it('slices Whisper audio on iPhone but still snaps to speech onsets so captions stay in sync', () => {
    expect(shouldSliceWhisperAudio('ios')).toBe(true)
    expect(shouldSliceWhisperAudio('desktop')).toBe(false)
    expect(shouldSnapWordOnsets('ios')).toBe(true)
    expect(shouldSnapWordOnsets('desktop')).toBe(true)
    expect(shouldUseFfmpegExtract('ios', 20 * 1024 * 1024)).toBe(false)
    expect(shouldUseFfmpegExtract('ios', 4 * 1024 * 1024)).toBe(true)
    expect(shouldUseFfmpegExtract('desktop', 80 * 1024 * 1024)).toBe(true)
  })

  it('windows iPhone audio into overlapping 15s slices', () => {
    const windows = whisperAudioWindows(16000 * 45, 16000, 'ios')
    expect(windows.length).toBeGreaterThan(1)
    expect(windows[0]).toEqual({ start: 0, end: 16000 * 15, offsetSec: 0 })
    expect(windows[1].offsetSec).toBe(12)
    expect(whisperAudioWindows(16000 * 45, 16000, 'desktop')).toEqual([
      { start: 0, end: 16000 * 45, offsetSec: 0 },
    ])
  })

  it('uses Safari-safe ONNX WASM on every iOS browser, including Chrome', () => {
    expect(needsSafariOnnxWasm(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    )).toBe(true)
    expect(needsSafariOnnxWasm(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
    )).toBe(true)
    expect(needsSafariOnnxWasm(
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    )).toBe(false)
    expect(needsSafariOnnxWasm(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    )).toBe(false)
  })
})
