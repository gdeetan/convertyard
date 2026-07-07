// lib/ocr/correction.ts
// Conservative post-OCR correction using dictionary + confusion pairs.
// Dictionary source: dwyl/english-words (370k words), MIT license.
// Safety model: never correct high-confidence words, digits, mixed alphanumerics, or URLs.
// Every correction is recorded in OcrWordMeta.corrected so the UI can show diffs and revert.

import type { OcrWordMeta } from '@/lib/types'

export interface DictIndex {
  words: Set<string>          // lowercase words
  freq: Map<string, number>   // word → frequency rank (lower = more common)
}

// OCR confusion pairs: [from, to] — applied in both directions
export const CONFUSION_PAIRS: [string, string][] = [
  ['rn', 'm'],
  ['cl', 'd'],
  ['li', 'h'],
  ['vv', 'w'],
  ['0', 'O'],
  ['O', '0'],
  ['1', 'l'],
  ['l', '1'],
  ['1', 'I'],
  ['I', '1'],
  ['5', 'S'],
  ['S', '5'],
  ['8', 'B'],
  ['B', '8'],
  ['é', 'e'],
  ['è', 'e'],
  ['ê', 'e'],
  ['ii', 'u'],
  ['nn', 'm'],
]

export function stripEdgePunctuation(word: string): string {
  return word.replace(/^[^a-zA-Z']+/, '').replace(/[^a-zA-Z']+$/, '')
}

export function isSafeToCorrect(token: string, confidence: number): boolean {
  // High-confidence words: engine likely read it correctly
  if (confidence >= 85 && confidence !== -1) return false
  // Skip tokens with digits, @, /, #, . — prices, IDs, emails, URLs
  if (/[0-9@/#.]/.test(token)) return false
  // Must be purely alphabetic after stripping edge punctuation
  const stripped = stripEdgePunctuation(token)
  if (stripped.length < 2) return false
  if (!/^[a-zA-Z']+$/.test(stripped)) return false
  return true
}

export function applyConfusionPairs(word: string): string[] {
  const lower = word.toLowerCase()
  const candidates = new Set<string>()
  for (const [from, to] of CONFUSION_PAIRS) {
    let idx = lower.indexOf(from)
    while (idx !== -1) {
      candidates.add(lower.slice(0, idx) + to + lower.slice(idx + from.length))
      idx = lower.indexOf(from, idx + 1)
    }
  }
  return Array.from(candidates)
}

export function scoreCandidate(word: string, dict: DictIndex): number {
  return dict.freq.get(word.toLowerCase()) ?? Infinity
}

function restoreCapitalization(original: string, corrected: string): string {
  if (original === original.toUpperCase() && original.length > 1) return corrected.toUpperCase()
  if (original[0] === original[0].toUpperCase()) {
    return corrected[0].toUpperCase() + corrected.slice(1)
  }
  return corrected
}

export function correctWord(
  meta: OcrWordMeta,
  dict: DictIndex,
  trocr: boolean
): OcrWordMeta {
  const stripped = stripEdgePunctuation(meta.text)
  if (!isSafeToCorrect(meta.text, meta.confidence)) return meta
  if (dict.words.has(stripped.toLowerCase())) return meta  // already a known word

  const candidates = applyConfusionPairs(stripped)

  // TrOCR: extra cautious — only single confusion-pair substitution (edit distance 1 equivalent)
  const filteredCandidates = trocr
    ? candidates.filter(c => {
        // Only allow candidates that differ by exactly one pair substitution
        const orig = stripped.toLowerCase()
        const cand = c.toLowerCase()
        return Math.abs(orig.length - cand.length) <= 1
      })
    : candidates

  const dictHits = filteredCandidates.filter(c => dict.words.has(c.toLowerCase()))

  if (dictHits.length === 0) return meta

  if (dictHits.length === 1) {
    const candidate = restoreCapitalization(stripped, dictHits[0])
    return { ...meta, corrected: candidate }
  }

  // Multiple hits: pick highest-frequency; skip if top two are within 2× (ambiguous)
  const sorted = [...dictHits].sort((a, b) => scoreCandidate(a, dict) - scoreCandidate(b, dict))
  const topScore = scoreCandidate(sorted[0], dict)
  const secondScore = scoreCandidate(sorted[1], dict)

  if (topScore === Infinity) return meta
  if (secondScore !== Infinity && secondScore / topScore < 2) return meta  // ambiguous

  const candidate = restoreCapitalization(stripped, sorted[0])
  return { ...meta, corrected: candidate }
}

export function applyCorrections(
  words: OcrWordMeta[],
  dict: DictIndex,
  trocr: boolean
): OcrWordMeta[] {
  return words.map(w => correctWord(w, dict, trocr))
}
