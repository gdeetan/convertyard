'use client'
import type { AiDetectionResult, Verdict } from '@/lib/converters/ai-detector.types'

const VERDICT_TONE: Record<Verdict, string> = {
  'likely-ai':    'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200',
  'likely-human': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
  'inconclusive': 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  'error':        'bg-bg-muted text-fg-muted',
}

const VERDICT_LABEL: Record<Verdict, string> = {
  'likely-ai': 'Likely AI',
  'likely-human': 'Likely human',
  'inconclusive': 'Inconclusive',
  'error': 'Error',
}

export function BatchTable({ results }: { results: AiDetectionResult[] }) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm">
        <thead className="bg-bg-muted text-xs text-fg-subtle">
          <tr>
            <th className="px-3 py-2 text-left font-medium">File</th>
            <th className="px-3 py-2 text-left font-medium">Verdict</th>
            <th className="px-3 py-2 text-right font-medium">AI %</th>
            <th className="px-3 py-2 text-left font-medium">Metadata hints</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className="border-t border-border">
              <td className="max-w-[240px] px-3 py-2">
                <div className="flex items-center gap-2">
                  {r.thumbnailDataUrl ? (
                    <img src={r.thumbnailDataUrl} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-8 w-8 shrink-0 rounded bg-bg-muted" />
                  )}
                  <span className="truncate font-mono text-xs">{r.fileName}</span>
                </div>
              </td>
              <td className="px-3 py-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.classifierPending && r.verdict !== 'likely-ai'
                    ? 'bg-bg-muted text-fg-muted'
                    : VERDICT_TONE[r.verdict]
                }`}>
                  {r.classifierPending && r.verdict !== 'likely-ai' ? 'Analyzing…' : VERDICT_LABEL[r.verdict]}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs">
                {r.aiProbability != null ? `${Math.round(r.aiProbability * 100)}%` : r.classifierPending ? '…' : '—'}
              </td>
              <td className="px-3 py-2 text-xs text-fg-muted">
                {r.metadataSignatures.length > 0
                  ? r.metadataSignatures.map(s => s.generator).join(', ')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
