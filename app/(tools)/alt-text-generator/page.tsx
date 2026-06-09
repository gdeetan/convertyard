'use client'

import { useState, useCallback, useRef } from 'react'
import { Copy, Check, Download, Loader2, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { config } from '@/content/tools/alt-text-generator'
import type { AltTextResult } from '@/lib/converters/alt-text'

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'loading-model' | 'processing' | 'done'

interface FileEntry {
  file: File
  preview: string
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: number
  altText?: string
  error?: string
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button
      onClick={copy}
      aria-label="Copy alt text"
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
        copied
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-border bg-bg-elevated text-fg-muted hover:border-primary hover:text-primary'
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AltTextGeneratorPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [lengthPreset, setLengthPreset] = useState<'short' | 'medium' | 'detailed'>('medium')
  const processingRef = useRef(false)

  const updateEntry = useCallback((index: number, patch: Partial<FileEntry>) => {
    setEntries((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }, [])

  const handleAdd = useCallback((files: File[]) => {
    const newEntries: FileEntry[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }))
    setEntries((prev) => [...prev, ...newEntries])
  }, [])

  const handleGenerate = useCallback(async () => {
    if (processingRef.current || entries.length === 0) return
    processingRef.current = true

    const { generateAltTextBatch } = await import('@/lib/converters/alt-text')

    setPhase('loading-model')
    setModelProgress(0)

    try {
      const results = await generateAltTextBatch(
        entries.map((e) => e.file),
        lengthPreset,
        (pct) => {
          setModelProgress(pct)
          if (pct >= 100) setPhase('processing')
        },
        (fileIndex, pct) => {
          updateEntry(fileIndex, { status: 'processing', progress: pct })
        }
      )

      results.forEach((result, i) => {
        if (result instanceof Error) {
          updateEntry(i, { status: 'error', error: result.message, progress: 0 })
        } else {
          const r = result as AltTextResult
          updateEntry(i, { status: 'done', altText: r.altText, progress: 100 })
        }
      })
      setPhase('done')
    } catch (err) {
      console.error(err)
      setPhase('done')
    } finally {
      processingRef.current = false
    }
  }, [entries, lengthPreset, updateEntry])

  const handleReset = () => {
    entries.forEach((e) => URL.revokeObjectURL(e.preview))
    setEntries([])
    setPhase('idle')
    setModelProgress(0)
    processingRef.current = false
  }

  const handleDownloadCSV = () => {
    const doneEntries = entries.filter((e) => e.status === 'done' && e.altText)
    if (doneEntries.length === 0) return

    const rows = [['filename', 'alt_text']]
    for (const e of doneEntries) {
      const escaped = (e.altText ?? '').replace(/"/g, '""')
      rows.push([e.file.name, `"${escaped}"`])
    }
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'alt-text.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const isProcessing = phase === 'loading-model' || phase === 'processing'
  const doneCount = entries.filter((e) => e.status === 'done').length
  const hasResults = doneCount > 0

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'AI Tools', href: '/ai-tools' }, { label: config.title }]} />

      {/* Model download banner */}
      {phase === 'loading-model' && (
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary shrink-0" />
            <span className="flex-1">
              {modelProgress > 0
                ? `Downloading AI model… ${modelProgress}% (~400 MB, one-time)`
                : 'Loading AI model…'}
            </span>
            {modelProgress > 0 && (
              <span className="shrink-0 font-medium text-primary">{modelProgress}%</span>
            )}
          </div>
          {modelProgress > 0 && (
            <div className="h-1 rounded-full bg-bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${modelProgress}%` }}
                role="progressbar"
                aria-valuenow={modelProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {config.title}
        </h1>
        <p className="text-base text-fg-muted">{config.subtitle}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
          Performance depends on your device. Modern laptops process images in 2–8 seconds; older devices may take longer.
        </p>
      </header>

      {/* Drop zone — only shown before processing starts */}
      {phase === 'idle' && (
        <div className="mb-6">
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={handleAdd}
            fileCount={entries.length}
            compact={entries.length > 0}
          />
        </div>
      )}

      {/* Queued files (idle, not yet started) */}
      {phase === 'idle' && entries.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-fg">{entries.length} image{entries.length !== 1 ? 's' : ''} ready</span>
            <button onClick={handleReset} className="text-fg-muted hover:text-error transition-colors text-xs">
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {entries.map((e, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg border border-border bg-bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.preview} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      {(phase === 'idle') && (
        <div className="mb-6 rounded-xl border border-border bg-bg-elevated p-4">
          <p className="mb-3 text-sm font-medium text-fg">Alt text length</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: 'short', label: 'Short', hint: '~50 chars' },
                { value: 'medium', label: 'Medium', hint: '~100 chars' },
                { value: 'detailed', label: 'Detailed', hint: '~200 chars' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLengthPreset(opt.value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                  lengthPreset === opt.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border bg-bg-muted text-fg-muted hover:border-primary hover:text-primary'
                )}
              >
                {opt.label}
                <span className="text-xs opacity-60">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      {phase === 'idle' && (
        <button
          onClick={handleGenerate}
          disabled={entries.length === 0}
          className={cn(
            'mb-8 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all',
            entries.length === 0
              ? 'bg-bg-muted text-fg-subtle cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
          )}
        >
          Generate alt text
        </button>
      )}

      {/* Processing view */}
      {(phase === 'loading-model' || phase === 'processing' || phase === 'done') && entries.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fg">
              {phase === 'done'
                ? `${doneCount} of ${entries.length} completed`
                : phase === 'processing'
                ? 'Generating alt text…'
                : 'Waiting for model…'}
            </p>
            {phase === 'done' && (
              <button onClick={handleReset} className="text-xs text-fg-muted hover:text-primary transition-colors">
                Start over
              </button>
            )}
          </div>

          {/* Per-file rows */}
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {entries.map((entry, i) => (
              <div key={i} className="bg-bg-elevated">
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Thumbnail */}
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.preview} alt="" className="h-full w-full object-cover" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs text-fg-muted mb-1">{entry.file.name}</p>

                    {entry.status === 'pending' && (
                      <p className="text-xs text-fg-subtle">Waiting…</p>
                    )}

                    {entry.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                        <div className="flex-1 h-1 rounded-full bg-bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${entry.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {entry.status === 'done' && entry.altText && (
                      <div className="flex items-start gap-2">
                        <p className="flex-1 text-sm text-fg leading-snug">{entry.altText}</p>
                        <CopyButton text={entry.altText} />
                      </div>
                    )}

                    {entry.status === 'error' && (
                      <p className="text-xs text-error">{entry.error ?? 'Processing failed'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Download CSV */}
          {hasResults && (
            <button
              onClick={handleDownloadCSV}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CSV ({doneCount} result{doneCount !== 1 ? 's' : ''})
            </button>
          )}

          {isProcessing && (
            <p className="text-center text-xs text-fg-subtle">
              Leave this tab open — closing it will stop processing.
            </p>
          )}
        </div>
      )}

      {/* FAQ */}
      <div className="mb-12">
        <FAQAccordion items={config.faq} pageUrl={`https://convertyard.com/${config.slug}`} />
      </div>

      {/* Related tools */}
      <RelatedToolsStrip slugs={config.relatedTools} />
    </div>
  )
}
