import { describe, expect, it } from 'vitest'
import {
  captionExtractFfmpegArgs,
  captionExtractFfmpegArgSets,
  captionFfmpegInputName,
  materializeCaptionFile,
  pcmFromWavBytes,
} from '../caption-transcribe'
import { effectiveWhisperTimestamps } from '../whisper-postprocess'

function writeAscii(bytes: Uint8Array, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i)
}

function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true)
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true)
}

/** Minimal PCM s16le WAV. Optionally place it as a view into a larger odd-sized heap. */
function makeWav(samples: number[], heapPad = 0, heapExtra = 0): Uint8Array {
  const dataBytes = samples.length * 2
  const wavSize = 44 + dataBytes
  const heap = new ArrayBuffer(heapPad + wavSize + heapExtra)
  const bytes = new Uint8Array(heap, heapPad, wavSize)
  const view = new DataView(heap, heapPad, wavSize)

  writeAscii(bytes, 0, 'RIFF')
  writeU32(view, 4, 36 + dataBytes)
  writeAscii(bytes, 8, 'WAVE')
  writeAscii(bytes, 12, 'fmt ')
  writeU32(view, 16, 16)
  writeU16(view, 20, 1)
  writeU16(view, 22, 1)
  writeU32(view, 24, 16000)
  writeU32(view, 28, 32000)
  writeU16(view, 32, 2)
  writeU16(view, 34, 16)
  writeAscii(bytes, 36, 'data')
  writeU32(view, 40, dataBytes)
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true)
  }
  return bytes
}

describe('pcmFromWavBytes', () => {
  it('reads PCM samples from a standard 44-byte WAV', () => {
    const pcm = pcmFromWavBytes(makeWav([0, 16384, -16384, 32767]))
    expect(pcm).toHaveLength(4)
    expect(pcm[0]).toBeCloseTo(0)
    expect(pcm[1]).toBeCloseTo(0.5, 2)
    expect(pcm[2]).toBeCloseTo(-0.5, 2)
    expect(pcm[3]).toBeCloseTo(1, 2)
  })

  it('does not throw when ffmpeg returns a view into a larger odd-sized heap', () => {
    const view = makeWav([1000, -1000, 2000], 17, 0)
    expect(view.byteOffset).toBe(17)
    expect(view.buffer.byteLength % 2).toBe(1)
    const pcm = pcmFromWavBytes(view)
    expect(pcm).toHaveLength(3)
    expect(pcm[0]).toBeCloseTo(1000 / 32768, 4)
  })

  it('skips extra WAV chunks before the data payload', () => {
    const samples = [1234, -2345]
    const dataBytes = samples.length * 2
    const extra = 12
    const wavSize = 44 + extra + dataBytes
    const bytes = new Uint8Array(wavSize)
    const view = new DataView(bytes.buffer)
    writeAscii(bytes, 0, 'RIFF')
    writeU32(view, 4, 36 + extra + dataBytes)
    writeAscii(bytes, 8, 'WAVE')
    writeAscii(bytes, 12, 'fmt ')
    writeU32(view, 16, 16)
    writeU16(view, 20, 1)
    writeU16(view, 22, 1)
    writeU32(view, 24, 16000)
    writeU32(view, 28, 32000)
    writeU16(view, 32, 2)
    writeU16(view, 34, 16)
    writeAscii(bytes, 36, 'LIST')
    writeU32(view, 40, 4)
    writeAscii(bytes, 44, 'INFO')
    writeAscii(bytes, 48, 'data')
    writeU32(view, 52, dataBytes)
    view.setInt16(56, samples[0], true)
    view.setInt16(58, samples[1], true)

    const pcm = pcmFromWavBytes(bytes)
    expect(pcm).toHaveLength(2)
    expect(pcm[0]).toBeCloseTo(1234 / 32768, 4)
    expect(pcm[1]).toBeCloseTo(-2345 / 32768, 4)
  })
})

describe('captionFfmpegInputName', () => {
  it('keeps a safe container extension so ffmpeg can probe the file', () => {
    expect(captionFfmpegInputName('Holiday.MOV', 1)).toBe('cap_in_1.mov')
    expect(captionFfmpegInputName('clip.webm', 2)).toBe('cap_in_2.webm')
    expect(captionFfmpegInputName('noext', 3)).toBe('cap_in_3.mp4')
  })

  it('uses the Android gallery MIME type when the picker file has no extension', () => {
    expect(captionFfmpegInputName('video', 4, 'video/mp4')).toBe('cap_in_4.mp4')
    expect(captionFfmpegInputName('', 5, 'video/quicktime')).toBe('cap_in_5.mov')
    expect(captionFfmpegInputName('clip', 6, 'video/3gpp')).toBe('cap_in_6.3gp')
  })
})

describe('materializeCaptionFile', () => {
  it('gives Android picker blobs a real name and copies the bytes', async () => {
    const raw = new File([new Uint8Array(64).fill(1)], '', { type: 'video/quicktime' })
    const file = await materializeCaptionFile(raw)
    expect(file.name).toBe('video.mov')
    expect(file.size).toBe(64)
  })
})

describe('captionExtractFfmpegArgSets', () => {
  it('maps only the first audio stream and does not re-encode video', () => {
    expect(captionExtractFfmpegArgs('cap_in_1.mov', 'out.wav')).toEqual([
      '-i', 'cap_in_1.mov',
      '-map', '0:a:0',
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      'out.wav',
    ])
  })

  it('falls back to a no-map extract when stream 0:a:0 is missing', () => {
    const sets = captionExtractFfmpegArgSets('in.mp4', 'out.wav')
    expect(sets.length).toBeGreaterThan(1)
    expect(sets.at(-1)).toEqual([
      '-i', 'in.mp4',
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      'out.wav',
    ])
  })
})

describe('effectiveWhisperTimestamps', () => {
  it('downgrades word timestamps to segment timestamps for Xenova ONNX Whisper', () => {
    expect(effectiveWhisperTimestamps('word')).toBe(true)
    expect(effectiveWhisperTimestamps(true)).toBe(true)
    expect(effectiveWhisperTimestamps(false)).toBe(false)
  })
})
