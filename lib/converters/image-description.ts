import { loadTransformersModel, generateAltText } from './transformers-client'

export type DescriptionLength = 'brief' | 'standard' | 'detailed'

export interface DescriptionResult {
  filename: string
  description: string
  error?: string
}

// Token mapping for description length presets
// brief: <DETAILED_CAPTION> task, ~45 tokens
// standard: <MORE_DETAILED_CAPTION> task, shorter version, ~120 tokens
// detailed: <MORE_DETAILED_CAPTION> task, full version, ~200 tokens
const LENGTH_TOKENS: Record<DescriptionLength, number> = {
  brief: 45,
  standard: 120,
  detailed: 200,
}

export async function generateDescriptionBatch(
  files: File[],
  length: DescriptionLength,
  onModelProgress: (pct: number) => void,
  onFileProgress: (fileIndex: number, pct: number) => void
): Promise<DescriptionResult[]> {
  const maxTokens = LENGTH_TOKENS[length]

  await loadTransformersModel('alt-text', onModelProgress)
  // Signal 100% even if model was already cached (progress callback may not fire)
  onModelProgress(100)

  const results: DescriptionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const description = await generateAltText(
        files[i],
        maxTokens,
        undefined,
        files[i].name,
        (pct) => onFileProgress(i, pct)
      )
      results.push({ filename: files[i].name, description })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      results.push({
        filename: files[i].name,
        description: '',
        error: errorMessage,
      })
    }
  }

  return results
}

export function resultsToCSV(results: DescriptionResult[]): string {
  const escape = (s: string) => {
    // RFC 4180: quote if contains comma, quote, newline, or carriage return
    // Escape quotes by doubling them
    const escaped = s.replace(/"/g, '""')
    const needsQuotes =
      s.includes(',') ||
      s.includes('"') ||
      s.includes('\n') ||
      s.includes('\r')
    return needsQuotes ? `"${escaped}"` : s
  }

  const rows = [['filename', 'description']]

  for (const r of results) {
    let descriptionCell: string
    if (r.error) {
      descriptionCell = escape(`(error) ${r.error}`)
    } else {
      descriptionCell = escape(r.description)
    }
    rows.push([escape(r.filename), descriptionCell])
  }

  return rows.map((r) => r.join(',')).join('\n')
}
