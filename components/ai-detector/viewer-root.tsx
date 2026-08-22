'use client'
import type { AiDetectionResult } from '@/lib/converters/ai-detector.types'
import { VerdictCard } from './verdict-card'
import { BatchTable } from './batch-table'

export function AiDetectorRoot({ results }: { files: File[]; results: AiDetectionResult[]; exportActions: unknown[] }) {
  if (results.length === 0) {
    return (
      <div className="text-sm text-fg-subtle">
        Loading classifier and analyzing… First run downloads a ~130 MB model. It's cached
        after that.
      </div>
    )
  }

  if (results.length === 1) return <VerdictCard result={results[0]} />

  const total = results.length
  const ai = results.filter(r => r.verdict === 'likely-ai').length
  const human = results.filter(r => r.verdict === 'likely-human').length
  const inc = results.filter(r => r.verdict === 'inconclusive').length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Summary label="Files" value={total} />
        <Summary label="Likely AI" value={ai} tone="text-rose-700 dark:text-rose-300" />
        <Summary label="Likely human" value={human} tone="text-emerald-700 dark:text-emerald-300" />
        <Summary label="Inconclusive" value={inc} tone="text-amber-700 dark:text-amber-300" />
      </div>
      <BatchTable results={results} />
    </div>
  )
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded border border-border bg-bg-elevated px-3 py-2">
      <div className="text-xs text-fg-subtle">{label}</div>
      <div className={`text-lg font-semibold ${tone ?? 'text-fg'}`}>{value}</div>
    </div>
  )
}
