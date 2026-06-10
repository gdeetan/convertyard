'use client'

import { useState, useCallback, useRef } from 'react'
import { GripVertical, X, Lock, Upload, RefreshCcw, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes, downloadFile } from '@/lib/utils/download'
import { mergePDFs } from '@/lib/converters/pdf'
import { config } from '@/content/tools/merge-pdf'

type Phase = 'idle' | 'merging' | 'done' | 'error'

export default function MergePdfPage() {
  const [files, setFiles] = useState<File[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const dragIndex = useRef<number | null>(null)

  const handleAdd = useCallback((added: File[]) => {
    setFiles((prev) => [...prev, ...added])
  }, [])

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setFiles([])
    setPhase('idle')
    setProgress(0)
    setResult(null)
    setErrorMsg('')
  }

  // HTML5 drag-to-reorder
  const onDragStart = (index: number) => {
    dragIndex.current = index
  }
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null || from === index) return
    setFiles((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(index, 0, moved)
      dragIndex.current = index
      return next
    })
  }
  const onDragEnd = () => {
    dragIndex.current = null
  }

  const handleMerge = async () => {
    if (files.length === 0) return
    setPhase('merging')
    setProgress(0)
    try {
      const results = await mergePDFs(files, {}, (_, pct) => setProgress(pct))
      const merged = results[0]
      if (merged instanceof Error) throw merged
      if (!(merged instanceof File)) throw new Error('Merge failed')
      setResult(merged)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Merge failed')
      setPhase('error')
    }
  }

  const totalBytes = files.reduce((s, f) => s + f.size, 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'PDF Tools', href: '/pdf' },
          { label: config.title },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {config.title}
        </h1>
        <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
          Files never leave your browser. No uploads. No accounts.
        </div>
      </div>

      {/* Tool card */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">

        {/* Idle: no files */}
        {phase === 'idle' && files.length === 0 && (
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={handleAdd}
          />
        )}

        {/* Idle: files queued */}
        {phase === 'idle' && files.length > 0 && (
          <div className="space-y-4">
            {/* Sortable file list */}
            <div>
              <p className="mb-2 text-xs text-fg-subtle">
                Drag rows to set merge order · Pages from the first file appear first
              </p>
              <ul className="space-y-1.5" aria-label="Files to merge">
                {files.map((file, idx) => (
                  <li
                    key={`${file.name}-${idx}`}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={(e) => onDragOver(e, idx)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5',
                      'cursor-grab active:cursor-grabbing select-none',
                      'hover:border-primary/40 transition-colors'
                    )}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{file.name}</span>
                    <span className="shrink-0 text-xs text-fg-subtle">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      aria-label={`Remove ${file.name}`}
                      className={cn(
                        'shrink-0 rounded p-0.5 text-fg-subtle transition-colors',
                        'hover:text-error hover:bg-bg-muted',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Add more */}
            <Dropzone
              accepts={config.accepts}
              acceptsExt={config.acceptsExt}
              onAdd={handleAdd}
              compact
              fileCount={files.length}
              totalBytes={totalBytes}
            />

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  'text-sm text-fg-muted hover:text-fg transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded'
                )}
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={handleMerge}
                disabled={files.length < 1}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Merge {files.length} file{files.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Merging */}
        {phase === 'merging' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-fg">Merging {files.length} PDFs…</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-200"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="text-xs text-fg-subtle">{progress}%</p>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && result && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 rounded-xl border border-border bg-bg px-4 py-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{result.name}</p>
                <p className="text-xs text-fg-subtle">{formatBytes(result.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => downloadFile(result)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                )}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </button>
            </div>
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  'flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded'
                )}
              >
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Merge more files
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-error/40 bg-bg px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-fg">Merge failed</p>
                <p className="mt-0.5 text-xs text-fg-muted">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className={cn(
                'flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded'
              )}
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}
      </div>

      {/* How it works */}
      <section className="mt-12" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-fg">
          How it works
        </h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
          {[
            { n: '1', label: 'Drop your PDFs', desc: 'Drag and drop or click to browse. Add as many PDFs as you need.' },
            { n: '2', label: 'Set the order', desc: 'Drag rows up or down to set the exact page order in the merged output.' },
            { n: '3', label: 'Click Merge', desc: 'All merging happens in your browser via WebAssembly — no server, no upload.' },
            { n: '4', label: 'Download', desc: 'Your merged PDF downloads as a single file immediately.' },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{step.label}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      {config.faq.length > 0 && (
        <section className="mt-12">
          <FAQAccordion items={config.faq} />
        </section>
      )}

      {/* Related tools */}
      {config.relatedTools.length > 0 && (
        <section className="mt-12">
          <RelatedToolsStrip slugs={config.relatedTools} />
        </section>
      )}
    </div>
  )
}
