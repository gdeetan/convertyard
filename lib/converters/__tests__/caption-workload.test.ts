import { describe, expect, it } from 'vitest'
import {
  captionJobSteps,
  captionWorkloadWarning,
  defaultCaptionQuality,
  detectCaptionClientProfile,
  preferWebAudioExtract,
  shouldPreloadCaptionFfmpeg,
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
})
