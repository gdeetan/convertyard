import type { WordChunk } from './caption-types'

export function splitWord(words: WordChunk[], index: number): WordChunk[] {
  const w = words[index]
  if (!w) return words
  const tokens = w.text.trim().split(/\s+/).filter(Boolean)
  const mid = (w.start + w.end) / 2
  if (tokens.length >= 2) {
    const cut = Math.ceil(tokens.length / 2)
    const left: WordChunk = { text: tokens.slice(0, cut).join(' '), start: w.start, end: mid }
    const right: WordChunk = { text: tokens.slice(cut).join(' '), start: mid, end: w.end }
    return [...words.slice(0, index), left, right, ...words.slice(index + 1)]
  }
  const left: WordChunk = { text: w.text, start: w.start, end: mid }
  const right: WordChunk = { text: w.text, start: mid, end: w.end }
  return [...words.slice(0, index), left, right, ...words.slice(index + 1)]
}

export function mergeWordWithNext(words: WordChunk[], index: number): WordChunk[] {
  if (index < 0 || index >= words.length - 1) return words
  const a = words[index]
  const b = words[index + 1]
  const merged: WordChunk = {
    text: `${a.text} ${b.text}`.replace(/\s+/g, ' ').trim(),
    start: a.start,
    end: b.end,
  }
  return [...words.slice(0, index), merged, ...words.slice(index + 2)]
}

export function insertWordAfter(words: WordChunk[], index: number): WordChunk[] {
  if (index < 0 || index >= words.length) return words
  const prev = words[index]
  const next = words[index + 1]
  const start = prev.end
  const gapEnd = next ? next.start : start + 0.4
  const end = Math.max(start + 0.12, Math.min(gapEnd, start + 0.4))
  const inserted: WordChunk = { text: '…', start, end }
  return [...words.slice(0, index + 1), inserted, ...words.slice(index + 1)]
}

export function setWordTiming(
  words: WordChunk[],
  index: number,
  start: number,
  end: number,
): WordChunk[] {
  if (!words[index]) return words
  const next = [...words]
  const s = Math.max(0, start)
  next[index] = { ...next[index], start: s, end: Math.max(s + 0.05, end) }
  return next
}

export function nudgeWord(words: WordChunk[], index: number, deltaSec: number): WordChunk[] {
  const w = words[index]
  if (!w) return words
  return setWordTiming(words, index, w.start + deltaSec, w.end + deltaSec)
}

export function nudgeAllWords(words: WordChunk[], deltaSec: number): WordChunk[] {
  return words.map((w) => {
    const start = Math.max(0, w.start + deltaSec)
    return { ...w, start, end: Math.max(start + 0.05, w.end + deltaSec) }
  })
}
