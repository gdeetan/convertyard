import { describe, it, expect, vi, afterEach } from 'vitest'
import { pickHevcEncoderConfig, canAttemptHevcWebCodecs, hevcBitrateForLevel, pickAvcEncoderConfig } from '../compress-video-webcodecs'
import { demuxMp4File } from '../mp4-demux'

describe('canAttemptHevcWebCodecs', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns false when VideoEncoder is missing', () => {
    vi.stubGlobal('VideoEncoder', undefined)
    expect(canAttemptHevcWebCodecs()).toBe(false)
  })

  it('returns true when VideoEncoder and VideoDecoder exist even without rVFC', () => {
    vi.stubGlobal('VideoEncoder', function VideoEncoder() {})
    vi.stubGlobal('VideoDecoder', function VideoDecoder() {})
    vi.stubGlobal('VideoFrame', function VideoFrame() {})
    vi.stubGlobal('HTMLVideoElement', function HTMLVideoElement() {})
    expect(canAttemptHevcWebCodecs()).toBe(true)
  })
})

describe('hevcBitrateForLevel', () => {
  it('caps quality-mode bitrate at 60% of the source bitrate', () => {
    const uncapped = hevcBitrateForLevel(1920, 1080, 30, 'medium')
    const sourceBytes = 4.5 * 1024 * 1024
    const duration = 60
    const capped = hevcBitrateForLevel(1920, 1080, 30, 'medium', { sourceBytes, durationSeconds: duration })
    expect(capped).toBeLessThan(uncapped)
    expect(capped).toBe(Math.max(100_000, Math.floor((sourceBytes * 8 / duration) * 0.6)))
  })
})

describe('pickHevcEncoderConfig', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns null when VideoEncoder is missing', async () => {
    vi.stubGlobal('VideoEncoder', undefined)
    expect(await pickHevcEncoderConfig(1280, 720, 30, 1_000_000)).toBeNull()
  })

  it('returns the first supported annexb HEVC config', async () => {
    const isConfigSupported = vi.fn(async (cfg: VideoEncoderConfig) => ({
      supported: cfg.codec.startsWith('hev1') && (cfg as { hevc?: { format?: string } }).hevc?.format === 'annexb',
      config: cfg,
    }))
    vi.stubGlobal('VideoEncoder', { isConfigSupported })
    const cfg = await pickHevcEncoderConfig(1280, 720, 30, 1_000_000)
    expect(cfg).not.toBeNull()
    expect(cfg?.codec.startsWith('hev1') || cfg?.codec.startsWith('hvc1')).toBe(true)
    expect((cfg as { hevc?: { format?: string } } | null)?.hevc?.format).toBe('annexb')
    expect(cfg?.latencyMode).toBe('realtime')
  })

  it('returns null when no HEVC config is supported', async () => {
    vi.stubGlobal('VideoEncoder', {
      isConfigSupported: vi.fn(async () => ({ supported: false })),
    })
    expect(await pickHevcEncoderConfig(1920, 1080, 30, 2_000_000)).toBeNull()
  })
})

describe('pickAvcEncoderConfig format', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('passes format=avc through to isConfigSupported', async () => {
    const isConfigSupported = vi.fn(async (cfg: VideoEncoderConfig) => ({ supported: true, config: cfg }))
    vi.stubGlobal('VideoEncoder', { isConfigSupported })
    const cfg = await pickAvcEncoderConfig(320, 240, 30, 500_000, 'avc')
    expect((cfg as { avc?: { format?: string } } | null)?.avc?.format).toBe('avc')
  })
})

describe('demuxMp4File', () => {
  it('reads the file once when both video and audio are requested', async () => {
    const arrayBuffer = vi.fn(async () => new ArrayBuffer(16))
    const file = { size: 16, arrayBuffer } as unknown as File

    const result = await demuxMp4File(file, { includeAudio: true })

    expect(arrayBuffer).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ video: null, audio: null })
  })
})
