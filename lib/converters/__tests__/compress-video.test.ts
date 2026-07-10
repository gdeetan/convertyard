import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@ffmpeg/util', () => ({ fetchFile: vi.fn(async (f: File) => new Uint8Array([1, 2, 3])) }))

vi.mock('@/lib/converters/media-probe', () => ({
  probeVideoTrack: vi.fn(async () => true),
}))

const mockExec = vi.fn(async () => {})
const mockWriteFile = vi.fn(async () => {})
const mockReadFile = vi.fn(async () => new Uint8Array([9, 8, 7]))
const mockDeleteFile = vi.fn(async () => {})
const mockOn = vi.fn()
const mockOff = vi.fn()

vi.mock('@/lib/converters/ffmpeg-client', () => ({
  getFFmpeg: vi.fn(async () => ({
    exec: mockExec,
    writeFile: mockWriteFile,
    readFile: mockReadFile,
    deleteFile: mockDeleteFile,
    on: mockOn,
    off: mockOff,
  })),
}))

import { compressVideo } from '../ffmpeg'

describe('compressVideo', () => {
  beforeEach(() => vi.clearAllMocks())

  const makeFile = (name: string, size = 1024) => {
    const f = new File([new Uint8Array(size)], name, { type: 'video/mp4' })
    return f
  }

  it('preset mode: calls exec with libx264 and CRF 23 for medium', async () => {
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: 'original', h265: false, stripAudio: false })
    expect(mockExec).toHaveBeenCalledOnce()
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('libx264')
    expect(args).toContain('23')
    expect(args).not.toContain('-an')
    expect(args).not.toContain('-vf')
  })

  it('preset mode: uses libx265 when h265=true', async () => {
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: 'original', h265: true, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('libx265')
    expect(args).toContain('26')
  })

  it('preset mode: includes -vf scale filter for 720p', async () => {
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: '720p', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-vf')
    const vfIndex = args.indexOf('-vf')
    expect(args[vfIndex + 1]).toContain('720')
  })

  it('preset mode: adds -an when stripAudio=true', async () => {
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: 'original', h265: false, stripAudio: true })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-an')
  })

  it('target size mode: succeeds in 1 pass when mock output is tiny', async () => {
    const file = makeFile('video.mp4', 10 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 100, resolution: 'original', h265: false, stripAudio: false })
    expect(mockExec).toHaveBeenCalledOnce()
  })

  it('returns an Error for each failed file', async () => {
    mockExec.mockRejectedValueOnce(new Error('ffmpeg fail'))
    const file = makeFile('bad.mp4')
    const results = await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: 'original', h265: false, stripAudio: false })
    expect(results[0]).toBeInstanceOf(Error)
  })

  it('output file is named after input with .mp4 extension', async () => {
    const file = makeFile('my-clip.mov')
    const results = await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: 'original', h265: false, stripAudio: false })
    expect((results[0] as File).name).toBe('my-clip.mp4')
  })

  it('cleans up temp files after successful conversion', async () => {
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: 'original', h265: false, stripAudio: false })
    expect(mockDeleteFile).toHaveBeenCalled()
  })

  it('target size mode: runs all 6 passes when output never fits', async () => {
    mockReadFile.mockResolvedValue(new Uint8Array([9, 8, 7]))
    const file = makeFile('video.mp4')
    const results = await compressVideo([file], { targetSizeMode: true, targetKB: 0, resolution: 'original', h265: false, stripAudio: false })
    expect(mockExec).toHaveBeenCalledTimes(6)
    // Still returns a File (last pass result)
    expect(results[0]).toBeInstanceOf(File)
  })

  it('target size mode: input file written once and read on every pass', async () => {
    // targetKB=0 forces 6 passes; input must be available for each exec call
    mockReadFile.mockResolvedValue(new Uint8Array([9, 8, 7]))
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: true, targetKB: 0, resolution: 'original', h265: false, stripAudio: false })
    expect(mockWriteFile).toHaveBeenCalledOnce()
    const inputName = mockWriteFile.mock.calls[0][0] as string
    // Every exec call should reference the same input file
    for (const call of mockExec.mock.calls) {
      expect(call[0]).toContain(inputName)
    }
  })
})
