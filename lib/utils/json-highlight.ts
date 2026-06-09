// lib/utils/json-highlight.ts
import React from 'react'

type JsonTokenType = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'whitespace' | 'error'

interface JsonToken {
  type: JsonTokenType
  text: string
}

const TOKEN_CLASS: Record<JsonTokenType, string> = {
  key:         'text-blue-400',
  string:      'text-green-400',
  number:      'text-yellow-300',
  boolean:     'text-purple-400',
  null:        'text-red-400',
  punctuation: 'text-fg-muted',
  whitespace:  '',
  error:       'text-red-500',
}

function tokenize(input: string): JsonToken[] {
  const tokens: JsonToken[] = []
  let i = 0

  while (i < input.length) {
    if (/\s/.test(input[i])) {
      const start = i
      while (i < input.length && /\s/.test(input[i])) i++
      tokens.push({ type: 'whitespace', text: input.slice(start, i) })
      continue
    }

    if (input[i] === '"') {
      const start = i
      i++
      while (i < input.length) {
        if (input[i] === '\\') { i += 2; continue }
        if (input[i] === '"') { i++; break }
        i++
      }
      const raw = input.slice(start, i)
      let j = i
      while (j < input.length && input[j] === ' ') j++
      tokens.push({ type: input[j] === ':' ? 'key' : 'string', text: raw })
      continue
    }

    if (/[-\d]/.test(input[i])) {
      const start = i
      if (input[i] === '-') i++
      while (i < input.length && /[\d.eE+\-]/.test(input[i])) i++
      tokens.push({ type: 'number', text: input.slice(start, i) })
      continue
    }

    if (input.startsWith('true', i))  { tokens.push({ type: 'boolean', text: 'true'  }); i += 4; continue }
    if (input.startsWith('false', i)) { tokens.push({ type: 'boolean', text: 'false' }); i += 5; continue }
    if (input.startsWith('null', i))  { tokens.push({ type: 'null',    text: 'null'  }); i += 4; continue }

    if ('{}[]:,'.includes(input[i])) {
      tokens.push({ type: 'punctuation', text: input[i] })
      i++
      continue
    }

    tokens.push({ type: 'error', text: input[i] })
    i++
  }

  return tokens
}

export function highlightJson(input: string): React.ReactNode[] {
  return tokenize(input).map((tok, idx) => {
    const cls = TOKEN_CLASS[tok.type]
    if (!cls) return tok.text
    return React.createElement('span', { key: idx, className: cls }, tok.text)
  })
}
