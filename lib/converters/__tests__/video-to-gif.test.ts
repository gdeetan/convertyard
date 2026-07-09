import { beforeEach, describe, expect, it, vi } from 'vitest'

const execCalls: string[][] = []
const writeFileCalls: string[] = []
const deletedFiles: string[] = []

const ffmpegMock = {
  writeFile: vi.fn(async (name: string) => {
    writeFileCalls.push(name)
  }),
  readFile: vi.fn(async () => new Uint8Array([71, 73, 70, 56])),
  deleteFile: vi.fn(async (name: string) => {
    deletedFiles.push(name)
  }),
  exec: vi.fn(async (args: string[]) => {
    execCalls.push(args)
    return 0
  }),
  on: vi.fn(),
  off: vi.fn(),
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

describe('videoToGif', () => {
  beforeEach(() => {
    execCalls.length = 0
    writeFileCalls.length = 0
    deletedFiles.length = 0
    vi.clearAllMocks()
    ffmpegMock.readFile.mockImplementation(async () => new Uint8Array([71, 73, 70, 56]))
    ffmpegMock.exec.mockImplementation(async (args: string[]) => {
      execCalls.push(args)
      return 0
    })
  })

  it('encodes a trimmed gif with fps, resize, and loop settings', async () => {
    const { videoToGif } = await import('@/lib/converters/ffmpeg')
    const input = new File([new Uint8Array([0, 1, 2])], 'clip.mp4', { type: 'video/mp4' })

    const results = await videoToGif([input], {
      startTime: 1.5,
      endTime: 4,
      fps: 12,
      outputWidth: 480,
      loop: 0,
    })

    expect(results).toHaveLength(1)
    expect(results[0]).toBeInstanceOf(File)
    expect((results[0] as File).name).toBe('clip.gif')
    expect(writeFileCalls).toEqual(['video_in_0.mp4'])
    expect(execCalls[0]).toEqual([
      '-ss', '1.5',
      '-to', '4',
      '-i', 'video_in_0.mp4',
      '-vf', "fps=12,scale=480:-2:flags=lanczos,split[s0][s1];[s0]palettegen=stats_mode=full[p];[s1][p]paletteuse=dither=bayer",
      '-loop', '0',
      'video_out_0.gif',
    ])
    expect(deletedFiles).toEqual(['video_in_0.mp4', 'video_out_0.gif'])
  })
})
