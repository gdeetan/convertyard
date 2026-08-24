export const MAX_TRANSCRIPT_TERMS = 40
export const MIN_TERM_LENGTH = 3
export const MAX_VOCAB_PROMPT_CHARS = 180
export const MAX_VOCAB_PROMPT_TOKENS = 100

export function parseTranscriptTerms(input: string): string[] {
  return collectTerms(input, MAX_TRANSCRIPT_TERMS)
}

export function hasTranscriptTermsOverflow(input: string): boolean {
  return collectTerms(input, MAX_TRANSCRIPT_TERMS + 1).length > MAX_TRANSCRIPT_TERMS
}

function collectTerms(input: string, limit: number): string[] {
  if (!input.trim()) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of input.split(/[,\n\r]+/)) {
    const term = part.trim()
    if (term.length < MIN_TERM_LENGTH) continue
    const key = term.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(term)
    if (out.length >= limit) break
  }
  return out
}

export function buildWhisperVocabPrompt(terms: string[]): string {
  if (terms.length === 0) return ''
  const kept: string[] = []
  for (const term of terms) {
    const joined = kept.length === 0 ? term : `${kept.join(', ')}, ${term}`
    if (joined.length + 1 > MAX_VOCAB_PROMPT_CHARS) break
    kept.push(term)
  }
  if (kept.length === 0) {
    return `${terms[0].slice(0, MAX_VOCAB_PROMPT_CHARS - 1)}.`
  }
  return `${kept.join(', ')}.`
}

export function stripVocabPromptLeak(text: string, prompt: string): string {
  if (!prompt || !text) return text
  const leading = text.match(/^\s*/)?.[0] ?? ''
  const body = text.slice(leading.length)
  const list = prompt.replace(/\.$/, '')
  const candidates = [
    prompt,
    list,
    `Vocabulary: ${prompt}`,
    `Vocabulary: ${list}`,
  ]
  const lower = body.toLowerCase()
  for (const candidate of candidates) {
    if (!candidate) continue
    if (!lower.startsWith(candidate.toLowerCase())) continue
    let rest = body.slice(candidate.length)
    rest = rest.replace(/^[\s,;:.-]+/, '')
    return rest
  }
  return text
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function termRegExp(term: string): RegExp {
  const escaped = escapeRegExp(term)
  const left = /^[\p{L}\p{N}_]/u.test(term) ? '(?<![\\p{L}\\p{N}_])' : ''
  const right = /[\p{L}\p{N}_]$/u.test(term) ? '(?![\\p{L}\\p{N}_])' : ''
  return new RegExp(`${left}${escaped}${right}`, 'giu')
}

export function applyTranscriptGlossary(text: string, terms: string[]): string {
  if (!text || terms.length === 0) return text
  const ordered = [...terms].sort((a, b) => b.length - a.length)
  let out = text
  for (const term of ordered) {
    try {
      out = out.replace(termRegExp(term), (match) => (match === term ? match : term))
    } catch {
      // never throw
    }
  }
  return out
}

export function applyTranscriptGlossaryToSrt(srt: string, terms: string[]): string {
  if (!srt || terms.length === 0) return srt
  return srt
    .split(/\r?\n\r?\n/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => {
          if (/^\d+$/.test(line.trim())) return line
          if (line.includes('-->')) return line
          return applyTranscriptGlossary(line, terms)
        })
        .join('\n')
    )
    .join('\n\n')
}

export interface VocabChunk {
  text: string
  timestamp?: [number, number]
}

export interface VocabResult {
  text: string
  chunks?: VocabChunk[]
}

export function applyVocabToTranscriptionResult(
  result: VocabResult,
  prompt: string,
  terms: string[],
): VocabResult {
  const chunks = result.chunks?.map((chunk) => ({
    ...chunk,
    text: applyTranscriptGlossary(stripVocabPromptLeak(chunk.text, prompt), terms),
  }))
  const textFromChunks = chunks
    ?.map((c) => c.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
  const text = textFromChunks
    || applyTranscriptGlossary(stripVocabPromptLeak(result.text, prompt), terms)
  return chunks ? { text, chunks } : { text, chunks: result.chunks }
}

export interface WhisperVocabTokenizer {
  encode: (text: string, options?: { add_special_tokens?: boolean }) => number[] | { input_ids?: number[] }
  bos_token_id?: number | null
  convert_tokens_to_ids?: (token: string) => number | undefined
}

function asTokenIdList(encoded: unknown): number[] {
  if (Array.isArray(encoded)) {
    return encoded.length > 0 && Array.isArray(encoded[0])
      ? (encoded[0] as number[]).map(Number)
      : encoded.map(Number)
  }
  if (encoded && typeof encoded === 'object') {
    const rec = encoded as { input_ids?: unknown; tolist?: () => unknown }
    if (Array.isArray(rec.input_ids)) return asTokenIdList(rec.input_ids)
    if (typeof rec.tolist === 'function') return asTokenIdList(rec.tolist())
  }
  return []
}

export function encodeWhisperVocabPromptIds(
  tokenizer: WhisperVocabTokenizer,
  prompt: string,
): number[] {
  if (!prompt) return []
  const ids = asTokenIdList(
    tokenizer.encode(`<|startofprev|>${prompt}`, { add_special_tokens: false }),
  )
  if (ids.length === 0) return []
  if (tokenizer.bos_token_id != null && ids[0] === tokenizer.bos_token_id) ids.shift()
  const sot = tokenizer.convert_tokens_to_ids?.('<|startoftranscript|>')
  if (sot != null && ids[0] === sot) ids.shift()
  return ids.slice(0, MAX_VOCAB_PROMPT_TOKENS)
}

export function mergeWhisperDecoderInputIds(promptIds: number[], initTokens: number[]): number[] {
  return [...promptIds, ...initTokens]
}
