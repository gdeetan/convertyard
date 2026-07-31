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

describe('mp4ToWebp', () => {
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

  it('encodes a trimmed animated WebP with crop preset, fps, resize, quality, and loop settings', async () => {
    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'demo.mp4', { type: 'video/mp4' })

    const results = await mp4ToWebp([input], {
      startTime: 1.25,
      endTime: 4.5,
      fps: 12,
      maxDimension: 640,
      quality: 72,
      loopCount: 3,
      cropPreset: 'square',
    })

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('demo.webp')

    expect(writeFileCalls).toEqual(['video_in_0.mp4'])
    expect(execCalls).toHaveLength(1)
    expect(execCalls[0]).toEqual([
      '-ss', '1.25',
      '-to', '4.5',
      '-i', 'video_in_0.mp4',
      '-an',
      '-vf', "crop='min(iw,ih)':'min(iw,ih)',fps=12,scale='if(gte(iw,ih),min(iw,640),-2)':'if(gte(iw,ih),-2,min(ih,640))':flags=lanczos",
      '-c:v', 'libwebp',
      '-lossless', '0',
      '-compression_level', '4',
      '-q:v', '72',
      '-loop', '3',
      '-preset', 'picture',
      '-vsync', '0',
      'video_out_0.webp',
    ])
    expect(deletedFiles).toEqual(['video_in_0.mp4', 'video_out_0.webp'])
  })

  it('surfaces non-Error ffmpeg failures instead of collapsing them to a generic message', async () => {
    ffmpegMock.exec.mockImplementationOnce(async () => {
      throw 'Unknown encoder libwebp'
    })

    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'broken.mp4', { type: 'video/mp4' })

    const results = await mp4ToWebp([input], {})

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(Error)
    expect((results[0] as Error).message).toContain('Unknown encoder libwebp')
  })

  it('turns audio-only mp4 failures into a clear user-facing message', async () => {
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
    const input = new File([new Uint8Array([0, 1, 2])], 'audio-only.mp4', { type: 'video/mp4' })

    const results = await mp4ToWebp([input], {})

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(Error)
    expect((results[0] as Error).message).toContain('no video track')
  })

  it('rejects audio-only mp4 files before ffmpeg work starts when preflight detects no video track', async () => {
    const probeModule = await import('@/lib/converters/media-probe')
    vi.mocked(probeModule.probeVideoTrack).mockResolvedValueOnce(false)

    const { mp4ToWebp } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'preflight-audio-only.mp4', { type: 'video/mp4' })

    const results = await mp4ToWebp([input], {})

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(Error)
    expect((results[0] as Error).message).toContain('no video track')
    expect(writeFileCalls).toHaveLength(0)
    expect(execCalls).toHaveLength(0)
  })
})
