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
import { deletePages } from '@/lib/converters/pdf'
import { getPageCount } from '@/lib/converters/mupdf-client'
import { config } from '@/content/tools/delete-pages'

type Phase = 'idle' | 'counting' | 'ready' | 'converting' | 'done' | 'error'

export default function DeletePagesPage() {
  const [files, setFiles] = useState<File[]>([])
  const [pageCounts, setPageCounts] = useState<Map<string, number>>(new Map())
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<File[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [pageRange, setPageRange] = useState('')
  const countingTokenRef = useRef<symbol | null>(null)

  const detectPageCounts = useCallback(async (fileList: File[]) => {
    if (fileList.length === 0) return
    const token = Symbol()
    countingTokenRef.current = token
    setPhase('counting')
    const counts = new Map<string, number>()
    for (const f of fileList) {
      if (countingTokenRef.current !== token) return
      try {
        const buf = await f.arrayBuffer()
        counts.set(f.name, await getPageCount(buf))
      } catch {
        counts.set(f.name, 0)
      }
    }
    if (countingTokenRef.current !== token) return
    setPageCounts(counts)
    setPhase('ready')
  }, [])

  const handleAdd = useCallback((added: File[]) => {
    setFiles((prev) => {
      const next = [...prev, ...added]
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
    setPageRange('')
  }

  const handleConvert = async () => {
    if (files.length === 0) return
    const range = pageRange.trim()
    if (!range) {
      setErrorMsg('Enter the page numbers you want to delete.')
      setPhase('error')
      return
    }
    setPhase('converting')
    setProgress(0)
    try {
      const rawResults = await deletePages(
        files,
        { pageRange: range },
        (_idx, pct) => setProgress(pct)
      )
      const fileResults = rawResults.filter((r): r is File => r instanceof File)
      if (fileResults.length === 0) throw new Error('No output files produced.')
      setResults(fileResults)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete pages.')
      setPhase('error')
    }
  }

  const handleDownloadAll = useCallback(async () => {
    await downloadAsZip(results, 'trimmed-pdfs.zip')
  }, [results])

  const totalBytes = files.reduce((s, f) => s + f.size, 0)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
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
            <ul className="space-y-1.5" aria-label="PDFs to process">
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

            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-fg">Pages to delete</legend>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="e.g. 1, 3, 5-8"
                aria-label="Page range to delete"
                className={cn(
                  'w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg',
                  'placeholder:text-fg-subtle',
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                )}
              />
              <p className="mt-1 text-xs text-fg-subtle">
                All other pages will be kept. Example: <span className="font-mono">1, 3, 5-8</span> deletes pages 1, 3, 5, 6, 7, and 8.
              </p>
            </fieldset>

            <Dropzone
              accepts={config.accepts}
              acceptsExt={config.acceptsExt}
              onAdd={handleAdd}
              compact
              fileCount={files.length}
              totalBytes={totalBytes}
            />

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
                Delete pages from {files.length} PDF{files.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {phase === 'converting' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-fg">Removing pages…</p>
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
                Process more PDFs
              </button>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-error/40 bg-bg px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-fg">Failed to delete pages</p>
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
