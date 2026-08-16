// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { probeVideoDimensions, probeAudioInfo } from '../media-probe'

describe('probeVideoDimensions', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns width and height when metadata loads', async () => {
    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      preload: '' as string,
      muted: false,
      playsInline: false,
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set src(_: string) { Promise.resolve().then(() => this.onloadedmetadata?.()) },
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockVideo as unknown as HTMLVideoElement)
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementationOnce(() => {})
    const file = new File([new Uint8Array(10)], 'v.mp4', { type: 'video/mp4' })
    expect(await probeVideoDimensions(file)).toEqual({ width: 1920, height: 1080 })
  })

  it('returns null when video has no dimensions', async () => {
    const mockVideo = {
      videoWidth: 0,
      videoHeight: 0,
      preload: '' as string,
      muted: false,
      playsInline: false,
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set src(_: string) { Promise.resolve().then(() => this.onloadedmetadata?.()) },
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockVideo as unknown as HTMLVideoElement)
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementationOnce(() => {})
    const file = new File([new Uint8Array(10)], 'v.mp4', { type: 'video/mp4' })
    expect(await probeVideoDimensions(file)).toBeNull()
  })

  it('returns null on error', async () => {
    const mockVideo = {
      videoWidth: 0,
      videoHeight: 0,
      preload: '' as string,
      muted: false,
      playsInline: false,
      onloadedmetadata: null as (() => void) | null,
      onerror: null as (() => void) | null,
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set src(_: string) { Promise.resolve().then(() => this.onerror?.()) },
    }
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockVideo as unknown as HTMLVideoElement)
    vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementationOnce(() => {})
    const file = new File([new Uint8Array(10)], 'v.mp4', { type: 'video/mp4' })
    expect(await probeVideoDimensions(file)).toBeNull()
  })
})

describe('probeAudioInfo', () => {
  it('returns codec and bitrate when ffmpeg log contains audio stream info', async () => {
    const mockFfmpeg = {
      on: vi.fn((event: string, handler: (data: { message: string }) => void) => {
        if (event === 'log') {
          Promise.resolve().then(() =>
            handler({ message: 'Stream #0:1: Audio: aac (LC), 44100 Hz, stereo, fltp, 128 kb/s' })
          )
        }
      }),
      off: vi.fn(),
      exec: vi.fn(async () => {}),
    }
    const result = await probeAudioInfo(mockFfmpeg as any, 'input.mp4')
    expect(result).toEqual({ codec: 'aac', bitrateKbps: 128 })
  })

  it('returns null when log contains no audio stream info', async () => {
    const mockFfmpeg = {
      on: vi.fn(),
      off: vi.fn(),
      exec: vi.fn(async () => {}),
    }
    const result = await probeAudioInfo(mockFfmpeg as any, 'input.mp4')
    expect(result).toBeNull()
  })

  it('probes headers only — does not decode the file', async () => {
    const mockFfmpeg = {
      on: vi.fn(),
      off: vi.fn(),
      exec: vi.fn(async () => {}),
    }
    await probeAudioInfo(mockFfmpeg as any, 'cv_in_0.mp4')
    expect(mockFfmpeg.exec).toHaveBeenCalledOnce()
    const args = mockFfmpeg.exec.mock.calls[0][0] as string[]
    expect(args).toContain('-i')
    expect(args).toContain('cv_in_0.mp4')
    expect(args).not.toContain('-f')
    expect(args).not.toContain('/dev/null')
  })
})
