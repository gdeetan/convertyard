'use client'

import { useState, useCallback, useRef } from 'react'
import { Copy, Check, Download, Pencil, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { config } from '@/content/tools/image-description'
import type { DescriptionLength } from '@/lib/converters/image-description'

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'loading-model' | 'processing' | 'done'

interface FileEntry {
  file: File
  preview: string      // object URL — created on drop, revoked on next drop
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: number
  description: string  // editable by user
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
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all',
        copied
          ? 'bg-success/10 text-success'
          : 'border border-border text-fg-muted hover:border-primary hover:text-primary'
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ImageDescriptionPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [length, setLength] = useState<DescriptionLength>('standard')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const processingRef = useRef(false)
  const pendingProgress = useRef<Map<number, number>>(new Map())
  const rafPending = useRef(false)

  // ── RAF-batched progress flush ─────────────────────────────────────────────

  const flushProgress = useCallback(() => {
    rafPending.current = false
    setEntries((prev) => {
      const next = [...prev]
      pendingProgress.current.forEach((pct, i) => {
        if (next[i]) next[i] = { ...next[i], progress: pct }
      })
      pendingProgress.current.clear()
      return next
    })
  }, [])

  const onFileProgress = useCallback(
    (i: number, pct: number) => {
      pendingProgress.current.set(i, pct)
      if (!rafPending.current) {
        rafPending.current = true
        requestAnimationFrame(flushProgress)
      }
    },
    [flushProgress]
  )

  const updateEntry = useCallback((index: number, patch: Partial<FileEntry>) => {
    setEntries((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }, [])

  // ── Drop handler ───────────────────────────────────────────────────────────

  const handleAdd = useCallback((files: File[]) => {
    // Revoke old object URLs before replacing
    setEntries((prev) => {
      prev.forEach((e) => URL.revokeObjectURL(e.preview))
      const newEntries: FileEntry[] = files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
        description: '',
      }))
      return newEntries
    })
    setPhase('idle')
    setEditingIndex(null)
    processingRef.current = false
  }, [])

  // ── Generate ───────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (processingRef.current || entries.length === 0) return
    processingRef.current = true

    // Capture file list BEFORE any awaits (avoids stale closure if files drop during 50ms gap)
    const filesToProcess = entries.map(e => e.file)

    setEditingIndex(null)
    setPhase('loading-model')
    setModelProgress(0)
    await new Promise<void>((resolve) => setTimeout(resolve, 50)) // let banner render

    const { generateDescriptionBatch } = await import('@/lib/converters/image-description')

    // Reset all entries to pending
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        status: 'pending' as const,
        progress: 0,
        description: '',
        error: undefined,
      }))
    )

    setPhase('processing')

    try {
      const results = await generateDescriptionBatch(
        filesToProcess,
        length,
        (pct) => {
          setModelProgress(pct)
        },
        (fileIndex, pct) => {
          onFileProgress(fileIndex, pct)
          updateEntry(fileIndex, { status: 'processing' })
        }
      )

      // Update all entries at once after batch completes
      setEntries((prev) => {
        const next = [...prev]
        results.forEach((result, i) => {
          if (next[i]) {
            if (result.error) {
              next[i] = {
                ...next[i],
                status: 'error',
                error: result.error,
                progress: 0,
                description: '',
              }
            } else {
              next[i] = {
                ...next[i],
                status: 'done',
                description: result.description,
                progress: 100,
              }
            }
          }
        })
        return next
      })

      setPhase('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[image-description] processing failed:', err)
      setEntries((prev) =>
        prev.map((e) =>
          e.status === 'pending' || e.status === 'processing'
            ? { ...e, status: 'error', error: msg }
            : e
        )
      )
      setPhase('done')
    } finally {
      processingRef.current = false
    }
  }, [entries, length, onFileProgress, updateEntry])

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = () => {
    entries.forEach((e) => URL.revokeObjectURL(e.preview))
    setEntries([])
    setPhase('idle')
    setModelProgress(0)
    setEditingIndex(null)
    processingRef.current = false
  }

  // ── CSV export ─────────────────────────────────────────────────────────────

  const handleExportCSV = async () => {
    const { resultsToCSV } = await import('@/lib/converters/image-description')
    const csv = resultsToCSV(
      entries.map((e) => ({
        filename: e.file.name,
        description: e.description,
        error: e.error,
      }))
    )
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'image-descriptions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const isProcessing = phase === 'loading-model' || phase === 'processing'
  const doneCount = entries.filter((e) => e.status === 'done').length
  const hasFiles = entries.length > 0

  const LENGTH_OPTIONS: { value: DescriptionLength; label: string; hint: string }[] = [
    { value: 'brief', label: 'Brief', hint: '~1 sentence' },
    { value: 'standard', label: 'Standard', hint: '~2 sentences' },
    { value: 'detailed', label: 'Detailed', hint: '~3 sentences' },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'AI Tools', href: '/ai-tools' },
          { label: config.title },
        ]}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-fg sm:text-3xl">{config.title}</h1>
        <p className="text-sm text-fg-muted">{config.subtitle}</p>
      </div>

      {/* Length selector — shown in idle phase only */}
      {phase === 'idle' && (
        <div className="mb-6 rounded-xl border border-border bg-bg-elevated p-4">
          <p className="mb-3 text-sm font-medium text-fg">Description length</p>
          <div className="flex flex-wrap gap-2">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLength(opt.value)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                  length === opt.value
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

      {/* Model download banner — loading-model phase only */}
      {phase === 'loading-model' && (
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary shrink-0" />
            <span className="flex-1">
              {modelProgress > 0
                ? `Downloading AI model… ${modelProgress}% (~260 MB, one-time)`
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
              />
            </div>
          )}
        </div>
      )}

      {/* Dropzone — idle phase */}
      {phase === 'idle' && (
        <div className="mb-6">
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt ?? []}
            onAdd={handleAdd}
            fileCount={entries.length}
            compact={hasFiles}
          />
        </div>
      )}

      {/* Results list — shown when files exist */}
      {hasFiles && (
        <div className="mb-6">
          {/* CSV export header bar — shown when done */}
          {phase === 'done' && doneCount > 0 && (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-success/30 bg-success/5 px-4 py-3">
              <span className="text-sm font-medium text-success">
                {doneCount} description{doneCount !== 1 ? 's' : ''} ready
              </span>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-sm font-semibold text-success hover:bg-success/20 transition-all"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </button>
            </div>
          )}

          {/* File rows */}
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {entries.map((entry, i) => (
              <div key={entry.file.name + i} className="flex gap-3 bg-bg-elevated p-3">
                {/* Thumbnail */}
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {/* Filename */}
                  <p className="truncate text-sm font-medium text-fg">{entry.file.name}</p>

                  {/* Progress bar — processing */}
                  {(entry.status === 'pending' || entry.status === 'processing') && (
                    <div className="mt-1">
                      <div
                        className="h-1.5 rounded-full bg-bg-muted overflow-hidden"
                        role="progressbar"
                        aria-valuenow={entry.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            entry.status === 'processing' ? 'bg-primary' : 'bg-bg-muted'
                          )}
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                      {entry.status === 'processing' && (
                        <p className="mt-1 text-xs text-fg-subtle">
                          {entry.progress > 0 ? `${entry.progress}%` : 'Starting…'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Done: description display / inline edit */}
                  {entry.status === 'done' && (
                    <div className="flex flex-col gap-1.5">
                      {editingIndex === i ? (
                        <textarea
                          className="w-full rounded-lg border border-primary bg-bg-muted px-3 py-2 text-sm text-fg leading-snug focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          rows={3}
                          value={entry.description}
                          onChange={(e) => updateEntry(i, { description: e.target.value })}
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-fg leading-snug">
                          {entry.description || <span className="text-fg-subtle italic">No description generated.</span>}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                          className={cn(
                            'flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all border',
                            editingIndex === i
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-fg-muted hover:border-primary hover:text-primary'
                          )}
                        >
                          {editingIndex === i ? (
                            <>
                              <CheckCheck className="h-3.5 w-3.5" />
                              Done
                            </>
                          ) : (
                            <>
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </>
                          )}
                        </button>
                        {entry.description && <CopyButton text={entry.description} />}
                      </div>
                    </div>
                  )}

                  {/* Error state */}
                  {entry.status === 'error' && (
                    <p className="text-xs text-error">
                      Error: {entry.error ?? 'Unknown error'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action area */}
      {(phase === 'idle' || phase === 'processing' || phase === 'loading-model') && (
        <div className="mb-6 space-y-3">
          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || entries.length === 0}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all',
              isProcessing || entries.length === 0
                ? 'cursor-not-allowed bg-bg-muted text-fg-subtle'
                : 'bg-primary text-white hover:bg-primary/90'
            )}
          >
            {isProcessing
              ? 'Generating descriptions…'
              : `Generate descriptions for ${entries.length} image${entries.length !== 1 ? 's' : ''}`}
          </button>

          {/* Trust signal */}
          <p className="text-center text-xs text-fg-subtle">
            Images stay on your device.{' '}
            <span className="text-fg-muted">Verify in DevTools → Network.</span>
          </p>
        </div>
      )}

      {/* Done actions */}
      {phase === 'done' && (
        <div className="mb-6 space-y-3">
          {doneCount > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV ({doneCount} description{doneCount !== 1 ? 's' : ''})
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-fg-muted hover:border-primary hover:text-primary transition-all"
          >
            Start over
          </button>
          <p className="text-center text-xs text-fg-subtle">
            Images stay on your device.{' '}
            <span className="text-fg-muted">Verify in DevTools → Network.</span>
          </p>
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
