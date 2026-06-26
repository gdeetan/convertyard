'use client'

import { useState, useCallback, useRef } from 'react'
import {
  GripVertical, X, Plus, Lock, Upload, RefreshCcw, Download,
  CheckCircle2, AlertCircle, ChevronDown,
} from 'lucide-react'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes, downloadFile } from '@/lib/utils/download'
import { mergePDFs, MergeSource } from '@/lib/converters/pdf'
import { getPageCount, renderPagePng } from '@/lib/converters/mupdf-client'
import { config } from '@/content/tools/merge-pdf'

interface PdfFileEntry {
  id: string
  file: File
  pageCount: number | null
  thumbnails: (string | null)[]
  pageOrder: number[]
  expanded: boolean
}

type Phase = 'idle' | 'merging' | 'done' | 'error'

export default function MergePdfPage() {
  const [entries, setEntries] = useState<PdfFileEntry[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ file: File; pageCount: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // File-level drag
  const dragFileIndex = useRef<number | null>(null)
  // Page-level drag
  const dragPageRef = useRef<{ fileIdx: number; fromPageOrderIdx: number } | null>(null)
  // Cancelled file tracking for in-progress thumbnail renders
  const cancelledFiles = useRef<Set<File>>(new Set())

  const handleAdd = useCallback(async (added: File[]) => {
    for (const file of added) {
      // Create initial entry with unknown page count
      const entry: PdfFileEntry = {
        id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`,
        file,
        pageCount: null,
        thumbnails: [],
        pageOrder: [],
        expanded: false,
      }
      setEntries(prev => [...prev, entry])

      // Load page count + render thumbnails in background
      try {
        const buffer = await file.arrayBuffer()
        const n = await getPageCount(buffer)

        if (cancelledFiles.current.has(file)) return

        setEntries(prev => prev.map(e =>
          e.file === file
            ? { ...e, pageCount: n, thumbnails: new Array(n).fill(null), pageOrder: Array.from({ length: n }, (_, i) => i) }
            : e
        ))

        // Render thumbnails sequentially
        for (let p = 0; p < n; p++) {
          if (cancelledFiles.current.has(file)) return
          try {
            const buf = await file.arrayBuffer()
            const png = await renderPagePng(buf, p, 72)
            if (cancelledFiles.current.has(file)) return
            const url = URL.createObjectURL(new Blob([png], { type: 'image/png' }))
            setEntries(prev => prev.map(e => {
              if (e.file !== file) return e
              const next = [...e.thumbnails]
              next[p] = url
              return { ...e, thumbnails: next }
            }))
          } catch {
            // Leave thumbnail as null (grey skeleton)
          }
        }
      } catch {
        // Leave pageCount as null — file row still appears
      }
    }
  }, [])

  const handleRemove = (idx: number) => {
    setEntries(prev => {
      const entry = prev[idx]
      // Mark as cancelled so background render stops
      cancelledFiles.current.add(entry.file)
      // Revoke all completed blob URLs
      for (const url of entry.thumbnails) {
        if (url) URL.revokeObjectURL(url)
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleReset = () => {
    setEntries(prev => {
      for (const entry of prev) {
        cancelledFiles.current.add(entry.file)
        for (const url of entry.thumbnails) {
          if (url) URL.revokeObjectURL(url)
        }
      }
      return []
    })
    queueMicrotask(() => { cancelledFiles.current = new Set() })
    setPhase('idle')
    setProgress(0)
    setResult(null)
    setErrorMsg('')
  }

  const toggleExpand = (idx: number) => {
    setEntries(prev => prev.map((e, i) =>
      i === idx ? { ...e, expanded: !e.expanded } : e
    ))
  }

  const excludePage = (fileIdx: number, pageOrderIdx: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== fileIdx) return e
      const next = [...e.pageOrder]
      next.splice(pageOrderIdx, 1)
      return { ...e, pageOrder: next }
    }))
  }

  const includePage = (fileIdx: number, pageIndex: number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== fileIdx) return e
      return { ...e, pageOrder: [...e.pageOrder, pageIndex] }
    }))
  }

  // File-level drag
  const onFileDragStart = (idx: number) => { dragFileIndex.current = idx }
  const onFileDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const from = dragFileIndex.current
    if (from === null || from === idx) return
    setEntries(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(idx, 0, moved)
      dragFileIndex.current = idx
      return next
    })
  }
  const onFileDragEnd = () => { dragFileIndex.current = null }

  // Page-level drag (within a file's pageOrder)
  const onPageDragStart = (fileIdx: number, fromPageOrderIdx: number) => {
    dragPageRef.current = { fileIdx, fromPageOrderIdx }
  }
  const onPageDragOver = (e: React.DragEvent, fileIdx: number, toPageOrderIdx: number) => {
    e.preventDefault()
    const drag = dragPageRef.current
    if (!drag || drag.fileIdx !== fileIdx || drag.fromPageOrderIdx === toPageOrderIdx) return
    dragPageRef.current = { fileIdx, fromPageOrderIdx: toPageOrderIdx }
    setEntries(prev => prev.map((entry, i) => {
      if (i !== fileIdx) return entry
      const next = [...entry.pageOrder]
      const [moved] = next.splice(drag.fromPageOrderIdx, 1)
      next.splice(toPageOrderIdx, 0, moved)
      return { ...entry, pageOrder: next }
    }))
  }
  const onPageDragEnd = () => { dragPageRef.current = null }

  const handleMerge = async () => {
    const totalIncluded = entries.reduce((s, e) => s + e.pageOrder.length, 0)
    if (totalIncluded === 0) return
    setPhase('merging')
    setProgress(0)
    try {
      const sources: MergeSource[] = entries.map(e => ({
        file: e.file,
        pageIndices: e.pageOrder,
      }))
      const results = await mergePDFs(sources, {}, (_, pct) => setProgress(pct))
      const merged = results[0]
      if (merged instanceof Error) throw merged
      if (!(merged instanceof File)) throw new Error('Merge failed')
      setResult({ file: merged, pageCount: totalIncluded })
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Merge failed')
      setPhase('error')
    }
  }

  const totalPages = entries.reduce((s, e) => s + (e.pageCount ?? 0), 0)
  const includedPages = entries.reduce((s, e) => s + e.pageOrder.length, 0)
  const totalBytes = entries.reduce((s, e) => s + e.file.size, 0)

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
        {phase === 'idle' && entries.length === 0 && (
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={handleAdd}
          />
        )}

        {/* Idle: files queued */}
        {phase === 'idle' && entries.length > 0 && (
          <div className="space-y-4">
            {/* File list */}
            <ul className="space-y-1.5" aria-label="Files to merge">
              {entries.map((entry, fileIdx) => (
                <li key={entry.id}>
                  {/* File row */}
                  <div
                    draggable
                    onDragStart={() => onFileDragStart(fileIdx)}
                    onDragOver={(e) => onFileDragOver(e, fileIdx)}
                    onDragEnd={onFileDragEnd}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5',
                      'cursor-grab active:cursor-grabbing select-none',
                      'hover:border-primary/40 transition-colors',
                      entry.expanded && 'rounded-b-none border-b-0'
                    )}
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{entry.file.name}</span>
                    {/* Page count badge */}
                    <span className="shrink-0 text-xs text-fg-subtle">
                      {entry.pageCount === null ? '…' : `${entry.pageCount} page${entry.pageCount === 1 ? '' : 's'}`}
                    </span>
                    <span className="shrink-0 text-xs text-fg-subtle">{formatBytes(entry.file.size)}</span>
                    {/* Expand chevron */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(fileIdx)}
                      aria-label={entry.expanded ? 'Collapse pages' : 'Expand pages'}
                      className={cn(
                        'shrink-0 rounded p-0.5 text-fg-subtle transition-all',
                        'hover:text-fg hover:bg-bg-muted',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                      )}
                    >
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', entry.expanded && 'rotate-180')} />
                    </button>
                    {/* Remove file */}
                    <button
                      type="button"
                      onClick={() => handleRemove(fileIdx)}
                      aria-label={`Remove ${entry.file.name}`}
                      className={cn(
                        'shrink-0 rounded p-0.5 text-fg-subtle transition-colors',
                        'hover:text-error hover:bg-bg-muted',
                        'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                      )}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Expanded page grid */}
                  {entry.expanded && (
                    <div className="rounded-b-lg border border-t-0 border-border bg-bg-muted p-3">
                      {entry.pageCount === null ? (
                        <p className="text-xs text-fg-subtle py-2 text-center">Loading pages…</p>
                      ) : entry.pageCount === 0 ? (
                        <p className="text-xs text-fg-subtle py-2 text-center">No pages in this file.</p>
                      ) : (
                        <>
                          {/* Included pages */}
                          {entry.pageOrder.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              {entry.pageOrder.map((pageIndex, orderIdx) => (
                                <div
                                  key={`${fileIdx}-${pageIndex}-included`}
                                  draggable
                                  onDragStart={() => onPageDragStart(fileIdx, orderIdx)}
                                  onDragOver={(e) => onPageDragOver(e, fileIdx, orderIdx)}
                                  onDragEnd={onPageDragEnd}
                                  className="relative cursor-grab active:cursor-grabbing"
                                >
                                  <div className="relative overflow-hidden rounded border border-border bg-bg aspect-[3/4]">
                                    {entry.thumbnails[pageIndex] ? (
                                      <img
                                        src={entry.thumbnails[pageIndex]!}
                                        alt={`Page ${pageIndex + 1}`}
                                        className="h-full w-full object-contain"
                                        draggable={false}
                                      />
                                    ) : (
                                      <div className="h-full w-full animate-pulse bg-bg-muted" />
                                    )}
                                  </div>
                                  <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-[10px] leading-4 text-white">
                                    {pageIndex + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => excludePage(fileIdx, orderIdx)}
                                    aria-label={`Exclude page ${pageIndex + 1}`}
                                    className={cn(
                                      'absolute top-1 right-1 rounded-full bg-black/60 p-0.5',
                                      'text-white hover:bg-error transition-colors'
                                    )}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Excluded pages */}
                          {(() => {
                            const excluded = Array.from({ length: entry.pageCount }, (_, i) => i)
                              .filter(i => !entry.pageOrder.includes(i))
                            if (excluded.length === 0) return null
                            return (
                              <>
                                <p className="text-[10px] text-fg-subtle mb-1.5">Excluded</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {excluded.map(pageIndex => (
                                    <div key={`${fileIdx}-${pageIndex}-excluded`} className="relative">
                                      <div className="relative overflow-hidden rounded border border-border bg-bg aspect-[3/4] opacity-30">
                                        {entry.thumbnails[pageIndex] ? (
                                          <img
                                            src={entry.thumbnails[pageIndex]!}
                                            alt={`Page ${pageIndex + 1} (excluded)`}
                                            className="h-full w-full object-contain"
                                            draggable={false}
                                          />
                                        ) : (
                                          <div className="h-full w-full bg-bg-muted" />
                                        )}
                                      </div>
                                      <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-[10px] leading-4 text-white">
                                        {pageIndex + 1}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => includePage(fileIdx, pageIndex)}
                                        aria-label={`Re-include page ${pageIndex + 1}`}
                                        className={cn(
                                          'absolute top-1 right-1 rounded-full bg-black/60 p-0.5',
                                          'text-white hover:bg-green-500 transition-colors'
                                        )}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )
                          })()}
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Add more */}
            <Dropzone
              accepts={config.accepts}
              acceptsExt={config.acceptsExt}
              onAdd={handleAdd}
              compact
              fileCount={entries.length}
              totalBytes={totalBytes}
            />

            {/* Footer bar */}
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex items-center gap-3">
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
                <span className="text-xs text-fg-subtle">
                  {entries.length} file{entries.length === 1 ? '' : 's'} · {includedPages} of {totalPages} page{totalPages === 1 ? '' : 's'} selected
                </span>
              </div>
              <button
                type="button"
                onClick={handleMerge}
                disabled={includedPages === 0}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Merge {includedPages} page{includedPages === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        )}

        {/* Merging */}
        {phase === 'merging' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-fg">Merging {includedPages} pages…</p>
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
                <p className="truncate text-sm font-medium text-fg">{result.file.name}</p>
                <p className="text-xs text-fg-subtle">
                  {result.pageCount} page{result.pageCount === 1 ? '' : 's'} · {formatBytes(result.file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadFile(result.file)}
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
            { n: '2', label: 'Set the order', desc: 'Drag files to set their order. Expand any file to reorder or exclude individual pages.' },
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
