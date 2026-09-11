import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockMediabunnyCompress = vi.fn(
  async (_file: File, _options: Record<string, unknown>, _onProgress?: (n: number) => void) =>
    new File([new Uint8Array([1])], 'out.mp4', { type: 'video/mp4' }),
)
const mockMediabunnySupported = vi.fn(() => true)

vi.mock('../compress-video-mediabunny', () => ({
  isMediabunnySupported: () => mockMediabunnySupported(),
  compressVideoWithMediabunny: (file: File, options: Record<string, unknown>, onProgress: (n: number) => void) =>
    mockMediabunnyCompress(file, options, onProgress),
}))

vi.mock('@ffmpeg/util', () => ({ fetchFile: vi.fn(async (f: File) => new Uint8Array([1, 2, 3])) }))

vi.mock('@/lib/converters/media-probe', () => ({
  probeVideoTrack: vi.fn(async () => true),
  probeVideoDuration: vi.fn(async () => 0),
  probeVideoDimensions: vi.fn(async () => null),
  probeAudioInfo: vi.fn(async () => null),
  probeVideoCodec: vi.fn(async () => 'h264'),
}))

vi.mock('@/lib/converters/ffmpeg-client', () => ({
  getFFmpeg: vi.fn(async () => ({})),
  getCompressVideoFFmpeg: vi.fn(async () => ({
    exec: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    deleteFile: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
  getSingleThreadFFmpeg: vi.fn(),
  getMobileFFmpeg: vi.fn(),
}))

vi.mock('@/lib/converters/compress-video-webcodecs', () => ({
  tryCompressVideoHevcHardware: vi.fn(async () => null),
  tryCompressVideoAvcHardware: vi.fn(async () => null),
}))

import { compressVideo } from '../ffmpeg'
import { getCompressVideoFFmpeg } from '@/lib/converters/ffmpeg-client'

function makeHugeFile(name = 'C0483.MP4') {
  const file = new File([new Uint8Array(8)], name, { type: 'video/mp4' })
  Object.defineProperty(file, 'size', { value: 4035006332 })
  return file
}

describe('compressVideo >2 GB routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMediabunnySupported.mockReturnValue(true)
    mockMediabunnyCompress.mockResolvedValue(
      new File([new Uint8Array([1])], 'out.mp4', { type: 'video/mp4' }),
    )
  })

  it('sends a 3.8 GB 1080p compress to the mediabunny streaming path, not ffmpeg-wasm', async () => {
    const file = makeHugeFile()
    await compressVideo(
      [file],
      { targetSizeMode: false, level: 'medium', resolution: '1080p', h265: false, stripAudio: false },
    )
    expect(mockMediabunnyCompress).toHaveBeenCalledOnce()
    expect(mockMediabunnyCompress.mock.calls[0][1]).toMatchObject({ resolution: '1080p' })
    expect(getCompressVideoFFmpeg).not.toHaveBeenCalled()
  })
})
