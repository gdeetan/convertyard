/** Phrase-level OCR fixes that need neighboring words or page context. */

const SPLIT_WORDS: Array<[RegExp, string]> = [
  [/\bgrave\s+ful\b/gi, 'grateful'],
  [/\bSOME\s+TIMES\b/g, 'SOMETIMES'],
  [/\bSome\s+times\b/g, 'Sometimes'],
  [/\bsome\s+times\b/g, 'sometimes'],
]

const ALWAYS: Array<[RegExp, string]> = [
  [/\bThus is my\b/g, 'This is my'],
  [/\bgitten\b/gi, 'gotten'],
  [/\bcompilinets\b/gi, 'compliments'],
  [/\bcompiiments\b/gi, 'compliments'],
]

const HANDWRITING_PAGE = /handwrit|writing|cursive|fountain|micron/i

export function rescoreOcrText(text: string): string {
  let out = text
  for (const [pattern, repl] of SPLIT_WORDS) out = out.replace(pattern, repl)
  for (const [pattern, repl] of ALWAYS) out = out.replace(pattern, repl)

  if (HANDWRITING_PAGE.test(out)) {
    out = out.replace(/\bHey Credit\b/g, 'Hey Reddit')
    out = out.replace(/\bcuisine\b/gi, match =>
      match === match.toUpperCase() ? 'CURSIVE' : match[0] === 'C' ? 'Cursive' : 'cursive',
    )
    out = out.replace(/\bmiting\b/gi, match => match[0] === 'M' ? 'Writing' : 'writing')
    out = out.replace(/\bwitting\b/gi, match => match[0] === 'W' ? 'Writing' : 'writing')
    out = out.replace(/\bhuf\s*-?\s*cursive\b/gi, 'half-cursive')
    out = out.replace(/\bhalf-\s*cursive\b/gi, 'half-cursive')
    out = out.replace(/\bllf\s*-?\s*/gi, 'half-')
  }

  return out
}
