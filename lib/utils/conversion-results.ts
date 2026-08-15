import type { ConversionResult, FileStatus } from '@/lib/types'

export type ResultRowPresentation = 'success' | 'error' | 'pending'

export function resultRowPresentation(entry: {
  status: FileStatus
  result?: File
  progress?: number
  error?: string
}): ResultRowPresentation {
  if (entry.status === 'done' && entry.result) return 'success'
  if (entry.status === 'error') return 'error'
  return 'pending'
}

/**
 * convertFn may stream via onResult, return an array, or both.
 * The return value is always authoritative for the files it includes.
 */
export function returnedResultsToDispatch(
  results: Array<ConversionResult | null | undefined>
): Array<{ fileIndex: number; result: ConversionResult }> {
  const out: Array<{ fileIndex: number; result: ConversionResult }> = []
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result != null) out.push({ fileIndex: i, result })
  }
  return out
}
