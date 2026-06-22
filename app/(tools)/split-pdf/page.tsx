'use client'

import { useState, useCallback, useRef } from 'react'
import { FileText, X, Lock, RefreshCcw, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes, downloadFile } from '@/lib/utils/download'
import { downloadAsZip } from '@/lib/utils/zip'
import { splitPdf } from '@/lib/converters/pdf'
import { getPageCount } from '@/lib/converters/mupdf-client'
import { config } from '@/content/tools/split-pdf'

type Phase = 'idle' | 'counting' | 'ready' | 'converting' | 'done' | 'error'
type SplitMode = 'each-page' | 'every-n' | 'page-range'

export default function SplitPdfPage() {
  const [files, setFiles] = useState<File[]>([])
  const [pageCounts, setPageCounts] = useState<Map<string, number>>(new Map())
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<File[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [splitMode, setSplitMode] = useState<SplitMode>('each-page')
  const [everyN, setEveryN] = useState(2)
  const [pageFrom, setPageFrom] = useState(1)
  const [pageTo, setPageTo] = useState(9999)
  // Symbol token: each new detectPageCounts call supersedes the previous one
  const countingTokenRef = useRef<symbol | null>(null)

  const detectPageCounts = useCallback(async (fileList: File[]) => {
    if (fileList.length === 0) return
    const token = Symbol()
    countingTokenRef.current = token
    setPhase('counting')
    const counts = new Map<string, number>()
    for (const f of fileList) {
      if (countingTokenRef.current !== token) return // superseded by newer call
      try {
        const buf = await f.arrayBuffer()
        counts.set(f.name, await getPageCount(buf))
      } catch {
        counts.set(f.name, 0)
      }
    }
    if (countingTokenRef.current !== token) return // superseded
    setPageCounts(counts)
    setPhase('ready')
  }, [])

  const handleAdd = useCallback((added: File[]) => {
    setFiles((prev) => {
      const next = [...prev, ...added]
      // Schedule async call outside the synchronous updater cycle
      setTimeout(() => detectPageCounts(next), 0)
      return next
    })
  }, [detectPageCounts])

  const handleRemove = (index: number) => {
    setFiles((prev) => {
      const removedName = prev[index]?.name
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) {
        setPhase('idle')
        setPageCounts(new Map())
      } else {
        if (removedName) {
          setPageCounts((prevCounts) => {
            const updated = new Map(prevCounts)
            updated.delete(removedName)
            return updated
          })
        }
        setTimeout(() => detectPageCounts(next), 0)
      }
      return next
    })
  }

  const handleReset = () => {
    setFiles([])
    setPageCounts(new Map())
    setPhase('idle')
    setProgress(0)
    setResults([])
    setErrorMsg('')
    setSplitMode('each-page')
    setEveryN(2)
    setPageFrom(1)
    setPageTo(9999)
  }

  const handleConvert = async () => {
    if (files.length === 0) return
    setPhase('converting')
    setProgress(0)
    try {
      const rawResults = await splitPdf(
        files,
        { splitMode, everyN, pageFrom, pageTo },
        (_idx, pct) => setProgress(pct)
      )
      const fileResults = rawResults.filter((r): r is File => r instanceof File)
      if (fileResults.length === 0) throw new Error('No output files produced')
      setResults(fileResults)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Split failed')
      setPhase('error')
    }
  }

  const handleDownloadAll = useCallback(async () => {
    await downloadAsZip(results, 'split-output.zip')
  }, [results])

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

        {phase === 'idle' && (
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={handleAdd}
          />
        )}

        {phase === 'counting' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
            <p className="text-sm text-fg-muted">Reading page counts…</p>
          </div>
        )}

        {phase === 'ready' && files.length > 0 && (
          <div className="space-y-5">
            {/* File list with page counts */}
            <ul className="space-y-1.5" aria-label="PDFs to split">
              {files.map((file, idx) => {
                const count = pageCounts.get(file.name)
                return (
                  <li
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{file.name}</span>
                    {count != null && count > 0 && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {count} {count === 1 ? 'page' : 'pages'}
                      </span>
                    )}
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
                )
              })}
            </ul>

            {/* Split mode */}
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-fg">Split mode</legend>
              <div className="flex flex-col gap-1.5">
                {([
                  { value: 'each-page',  label: 'One file per page' },
                  { value: 'every-n',    label: 'Every N pages' },
                  { value: 'page-range', label: 'Extract page range' },
                ] as const).map((opt) => (
                  <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="splitMode"
                      value={opt.value}
                      checked={splitMode === opt.value}
                      onChange={() => setSplitMode(opt.value)}
                      className="text-primary accent-primary"
                    />
                    <span className="text-sm text-fg">{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Conditional sub-options */}
            {splitMode === 'every-n' && (
              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-fg">Pages per chunk</legend>
                <input
                  type="number"
                  min={1}
                  value={everyN}
                  onChange={(e) => setEveryN(Math.max(1, Number(e.target.value)))}
                  className={cn(
                    'w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm text-fg',
                    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                  )}
                />
                <p className="mt-1 text-xs text-fg-subtle">Split the PDF into chunks of this many pages.</p>
              </fieldset>
            )}

            {splitMode === 'page-range' && (
              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-fg">Page range</legend>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-sm text-fg">
                    From
                    <input
                      type="number"
                      min={1}
                      value={pageFrom}
                      onChange={(e) => setPageFrom(Math.max(1, Number(e.target.value)))}
                      className={cn(
                        'w-20 rounded-lg border border-border bg-bg px-2 py-1 text-sm text-fg',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                      )}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-fg">
                    To
                    <input
                      type="number"
                      min={1}
                      value={pageTo === 9999 ? '' : pageTo}
                      placeholder="end"
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '') { setPageTo(9999); return }
                        const n = Number(v)
                        if (!isNaN(n)) setPageTo(Math.max(1, n))
                      }}
                      className={cn(
                        'w-20 rounded-lg border border-border bg-bg px-2 py-1 text-sm text-fg',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                      )}
                    />
                  </label>
                </div>
              </fieldset>
            )}

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
              <button type="button" onClick={handleReset}
                className={cn('text-sm text-fg-muted hover:text-fg transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded')}>
                Clear all
              </button>
              <button type="button" onClick={handleConvert}
                className={cn('flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary')}>
                Split {files.length} PDF{files.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {phase === 'converting' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-fg">Splitting {files.length} PDF{files.length > 1 ? 's' : ''}…</p>
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

        {phase === 'done' && results.length > 0 && (
          <div className="space-y-5">
            {results.length > 1 && (
              <button type="button" onClick={handleDownloadAll}
                className={cn('w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary')}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download all {results.length} files as ZIP
              </button>
            )}
            <ul className="space-y-2">
              {results.map((result, idx) => (
                <li key={idx} className="flex items-start gap-4 rounded-xl border border-border bg-bg px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{result.name}</p>
                    <p className="text-xs text-fg-subtle">{formatBytes(result.size)}</p>
                  </div>
                  <button type="button" onClick={() => downloadFile(result)}
                    className={cn('flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2',
                      'bg-primary text-primary-fg text-sm font-semibold',
                      'transition-colors hover:bg-primary-hover',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary')}>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-4">
              <button type="button" onClick={handleReset}
                className={cn('flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded')}>
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Split more PDFs
              </button>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-error/40 bg-bg px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-fg">Split failed</p>
                <p className="mt-0.5 text-xs text-fg-muted">{errorMsg}</p>
              </div>
            </div>
            <button type="button" onClick={handleReset}
              className={cn('flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded')}>
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Try again
            </button>
          </div>
        )}
      </div>

      {config.faq.length > 0 && (
        <section className="mt-12">
          <FAQAccordion items={config.faq} />
        </section>
      )}

      {config.relatedTools.length > 0 && (
        <section className="mt-12">
          <RelatedToolsStrip slugs={config.relatedTools} />
        </section>
      )}
    </div>
  )
}
