'use client'

import { useState, useCallback, useRef } from 'react'
import { GripVertical, X, Lock, FileImage, RefreshCcw, Download, CheckCircle2, AlertCircle } from 'lucide-react'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes, downloadFile } from '@/lib/utils/download'
import { imagesToPdf } from '@/lib/converters/pdf'
import { config } from '@/content/tools/jpg-to-pdf'

type Phase = 'idle' | 'converting' | 'done' | 'error'
type PageSize = 'fit-to-image' | 'a4' | 'letter'
type OutputMode = 'all-in-one' | 'one-per-image'

export default function JpgToPdfPage() {
  const [files, setFiles] = useState<File[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<File[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [pageSize, setPageSize] = useState<PageSize>('fit-to-image')
  const [outputMode, setOutputMode] = useState<OutputMode>('all-in-one')
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto')
  const dragIndex = useRef<number | null>(null)
  const [thumbUrls, setThumbUrls] = useState<string[]>([])

  const addThumbs = useCallback((added: File[]) => {
    setThumbUrls(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
  }, [])

  const revokeAllThumbs = useCallback((urls: string[]) => {
    urls.forEach(u => URL.revokeObjectURL(u))
  }, [])

  const handleAdd = useCallback((added: File[]) => {
    setFiles((prev) => [...prev, ...added])
    addThumbs(added)
  }, [addThumbs])

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setThumbUrls((prev) => {
      const url = prev[index]
      if (url) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleReset = () => {
    revokeAllThumbs(thumbUrls)
    setThumbUrls([])
    setFiles([])
    setPhase('idle')
    setProgress(0)
    setResults([])
    setErrorMsg('')
    setOrientation('auto')
  }

  const onDragStart = (index: number) => { dragIndex.current = index }
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
    setThumbUrls((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(index, 0, moved)
      return next
    })
  }
  const onDragEnd = () => { dragIndex.current = null }

  const handleConvert = async () => {
    if (files.length === 0) return
    setPhase('converting')
    setProgress(0)
    try {
      const rawResults = await imagesToPdf(
        files,
        { pageSize, outputMode, orientation },
        (_, pct) => setProgress(pct)
      )
      const fileResults = rawResults.filter((r): r is File => r instanceof File)
      if (fileResults.length === 0) throw new Error('No output files produced')
      setResults(fileResults)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Conversion failed')
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
          <div className="space-y-5">
            {/* Sortable file list */}
            <div>
              <p className="mb-2 text-xs text-fg-subtle">
                Drag rows to set page order in the PDF
              </p>
              <ul className="space-y-1.5" aria-label="Images to convert">
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
                    {thumbUrls[idx]
                      ? <img src={thumbUrls[idx]} alt="" className="h-8 w-8 shrink-0 rounded object-cover border border-border" />
                      : <FileImage className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    }
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

            {/* Options */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Output mode */}
              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-fg">Output</legend>
                <div className="flex flex-col gap-1.5">
                  {([
                    { value: 'all-in-one',    label: 'All images in one PDF' },
                    { value: 'one-per-image', label: 'One PDF per image' },
                  ] as const).map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="outputMode"
                        value={opt.value}
                        checked={outputMode === opt.value}
                        onChange={() => setOutputMode(opt.value)}
                        className="text-primary accent-primary"
                      />
                      <span className="text-sm text-fg">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Page size */}
              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-fg">Page size</legend>
                <div className="flex flex-col gap-1.5">
                  {([
                    { value: 'fit-to-image', label: 'Fit to image' },
                    { value: 'a4',           label: 'A4' },
                    { value: 'letter',       label: 'US Letter' },
                  ] as const).map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="pageSize"
                        value={opt.value}
                        checked={pageSize === opt.value}
                        onChange={() => setPageSize(opt.value)}
                        className="text-primary accent-primary"
                      />
                      <span className="text-sm text-fg">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Orientation — only for A4 / US Letter */}
              {pageSize !== 'fit-to-image' && (
                <fieldset>
                  <legend className="mb-1.5 text-xs font-medium text-fg">Orientation</legend>
                  <div className="flex flex-col gap-1.5">
                    {([
                      { value: 'auto',      label: 'Auto (match image)' },
                      { value: 'portrait',  label: 'Portrait' },
                      { value: 'landscape', label: 'Landscape' },
                    ] as const).map((opt) => (
                      <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="orientation"
                          value={opt.value}
                          checked={orientation === opt.value}
                          onChange={() => setOrientation(opt.value)}
                          className="text-primary accent-primary"
                        />
                        <span className="text-sm text-fg">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-fg-subtle">
                    Auto matches image orientation. Portrait/Landscape forces the page direction.
                  </p>
                </fieldset>
              )}
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
                onClick={handleConvert}
                disabled={files.length === 0}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                Convert {files.length} image{files.length > 1 ? 's' : ''} to PDF
              </button>
            </div>
          </div>
        )}

        {/* Converting */}
        {phase === 'converting' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-fg">Converting {files.length} image{files.length > 1 ? 's' : ''}…</p>
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
        {phase === 'done' && results.length > 0 && (
          <div className="space-y-5">
            <ul className="space-y-2">
              {results.map((result, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-4 rounded-xl border border-border bg-bg px-4 py-3"
                >
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
                </li>
              ))}
            </ul>
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
                Convert more images
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
                <p className="text-sm font-medium text-fg">Conversion failed</p>
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
            { n: '1', label: 'Drop your images', desc: 'Drag and drop or click to browse. JPG, PNG, WebP, and GIF all work.' },
            { n: '2', label: 'Set the order', desc: 'Drag rows to set the page order. Choose page size and output format.' },
            { n: '3', label: 'Click Convert', desc: 'Images are embedded into a PDF in your browser — no upload, no server.' },
            { n: '4', label: 'Download', desc: 'Download your PDF immediately. Multiple files come as a ZIP.' },
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
