import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { demuxMp4Audio } from '../mp4-audio-demux'

describe('demuxMp4Audio', () => {
  it('extracts AAC track from a real MP4', () => {
    const bytes = new Uint8Array(readFileSync(join(__dirname, 'fixtures', 'tiny-aac.mp4')))
    const audio = demuxMp4Audio(bytes)
    expect(audio).not.toBeNull()
    expect(audio!.codecString).toMatch(/^mp4a\.40\./)
    expect(audio!.sampleRate).toBe(48_000)
    expect(audio!.numberOfChannels).toBe(2)
    expect(audio!.description.length).toBeGreaterThanOrEqual(2)
    expect(audio!.samples.length).toBeGreaterThan(0)
    expect(audio!.samples[0].timestampUs).toBe(0)
    for (let i = 1; i < audio!.samples.length; i++) {
      expect(audio!.samples[i].timestampUs).toBeGreaterThan(audio!.samples[i - 1].timestampUs)
    }
  })

  it('returns null when there is no audio track', () => {
    const fake = new Uint8Array(16)
    const view = new DataView(fake.buffer)
    view.setUint32(0, 16)
    fake.set([0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0], 4)
    expect(demuxMp4Audio(fake)).toBeNull()
  })
})
