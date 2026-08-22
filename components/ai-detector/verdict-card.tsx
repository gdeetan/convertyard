'use client'
import { useEffect, useState } from 'react'
import type { AiDetectionResult, Verdict } from '@/lib/converters/ai-detector.types'
import { metadataImpliesAi } from '@/lib/converters/ai-detector-logic'
import { getClassifierStatus, subscribeClassifierStatus } from '@/lib/converters/ai-detector'
import { Sparkles, Camera, HelpCircle, AlertTriangle, Loader2 } from 'lucide-react'

const VERDICT_META: Record<Verdict, { label: string; tone: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }> }> = {
  'likely-ai':    { label: 'Likely AI-generated', tone: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900', icon: Sparkles },
  'likely-human': { label: 'Likely human-made',   tone: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900', icon: Camera },
  'inconclusive': { label: 'Inconclusive',        tone: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900', icon: HelpCircle },
  'error':        { label: 'Could not analyze',   tone: 'text-fg-muted bg-bg-muted border-border', icon: AlertTriangle },
}

export function VerdictCard({ result }: { result: AiDetectionResult }) {
  const [load, setLoad] = useState(getClassifierStatus)
  useEffect(() => subscribeClassifierStatus(setLoad), [])

  const analyzingPixels = !!result.classifierPending && !metadataImpliesAi(result.metadataSignatures)
  const pendingLabel =
    load.phase === 'downloading'
      ? (load.downloadPct > 0 ? `Downloading classifier… ${load.downloadPct}%` : 'Downloading classifier…')
      : load.phase === 'compiling'
        ? (load.device === 'webgpu' ? 'Compiling classifier (GPU)…' : 'Compiling classifier…')
        : 'Analyzing pixels…'
  const meta = analyzingPixels
    ? { label: pendingLabel, tone: 'text-fg bg-bg-muted border-border', icon: Loader2 }
    : VERDICT_META[result.verdict]
  const Icon = meta.icon
  const aiPct = result.aiProbability != null ? Math.round(result.aiProbability * 100) : null

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <aside>
        {result.thumbnailDataUrl ? (
          <img src={result.thumbnailDataUrl} alt="" className="w-full rounded border border-border" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded border border-dashed border-border text-xs text-fg-subtle">
            No preview
          </div>
        )}
        <dl className="mt-3 space-y-1 text-xs">
          <div><dt className="text-fg-subtle">File</dt><dd className="font-mono break-all text-fg">{result.fileName}</dd></div>
          <div><dt className="text-fg-subtle">Type</dt><dd className="text-fg">{result.mimeType || 'unknown'}</dd></div>
          <div><dt className="text-fg-subtle">Size</dt><dd className="text-fg">{formatBytes(result.fileSize)}</dd></div>
          {result.width && result.height && (
            <div><dt className="text-fg-subtle">Dimensions</dt><dd className="text-fg">{result.width} × {result.height}</dd></div>
          )}
        </dl>
      </aside>
      <div className="min-w-0 space-y-4">
        <div className={`rounded-lg border p-4 ${meta.tone}`}>
          <div className="flex items-start gap-3">
            <Icon className={`mt-0.5 h-5 w-5 shrink-0${analyzingPixels ? ' animate-spin' : ''}`} aria-hidden={true} />
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold">{meta.label}</div>
              {result.classifierPending && metadataImpliesAi(result.metadataSignatures) && (
                <div className="mt-1 text-sm">Generator tags found. Confirming with the pixel classifier…</div>
              )}
              {result.errorMessage && (
                <div className="mt-1 text-sm">{result.errorMessage}</div>
              )}
              {aiPct != null && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>Classifier confidence</span>
                    <span className="font-mono">{aiPct}% AI · {100 - aiPct}% human</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/50 dark:bg-black/30">
                    <div
                      className="h-full bg-current opacity-70"
                      style={{ width: `${aiPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <MetadataPanel result={result} />

        <p className="text-xs text-fg-subtle">
          Classifier accuracy is not perfect. Older or heavily edited AI images may pass as
          human; some photos with stylized processing may be flagged as AI. Use the metadata
          panel and human judgment for confirmation.
        </p>
      </div>
    </div>
  )
}

function MetadataPanel({ result }: { result: AiDetectionResult }) {
  if (result.metadataSignatures.length === 0) {
    return (
      <div className="rounded border border-border bg-bg-elevated p-3 text-sm">
        <div className="font-medium text-fg">Metadata signatures</div>
        <div className="mt-1 text-fg-muted">
          No AI-generation tags present in EXIF, XMP, or PNG chunks. Metadata can be stripped, so
          absence is not proof of human origin.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
      <div className="font-medium text-blue-900 dark:text-blue-100">Metadata says: {result.metadataSignatures.map(s => s.generator).join(', ')}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-blue-900/80 dark:text-blue-100/80">
        {result.metadataSignatures.map((s, i) => (
          <li key={i}>
            <span className="font-mono">{s.generator}</span>
            {s.detail && <>{' — '}<span>{s.detail.length > 120 ? `${s.detail.slice(0, 120)}…` : s.detail}</span></>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
