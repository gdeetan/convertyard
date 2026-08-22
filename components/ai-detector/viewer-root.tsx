'use client'
import { useEffect, useState } from 'react'
import type { AiDetectionResult } from '@/lib/converters/ai-detector.types'
import {
  getClassifierStatus,
  subscribeClassifierStatus,
  type ClassifierStatus,
} from '@/lib/converters/ai-detector'
import { VerdictCard } from './verdict-card'
import { BatchTable } from './batch-table'

function useClassifierStatus(): ClassifierStatus {
  const [s, setS] = useState(getClassifierStatus)
  useEffect(() => subscribeClassifierStatus(setS), [])
  return s
}

function statusLine(s: ClassifierStatus): string {
  if (s.phase === 'downloading') {
    return s.downloadPct > 0
      ? `Downloading classifier… ${s.downloadPct}%`
      : 'Downloading classifier…'
  }
  if (s.phase === 'compiling') {
    return s.device === 'webgpu' ? 'Compiling classifier (GPU)…' : 'Compiling classifier…'
  }
  if (s.phase === 'error') return s.error ? `Classifier failed: ${s.error}` : 'Classifier failed to load'
  if (s.phase === 'ready') return 'Analyzing pixels…'
  return 'Starting classifier…'
}

export function ClassifierLoadHint(_props: { onFiles: (files: File[]) => void; disabled: boolean }) {
  const s = useClassifierStatus()
  if (s.phase === 'idle' || s.phase === 'ready') return null
  return <p className="text-xs text-fg-subtle">{statusLine(s)}</p>
}

export function AiDetectorRoot({ results }: { files: File[]; results: AiDetectionResult[]; exportActions: unknown[] }) {
  const s = useClassifierStatus()

  if (results.length === 0) {
    return (
      <div className="text-sm text-fg-subtle">
        {statusLine(s)} First run downloads a ~90 MB model. It's cached after that.
      </div>
    )
  }

  if (results.length === 1) return <VerdictCard result={results[0]} />

  const total = results.length
  const pending = results.filter(r => r.classifierPending).length
  const ai = results.filter(r => r.verdict === 'likely-ai').length
  const human = results.filter(r => !r.classifierPending && r.verdict === 'likely-human').length
  const inc = results.filter(r => !r.classifierPending && r.verdict === 'inconclusive').length

  return (
    <div className="space-y-4">
      {pending > 0 && (
        <p className="text-xs text-fg-subtle">{statusLine(s)} {pending} of {total} still running.</p>
      )}
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
