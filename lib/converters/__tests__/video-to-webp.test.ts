import { beforeEach, describe, expect, it, vi } from 'vitest'

const execCalls: string[][] = []
const writeFileCalls: string[] = []
const deletedFiles: string[] = []
const listeners = new Map<string, Set<(payload: any) => void>>()

const ffmpegMock = {
  writeFile: vi.fn(async (name: string) => {
    writeFileCalls.push(name)
  }),
  readFile: vi.fn(async () => new Uint8Array([82, 73, 70, 70])),
  deleteFile: vi.fn(async (name: string) => {
    deletedFiles.push(name)
  }),
  exec: vi.fn(async (args: string[]) => {
    execCalls.push(args)
  }),
  on: vi.fn((event: string, handler: (payload: any) => void) => {
    const set = listeners.get(event) ?? new Set()
    set.add(handler)
    listeners.set(event, set)
  }),
  off: vi.fn((event: string, handler: (payload: any) => void) => {
    listeners.get(event)?.delete(handler)
  }),
}

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn(async () => new Uint8Array([1, 2, 3])),
}))

vi.mock('@/lib/converters/ffmpeg-client', () => ({
  getFFmpeg: vi.fn(async () => ffmpegMock),
}))

vi.mock('@/lib/converters/media-probe', () => ({
  probeVideoTrack: vi.fn(async () => true),
}))

describe('video-to-webp (mp4ToWebp with broader format support)', () => {
  beforeEach(() => {
    execCalls.length = 0
    writeFileCalls.length = 0
    deletedFiles.length = 0
    listeners.clear()
    vi.clearAllMocks()
    ffmpegMock.readFile.mockImplementation(async () => new Uint8Array([82, 73, 70, 70]))
    ffmpegMock.exec.mockImplementation(async (args: string[]) => {
      execCalls.push(args)
    })
  })

  it('uses the correct extension for an AVI input file', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.avi', { type: 'video/x-msvideo' })

    const results = await mp4ToWebp([input], { fps: 12, quality: 80 })

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('clip.webp')
    expect(writeFileCalls).toEqual(['video_in_0.avi'])
  })

  it('uses the correct extension for an MKV input file', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.mkv', { type: 'video/x-matroska' })

    const results = await mp4ToWebp([input], { fps: 10, quality: 75 })

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('clip.webp')
    expect(writeFileCalls).toEqual(['video_in_0.mkv'])
  })

  it('uses the correct extension for an FLV input file', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.flv', { type: 'video/x-flv' })

    const results = await mp4ToWebp([input], { fps: 10 })

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('clip.webp')
    expect(writeFileCalls).toEqual(['video_in_0.flv'])
  })

  it('uses the correct extension for a MOV input file', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.mov', { type: 'video/quicktime' })

    const results = await mp4ToWebp([input], {})

    expect(results).toHaveLength(1)
    expect((results[0] as File).name).toBe('clip.webp')
    expect(writeFileCalls).toEqual(['video_in_0.mov'])
  })

  it('rejects audio-only files before ffmpeg work starts', async () => {
    const probeModule = await import('@/lib/converters/media-probe')
    vi.mocked(probeModule.probeVideoTrack).mockResolvedValueOnce(false)

    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'audio.avi', { type: 'video/x-msvideo' })

    const results = await mp4ToWebp([input], {})

    expect(results[0]).toBeInstanceOf(Error)
    expect(writeFileCalls).toHaveLength(0)
    expect(execCalls).toHaveLength(0)
  })

  it('surfaces non-Error ffmpeg failures instead of collapsing them to a generic message', async () => {
    ffmpegMock.exec.mockImplementationOnce(async () => {
      throw 'Unknown encoder libwebp'
    })

    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'broken.avi', { type: 'video/x-msvideo' })

    const results = await mp4ToWebp([input], {})

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(Error)
    expect((results[0] as Error).message).toContain('Unknown encoder libwebp')
  })

  it('turns audio-only file failures into a clear user-facing message', async () => {
    ffmpegMock.exec.mockImplementationOnce(async (args: string[]) => {
      execCalls.push(args)
      for (const handler of listeners.get('log') ?? []) {
        handler({ message: 'Output file #0 does not contain any stream' })
      }
    })
    ffmpegMock.readFile.mockImplementationOnce(async () => {
      throw new Error('ErrnoError: FS error')
    })

    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'audio-only.avi', { type: 'video/x-msvideo' })

    const results = await mp4ToWebp([input], {})

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(Error)
    expect((results[0] as Error).message).toContain('no video track')
  })
})
