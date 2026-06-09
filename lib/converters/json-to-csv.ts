// lib/converters/json-to-csv.ts
import type { ToolOptions } from '@/lib/types'
import type { TextConvertResult, TablePreview } from '@/lib/types-text'

function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
  result: Record<string, string> = {}
): Record<string, string> {
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(val)) {
      result[fullKey] = val
        .map((item) => (item !== null && typeof item === 'object' ? JSON.stringify(item) : String(item ?? '')))
        .join('|')
    } else if (val !== null && typeof val === 'object') {
      flattenObject(val as Record<string, unknown>, fullKey, result)
    } else {
      result[fullKey] = val === null || val === undefined ? '' : String(val)
    }
  }
  return result
}

function escapeField(value: string, delimiter: string): string {
  if (value.includes('"') || value.includes(delimiter) || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function getDelimiter(opts: ToolOptions): string {
  const d = (opts.delimiter as string) ?? 'comma'
  if (d === 'tab') return '\t'
  if (d === 'semicolon') return ';'
  return ','
}

export function jsonToCsv(input: string, opts: ToolOptions): TextConvertResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { output: '', outputMime: 'text/csv', outputFilename: 'output.csv', errorMessage: 'Input is empty' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch (e) {
    return {
      output: '',
      outputMime: 'text/csv',
      outputFilename: 'output.csv',
      errorMessage: `JSON parse error: ${e instanceof SyntaxError ? e.message : String(e)}`,
    }
  }

  let rows: unknown[]
  if (Array.isArray(parsed)) {
    rows = parsed
  } else if (parsed !== null && typeof parsed === 'object') {
    rows = [parsed]
  } else {
    return { output: '', outputMime: 'text/csv', outputFilename: 'output.csv', errorMessage: 'Input must be a JSON array or object.' }
  }

  if (rows.length === 0) {
    return { output: '', outputMime: 'text/csv', outputFilename: 'output.csv', errorMessage: 'Array is empty.' }
  }

  const delimiter = getDelimiter(opts)
  const includeHeaders = (opts.includeHeaders as boolean) ?? true

  const flatRows = rows.map((row) => {
    if (row !== null && typeof row === 'object' && !Array.isArray(row)) {
      return flattenObject(row as Record<string, unknown>)
    }
    return { value: String(row ?? '') }
  })

  const headerSet = new Set<string>()
  for (const row of flatRows) {
    for (const key of Object.keys(row)) headerSet.add(key)
  }
  const headers = Array.from(headerSet)

  const csvLines: string[] = []
  if (includeHeaders) {
    csvLines.push(headers.map((h) => escapeField(h, delimiter)).join(delimiter))
  }
  for (const row of flatRows) {
    csvLines.push(headers.map((h) => escapeField(row[h] ?? '', delimiter)).join(delimiter))
  }

  const tablePreview: TablePreview = {
    headers,
    rows: flatRows.slice(0, 10).map((row) => headers.map((h) => row[h] ?? '')),
  }

  return {
    output: csvLines.join('\n'),
    outputMime: 'text/csv',
    outputFilename: 'output.csv',
    tablePreview,
  }
}
