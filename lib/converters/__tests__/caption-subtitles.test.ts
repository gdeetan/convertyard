import { describe, expect, it } from 'vitest'
import {
  parseSRT,
  parseVTT,
  parseSubtitleText,
  buildCaptionSRT,
  buildCaptionVTT,
  toSrtTime,
} from '../caption-subtitles'

const srt = `1
00:00:01,000 --> 00:00:03,000
Hello world

2
00:00:04,000 --> 00:00:06,000
This is a test
`

const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello world

00:00:04.000 --> 00:00:06.000
This is a test
`

describe('toSrtTime', () => {
  it('formats fractional seconds with a comma', () => {
    expect(toSrtTime(61.5)).toBe('00:01:01,500')
  })
})

describe('parseSRT / parseVTT', () => {
  it('splits each cue into timed words', () => {
    const words = parseSRT(srt)
    expect(words.map((w) => w.text)).toEqual(['Hello', 'world', 'This', 'is', 'a', 'test'])
    expect(words[0].start).toBe(1)
    expect(words[1].end).toBe(3)
    expect(words[2].start).toBe(4)
    expect(words[5].end).toBe(6)
  })

  it('parses VTT including the WEBVTT header', () => {
    const words = parseVTT(vtt)
    expect(words.map((w) => w.text)).toEqual(['Hello', 'world', 'This', 'is', 'a', 'test'])
  })

  it('auto-detects VTT vs SRT', () => {
    expect(parseSubtitleText(vtt)[0].text).toBe('Hello')
    expect(parseSubtitleText(srt)[0].text).toBe('Hello')
  })

  it('strips HTML tags in cues', () => {
    const words = parseSRT(`1
00:00:00,000 --> 00:00:01,000
<b>Hello</b> world
`)
    expect(words.map((w) => w.text)).toEqual(['Hello', 'world'])
  })

  it('throws when the file has no timed cues', () => {
    expect(() => parseSubtitleText('just some notes')).toThrow(/No timed captions/)
  })
})

describe('buildCaptionSRT / buildCaptionVTT', () => {
  it('round-trips grouped lines', () => {
    const words = parseSRT(srt)
    const out = buildCaptionSRT(words)
    expect(out).toContain('00:00:01,000 --> 00:00:03,000')
    expect(out).toContain('Hello world')
    expect(buildCaptionVTT(words).startsWith('WEBVTT')).toBe(true)
    expect(buildCaptionVTT(words)).toContain('00:00:01.000 --> 00:00:03.000')
  })
})
