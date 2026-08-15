import type { WordChunk } from './caption-types'
import { groupWordsIntoLines } from './caption-ass-builder'

const LINE_MAX_WORDS = 8
const LINE_MAX_DURATION_S = 3

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

export function toSrtTime(seconds: number): string {
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.round((s % 1) * 1000)
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(sec, 2)},${pad(ms, 3)}`
}

export function toVttTime(seconds: number): string {
  return toSrtTime(seconds).replace(',', '.')
}

function parseTimestamp(raw: string): number {
  const cleaned = raw.trim().replace(',', '.')
  const parts = cleaned.split(':')
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2])
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1])
  }
  return Number(cleaned)
}

const TS_LINE = /^(.+?)\s+-->\s+(\S+)/

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\{[^}]+\}/g, ' ').replace(/\s+/g, ' ').trim()
}

function wordsFromCue(text: string, start: number, end: number): WordChunk[] {
  const tokens = stripTags(text).split(' ').filter(Boolean)
  if (tokens.length === 0) return []
  const span = Math.max(end - start, 0.01)
  const step = span / tokens.length
  return tokens.map((token, i) => ({
    text: token,
    start: start + i * step,
    end: start + (i + 1) * step,
  }))
}

function parseCues(blocks: string[]): WordChunk[] {
  const words: WordChunk[] = []
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) continue
    let tsIdx = lines.findIndex((l) => TS_LINE.test(l))
    if (tsIdx === -1) continue
    const match = lines[tsIdx].match(TS_LINE)
    if (!match) continue
    const start = parseTimestamp(match[1])
    const end = parseTimestamp(match[2])
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    const text = lines.slice(tsIdx + 1).join(' ')
    words.push(...wordsFromCue(text, start, end))
  }
  return words
}

export function parseSRT(input: string): WordChunk[] {
  const blocks = input.replace(/^\uFEFF/, '').split(/\r?\n\r?\n/)
  return parseCues(blocks)
}

export function parseVTT(input: string): WordChunk[] {
  const body = input
    .replace(/^\uFEFF/, '')
    .replace(/^WEBVTT[^\n]*\n?/i, '')
  const blocks = body.split(/\r?\n\r?\n/).filter((block) => {
    const first = block.trim().split(/\r?\n/)[0] ?? ''
    return !/^(NOTE|STYLE|REGION)\b/i.test(first)
  })
  return parseCues(blocks)
}

export function parseSubtitleText(input: string): WordChunk[] {
  const trimmed = input.replace(/^\uFEFF/, '')
  const words = /^\s*WEBVTT/i.test(trimmed) ? parseVTT(trimmed) : parseSRT(trimmed)
  if (words.length === 0) {
    throw new Error('No timed captions found. Check the SRT or VTT file.')
  }
  return words
}

function groupedCues(words: WordChunk[]): { start: number; end: number; text: string }[] {
  return groupWordsIntoLines(words, LINE_MAX_WORDS, LINE_MAX_DURATION_S).map((group) => ({
    start: group[0].start,
    end: group[group.length - 1].end,
    text: group.map((w) => w.text).join(' '),
  }))
}

export function buildCaptionSRT(words: WordChunk[]): string {
  return groupedCues(words)
    .map((cue, i) => `${i + 1}\n${toSrtTime(cue.start)} --> ${toSrtTime(cue.end)}\n${cue.text}\n`)
    .join('\n')
}

export function buildCaptionVTT(words: WordChunk[]): string {
  const body = groupedCues(words)
    .map((cue) => `${toVttTime(cue.start)} --> ${toVttTime(cue.end)}\n${cue.text}\n`)
    .join('\n')
  return `WEBVTT\n\n${body}`
}
