'use client'

import { useState, useCallback } from 'react'
import { FileText, X, RefreshCcw, Download, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes, downloadFile } from '@/lib/utils/download'
import { pdfToWord } from '@/lib/converters/pdf'
import { detectPdfQuality } from '@/lib/converters/pdf-to-word'
import { config } from '@/content/tools/pdf-to-word'

type Phase = 'idle' | 'detecting' | 'ready' | 'converting' | 'done' | 'error'
type Quality = 'text' | 'scanned' | 'complex'

const qualityBadge: Record<Quality, { label: string; detail: string; colors: string }> = {
  text: {
    label: 'Text-based PDF',
    detail: 'Good formatting preservation expected',
    colors: 'text-green-600 bg-green-50 border-green-200',
  },
  scanned: {
    label: 'Scanned PDF',
    detail: 'OCR will extract text — formatting approximate',
    colors: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  complex: {
    label: 'Complex layout',
    detail: 'Text preserved — multi-column formatting may differ',
    colors: 'text-amber-600 bg-amber-50 border-amber-200',
  },
}

export default function PdfToWordPage() {
  const [files, setFiles] = useState<File[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<File[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [quality, setQuality] = useState<Quality | null>(null)
  const [pageFrom, setPageFrom] = useState(1)
  const [pageTo, setPageTo] = useState(9999)
  const [includeImages, setIncludeImages] = useState(true)
  const [ocrLanguage, setOcrLanguage] = useState('eng')

  const runDetection = useCallback(async (fileList: File[]) => {
    if (fileList.length === 0) return
    setPhase('detecting')
    try {
      const q = await detectPdfQuality(fileList[0])
      setQuality(q)
    } catch {
      setQuality('text')
    }
    setPhase('ready')
  }, [])

  const handleAdd = useCallback((added: File[]) => {
    setFiles((prev) => {
      const next = [...prev, ...added]
      if (prev.length === 0) {
        runDetection(next)
      }
      return next
    })
  }, [runDetection])

  const handleRemove = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) {
        setPhase('idle')
        setQuality(null)
      }
      return next
    })
  }

  const handleReset = () => {
    setFiles([])
    setPhase('idle')
    setProgress(0)
    setResults([])
    setErrorMsg('')
    setQuality(null)
    setPageFrom(1)
    setPageTo(9999)
    setIncludeImages(true)
    setOcrLanguage('eng')
  }

  const handleConvert = async () => {
    if (files.length === 0) return
    setPhase('converting')
    setProgress(0)
    try {
      const rawResults = await pdfToWord(
        files,
        { includeImages, pageFrom, pageTo, ocrLanguage },
        (_idx: number, pct: number) => setProgress(pct)
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
  const badge = quality ? qualityBadge[quality] : null

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

        {/* Detecting */}
        {phase === 'detecting' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
            <p className="text-sm text-fg-muted">Analysing PDF…</p>
          </div>
        )}

        {/* Ready: files queued + quality badge */}
        {phase === 'ready' && files.length > 0 && (
          <div className="space-y-5">

            {/* Quality badge */}
            {badge && (
              <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', badge.colors)}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{badge.label}</p>
                  <p className="mt-0.5 text-xs opacity-90">{badge.detail}</p>
                </div>
              </div>
            )}

            {/* File list */}
            <ul className="space-y-1.5" aria-label="PDFs to convert">
              {files.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-bg px-3 py-2.5"
                >
                  <FileText className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
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

            {/* Options */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Page range */}
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

              {/* Include images */}
              <fieldset>
                <legend className="mb-1.5 text-xs font-medium text-fg">Options</legend>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-fg">Include page images</span>
                </label>
                <p className="mt-1 text-xs text-fg-subtle">
                  Embeds page screenshots for complex layouts. Turn off for faster, text-only output.
                </p>
              </fieldset>

              {/* OCR language — shown only for scanned PDFs */}
              {quality === 'scanned' && (
                <fieldset>
                  <legend className="mb-1.5 text-xs font-medium text-fg">OCR language</legend>
                  <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className={cn(
                      'w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-fg',
                      'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'
                    )}
                  >
                    <option value="eng">English</option>
                    <option value="spa">Spanish</option>
                    <option value="fra">French</option>
                    <option value="deu">German</option>
                  </select>
                  <p className="mt-1 text-xs text-fg-subtle">
                    Select the primary language of the scanned document.
                  </p>
                </fieldset>
              )}
            </div>

            {/* Limitation note */}
            {config.limitationNote && (
              <details className="rounded-lg border border-border bg-bg px-4 py-3 text-sm">
                <summary className="cursor-pointer font-medium text-fg">
                  {config.limitationNote.summary}
                </summary>
                <p className="mt-2 text-xs text-fg-muted leading-relaxed">
                  {config.limitationNote.body}
                </p>
              </details>
            )}

            {/* Add more files */}
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
                Convert {files.length} PDF{files.length > 1 ? 's' : ''} to Word
              </button>
            </div>
          </div>
        )}

        {/* Converting */}
        {phase === 'converting' && (
          <div className="space-y-4 py-4 text-center">
            <p className="text-sm font-medium text-fg">
              Converting {files.length} PDF{files.length > 1 ? 's' : ''}…
              {quality === 'scanned' && (
                <span className="ml-2 text-amber-600">(OCR in progress)</span>
              )}
            </p>
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
                Convert more PDFs
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
