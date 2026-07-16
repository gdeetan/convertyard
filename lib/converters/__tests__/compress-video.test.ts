import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@ffmpeg/util', () => ({ fetchFile: vi.fn(async (f: File) => new Uint8Array([1, 2, 3])) }))

vi.mock('@/lib/converters/media-probe', () => ({
  probeVideoTrack: vi.fn(async () => true),
  probeVideoDuration: vi.fn(async () => 0),
  probeVideoDimensions: vi.fn(async () => null),
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
import { probeVideoDuration, probeVideoDimensions } from '@/lib/converters/media-probe'

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

  it('target size mode: CRF fallback runs all 6 passes when output never fits (duration unavailable)', async () => {
    // probeVideoDuration returns 0 (default mock) → CRF fallback path
    mockReadFile.mockResolvedValue(new Uint8Array([9, 8, 7]))
    const file = makeFile('video.mp4')
    const results = await compressVideo([file], { targetSizeMode: true, targetKB: 0, resolution: 'original', h265: false, stripAudio: false })
    expect(mockExec).toHaveBeenCalledTimes(6)
    expect(results[0]).toBeInstanceOf(File)
  })

  it('target size mode: input file written once and referenced in every exec call', async () => {
    mockReadFile.mockResolvedValue(new Uint8Array([9, 8, 7]))
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: true, targetKB: 0, resolution: 'original', h265: false, stripAudio: false })
    expect(mockWriteFile).toHaveBeenCalledOnce()
    const inputName = mockWriteFile.mock.calls[0][0] as string
    for (const call of mockExec.mock.calls) {
      expect(call[0]).toContain(inputName)
    }
  })

  it('target size mode: stream-copies when file already fits target (no re-encode)', async () => {
    const file = makeFile('video.mp4', 1024)  // 1 KB
    await compressVideo([file], { targetSizeMode: true, targetKB: 100, resolution: 'original', h265: false, stripAudio: false })
    expect(mockExec).toHaveBeenCalledOnce()
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('copy')
  })

  it('target size mode: 1-pass ABR when duration is available', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 10 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 5120, resolution: 'original', h265: false, stripAudio: false })
    expect(mockExec).toHaveBeenCalledOnce()
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-b:v')
    expect(args).toContain('-maxrate')
    expect(args).toContain('-bufsize')
    expect(args).not.toContain('-crf')
    expect(args).not.toContain('-pass')
  })

  it('target size mode: 1-pass ABR calculates bitrate from duration and target', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 10 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 5120, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    const bvIndex = args.indexOf('-b:v')
    expect(parseInt(args[bvIndex + 1])).toBeGreaterThan(0)
    const maxrateIndex = args.indexOf('-maxrate')
    expect(parseInt(args[maxrateIndex + 1])).toBeGreaterThan(parseInt(args[bvIndex + 1]))
  })

  it('target size mode: uses 64kbps audio for targets at or below 10MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 20 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 5 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('64k')
    expect(args).not.toContain('128k')
  })

  it('target size mode: uses 96kbps audio for targets between 10MB and 50MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 60 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 25 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('96k')
    expect(args).not.toContain('128k')
  })

  it('target size mode: uses 128kbps audio for targets above 50MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 100 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('128k')
  })

  it('target size mode: uses 64kbps audio at exactly 10MB target boundary', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 20 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 10 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('64k')
  })

  it('target size mode: uses 96kbps audio just above 10MB target boundary', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 60 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 10 * 1024 + 1, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('96k')
  })

  it('target size mode: uses 96kbps audio at exactly 50MB target boundary', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('96k')
  })

  it('target size mode: uses 128kbps audio just above 50MB target boundary', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    const file = makeFile('video.mp4', 300 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024 + 1, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('128k')
  })

  it('preset mode: always uses 128kbps audio regardless of target', async () => {
    const file = makeFile('video.mp4')
    await compressVideo([file], { targetSizeMode: false, level: 'medium', resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('128k')
  })

  it('target size mode: auto-scales 4K source to 1080p for targets at or below 50MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    vi.mocked(probeVideoDimensions).mockResolvedValueOnce({ width: 3840, height: 2160 })
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-vf')
    expect(args[args.indexOf('-vf') + 1]).toContain('1080')
  })

  it('target size mode: auto-scales 1080p source to 720p for targets at or below 10MB', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    vi.mocked(probeVideoDimensions).mockResolvedValueOnce({ width: 1920, height: 1080 })
    const file = makeFile('video.mp4', 50 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 10 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-vf')
    expect(args[args.indexOf('-vf') + 1]).toContain('720')
  })

  it('target size mode: does not auto-scale when source is already within threshold', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    vi.mocked(probeVideoDimensions).mockResolvedValueOnce({ width: 1280, height: 720 })
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    // source is 720p, target is 50MB — auto-scale threshold is 1080p, source already fits
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: 'original', h265: false, stripAudio: false })
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).not.toContain('-vf')
  })

  it('target size mode: user-set resolution is not overridden by auto-scale', async () => {
    vi.mocked(probeVideoDuration).mockResolvedValueOnce(60)
    // probeVideoDimensions should NOT be called when user has set a resolution
    const file = makeFile('video.mp4', 200 * 1024 * 1024)
    await compressVideo([file], { targetSizeMode: true, targetKB: 50 * 1024, resolution: '720p', h265: false, stripAudio: false })
    expect(probeVideoDimensions).not.toHaveBeenCalled()
    const args: string[] = mockExec.mock.calls[0][0]
    expect(args).toContain('-vf')
    expect(args[args.indexOf('-vf') + 1]).toContain('720')
  })
})
