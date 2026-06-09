// lib/converters/json-formatter.ts
import type { ToolOptions } from '@/lib/types'
import type { TextConvertResult } from '@/lib/types-text'

function sortKeysDeep(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(sortKeysDeep)
  if (val !== null && typeof val === 'object') {
    const obj = val as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(obj).sort().map((k) => [k, sortKeysDeep(obj[k])])
    )
  }
  return val
}

function getIndent(opts: ToolOptions): string | number {
  if (opts.minify === true) return 0
  const indent = (opts.indent as string) ?? '2'
  if (indent === 'tab') return '\t'
  return parseInt(indent, 10)
}

export function formatJson(input: string, opts: ToolOptions): TextConvertResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { output: '', outputMime: 'application/json', outputFilename: 'formatted.json', errorMessage: 'Input is empty' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (e) {
    const msg = e instanceof SyntaxError ? e.message : String(e)
    let errorLine: number | undefined
    let errorCol: number | undefined

    const posMatch = msg.match(/position (\d+)/)
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10)
      const before = trimmed.slice(0, pos)
      errorLine = (before.match(/\n/g) ?? []).length + 1
      errorCol = pos - before.lastIndexOf('\n')
    }
    const lineMatch = msg.match(/line (\d+) column (\d+)/)
    if (lineMatch) {
      errorLine = parseInt(lineMatch[1], 10)
      errorCol = parseInt(lineMatch[2], 10)
    }

    return { output: '', outputMime: 'application/json', outputFilename: 'formatted.json', errorMessage: msg, errorLine, errorCol }
  }

  if (opts.sortKeys === true) parsed = sortKeysDeep(parsed)

  const indent = getIndent(opts)
  const output = JSON.stringify(parsed, null, indent === 0 ? undefined : indent)

  return {
    output,
    outputMime: 'application/json',
    outputFilename: opts.minify ? 'minified.json' : 'formatted.json',
  }
}
