import { loadTransformersModel, generateAltText } from './transformers-client'

export interface AltTextResult {
  filename: string
  altText: string
}

// maxLength → approximate token count (English: ~4 chars/token)
const LENGTH_TOKENS: Record<string, number> = {
  short: 20,
  medium: 45,
  detailed: 100,
}

export async function generateAltTextBatch(
  files: File[],
  lengthPreset: string,
  contextHint: string,
  onModelProgress: (pct: number) => void,
  onFileProgress: (fileIndex: number, pct: number) => void
): Promise<Array<AltTextResult | Error>> {
  const maxTokens = LENGTH_TOKENS[lengthPreset] ?? LENGTH_TOKENS.medium

  await loadTransformersModel('alt-text', onModelProgress)
  // Signal 100% even if model was already cached (progress callback may not fire)
  onModelProgress(100)

  const results: Array<AltTextResult | Error> = []

  for (let i = 0; i < files.length; i++) {
    try {
      const text = await generateAltText(files[i], maxTokens, contextHint || undefined, (pct) => onFileProgress(i, pct))
      results.push({ filename: files[i].name, altText: text })
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

export function resultsToCSV(results: Array<AltTextResult | Error>): string {
  const rows = [['filename', 'alt_text']]
  for (const r of results) {
    if (r instanceof Error) {
      rows.push(['(error)', r.message])
    } else {
      const escaped = r.altText.replace(/"/g, '""')
      rows.push([r.filename, `"${escaped}"`])
    }
  }
  return rows.map((r) => r.join(',')).join('\n')
}
