// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { probeVideoDimensions } from '../media-probe'

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
