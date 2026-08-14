'use client'

import { useState, useCallback, useRef } from 'react'
import { Copy, Check, Download, Loader2, Mic } from 'lucide-react'
import { zipSync, strToU8 } from 'fflate'
import { cn } from '@/lib/utils/cn'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { TranscriptEditor } from '@/components/transcription/transcript-editor'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { config } from '@/content/tools/transcription'
import {
  classifyTranscriptionError,
  formatTranscriptionError,
  type TranscriptionErrorShape,
} from '@/lib/converters/transcription-errors'
import type {
  QualityMode,
  OutputFormat,
  TranscriptionBatchResult,
} from '@/lib/converters/transcription'

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'loading-model' | 'processing' | 'done'

interface FileEntry {
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: number
  text?: string
  srt?: string
  output?: string
  originalOutput?: string
  error?: string
  errorDetails?: string
  errorCode?: string
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
      aria-label="Copy transcript"
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

// ── Quality options ────────────────────────────────────────────────────────────

const QUALITY_OPTIONS: { value: QualityMode; label: string; size: string }[] = [
  { value: 'fast', label: 'Fast', size: 'smallest download' },
  { value: 'balanced', label: 'Balanced', size: 'recommended' },
  { value: 'accurate', label: 'Accurate', size: 'best quality' },
]

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ko', label: 'Korean' },
]

// ── Main page ──────────────────────────────────────────────────────────────────

export default function TranscriptionPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [quality, setQuality] = useState<QualityMode>('balanced')
  const [language, setLanguage] = useState<string>('')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('txt')
  const processingRef = useRef(false)
  const pendingProgress = useRef<Map<number, number>>(new Map())
  const rafPending = useRef(false)

  const flushProgress = useCallback(() => {
    rafPending.current = false
    setEntries(prev => {
      const next = [...prev]
      pendingProgress.current.forEach((pct, i) => {
        if (next[i]) next[i] = { ...next[i], progress: pct }
      })
      pendingProgress.current.clear()
      return next
    })
  }, [])

  const onFileProgress = useCallback((i: number, pct: number) => {
    pendingProgress.current.set(i, pct)
    if (!rafPending.current) {
      rafPending.current = true
      requestAnimationFrame(flushProgress)
    }
  }, [flushProgress])

  const updateEntry = useCallback((index: number, patch: Partial<FileEntry>) => {
    setEntries((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }, [])

  const applyBatchResult = useCallback((index: number, result: Pick<TranscriptionBatchResult, 'text' | 'srt' | 'output'>) => {
    updateEntry(index, {
      text: result.text,
      srt: result.srt,
      output: result.output,
      originalOutput: result.output,
      status: 'done',
      progress: 100,
      error: undefined,
      errorDetails: undefined,
      errorCode: undefined,
    })
  }, [updateEntry])

  const applyEntryError = useCallback((index: number, error: TranscriptionErrorShape) => {
    updateEntry(index, {
      status: 'error',
      progress: 0,
      error: formatTranscriptionError(error),
      errorDetails: error.rawMessage,
      errorCode: error.code,
    })
  }, [updateEntry])

  const handleAdd = useCallback((files: File[]) => {
    const newEntries: FileEntry[] = files.map((file) => ({
      file,
      status: 'pending',
      progress: 0,
    }))
    setEntries((prev) => [...prev, ...newEntries])
  }, [])

  const handleTranscribe = useCallback(async () => {
    if (processingRef.current || entries.length === 0) return
    processingRef.current = true

    setPhase('loading-model')
    setModelProgress(0)
    await new Promise<void>(resolve => setTimeout(resolve, 50))  // let banner render

    const { transcribeBatch } = await import('@/lib/converters/transcription')

    // Reset all to pending
    setEntries((prev) => prev.map((e) => ({
      ...e,
      status: 'pending' as const,
      progress: 0,
      text: undefined,
      srt: undefined,
      output: undefined,
      error: undefined,
      errorDetails: undefined,
      errorCode: undefined,
    })))

    setPhase('processing')

    try {
      const results = await transcribeBatch(
        entries.map((e) => e.file),
        { quality, language: language || null, outputFormat },
        (pct) => {
          setModelProgress(pct)
        },
        (fileIndex, pct) => {
          onFileProgress(fileIndex, pct)
          updateEntry(fileIndex, { status: 'processing' })
        },
        (fileIndex, result) => {
          applyBatchResult(fileIndex, result)
        }
      )

      // Handle any errors from results
      results.forEach((result, i) => {
        if (result.error) {
          applyEntryError(i, result.error)
        }
      })

      setPhase('done')
    } catch (err) {
      const error = classifyTranscriptionError(err)
      console.error('[transcription] processing failed:', err)
      setEntries((prev) =>
        prev.map((e) =>
          e.status === 'pending' || e.status === 'processing'
            ? {
                ...e,
                status: 'error',
                error: formatTranscriptionError(error),
                errorDetails: error?.rawMessage ?? String(err),
                errorCode: error?.code ?? 'UNKNOWN',
              }
            : e
        )
      )
      setPhase('done')
    } finally {
      processingRef.current = false
    }
  }, [applyBatchResult, applyEntryError, entries, quality, language, outputFormat, onFileProgress])

  const handleReset = () => {
    setEntries([])
    setPhase('idle')
    setModelProgress(0)
    processingRef.current = false
  }

  const handleDownloadZIP = () => {
    const doneEntries = entries.filter((e) => e.status === 'done' && e.output)
    if (doneEntries.length === 0) return

    const files: Record<string, Uint8Array> = {}
    for (const e of doneEntries) {
      const baseName = e.file.name.replace(/\.[^.]+$/, '')
      const ext = outputFormat === 'srt' ? '.srt' : '.txt'
      files[`${baseName}${ext}`] = strToU8(e.output ?? '')
    }

    const zipped = zipSync(files)
    const blob = new Blob([zipped], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcripts.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const isProcessing = phase === 'loading-model' || phase === 'processing'
  const doneCount = entries.filter((e) => e.status === 'done').length
  const hasResults = doneCount > 0

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: 'AI Tools', href: '/ai-tools' },
        { label: config.title },
      ]} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-fg sm:text-3xl">{config.title}</h1>
        <p className="text-sm text-fg-muted">{config.subtitle}</p>
      </div>

      {/* Model download banner */}
      {phase === 'loading-model' && (
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg-muted">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary shrink-0" />
            <span className="flex-1">
              {modelProgress > 0
                ? `Downloading Whisper model… ${modelProgress}% (one-time download)`
                : 'Loading Whisper model…'}
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

      {/* Drop zone — only shown in idle phase */}
      {phase === 'idle' && (
        <div className="mb-6">
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt ?? []}
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
            <span className="font-medium text-fg">
              {entries.length} file{entries.length !== 1 ? 's' : ''} ready
            </span>
            <button
              onClick={handleReset}
              className="text-fg-muted hover:text-error transition-colors text-xs"
            >
              Clear all
            </button>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {entries.map((e, i) => (
              <div key={i} className="flex items-center gap-3 bg-bg-elevated px-4 py-2.5 text-sm">
                <Mic className="h-4 w-4 shrink-0 text-fg-subtle" />
                <span className="flex-1 truncate text-fg">{e.file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Options — shown in idle with files */}
      {phase === 'idle' && entries.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-bg-elevated p-4 space-y-4">
          {/* Quality */}
          <div>
            <label htmlFor="quality-select" className="mb-1.5 block text-sm font-medium text-fg">
              Quality
            </label>
            <select
              id="quality-select"
              value={quality}
              onChange={(e) => setQuality(e.target.value as QualityMode)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {QUALITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.size})
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label htmlFor="language-select" className="mb-1.5 block text-sm font-medium text-fg">
              Language
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Output format */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-fg">Output format</p>
            <div className="flex gap-2">
              {(['txt', 'srt'] as OutputFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                    outputFormat === fmt
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border bg-bg-muted text-fg-muted hover:border-primary hover:text-primary'
                  )}
                >
                  {fmt.toUpperCase()}
                  <span className="text-xs opacity-60">
                    {fmt === 'txt' ? 'Plain text' : 'With timestamps'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transcribe button */}
      {phase === 'idle' && (
        <button
          onClick={handleTranscribe}
          disabled={entries.length === 0}
          className={cn(
            'mb-8 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all',
            entries.length === 0
              ? 'bg-bg-muted text-fg-subtle cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
          )}
        >
          <Mic className="h-4 w-4" aria-hidden="true" />
          Transcribe {entries.length > 0 ? `${entries.length} file${entries.length !== 1 ? 's' : ''}` : 'files'}
        </button>
      )}

      {/* Processing / results view */}
      {(phase === 'loading-model' || phase === 'processing' || phase === 'done') && entries.length > 0 && (
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fg">
              {phase === 'done'
                ? `${doneCount} of ${entries.length} completed`
                : phase === 'processing'
                ? 'Transcribing…'
                : 'Waiting for model…'}
            </p>
            {phase === 'done' && (
              <button
                onClick={handleReset}
                className="text-xs text-fg-muted hover:text-primary transition-colors"
              >
                Start over
              </button>
            )}
          </div>

          {/* Per-file rows */}
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {entries.map((entry, i) => (
              <div key={i} className="bg-bg-elevated">
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Status icon */}
                  {entry.status === 'processing' && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  )}
                  {entry.status === 'done' && (
                    <Check className="h-4 w-4 shrink-0 text-success" />
                  )}
                  {entry.status === 'error' && (
                    <span className="h-4 w-4 shrink-0 text-error text-xs font-bold">✕</span>
                  )}
                  {entry.status === 'pending' && (
                    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-border" />
                  )}

                  <span className="flex-1 truncate text-sm text-fg">{entry.file.name}</span>

                  {/* Copy button when done */}
                  {entry.status === 'done' && entry.output && (
                    <CopyButton text={entry.output} />
                  )}
                </div>

                {/* Progress bar during processing */}
                {entry.status === 'processing' && (
                  <div className="flex items-center gap-2 px-4 pb-3">
                    <div className="flex-1 h-1 rounded-full bg-bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-fg-subtle shrink-0">{entry.progress}%</span>
                  </div>
                )}

                {/* Editable transcript when done */}
                {entry.status === 'done' && entry.output !== undefined && (
                  <TranscriptEditor
                    file={entry.file}
                    output={entry.output}
                    originalOutput={entry.originalOutput}
                    outputFormat={outputFormat}
                    onChange={(next) => updateEntry(i, { output: next })}
                    initialRows={entries.length === 1 ? 24 : 12}
                  />
                )}

                {/* Error message */}
                {entry.status === 'error' && entry.error && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-error">{entry.error}</p>
                    {entry.errorCode && (
                      <p className="mt-1 text-[11px] font-medium text-fg-subtle">
                        Error code: {entry.errorCode}
                      </p>
                    )}
                    {entry.errorDetails && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] text-fg-subtle">Technical details</summary>
                        <p className="mt-1 break-words font-mono text-[11px] text-fg-subtle">
                          {entry.errorDetails}
                        </p>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {/* ZIP download */}
            {phase === 'done' && hasResults && (
              <button
                onClick={handleDownloadZIP}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download ZIP ({doneCount} transcript{doneCount !== 1 ? 's' : ''})
              </button>
            )}

            {isProcessing && (
              <p className="text-center text-xs text-fg-subtle">
                Leave this tab open — closing it will stop processing.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Trust signal */}
      <p className="mb-8 text-xs text-fg-subtle">
        Audio never touches a server.{' '}
        <a
          href="https://developer.chrome.com/docs/devtools/network/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-primary transition-colors"
        >
          Verify in DevTools
        </a>{' '}
        — all processing runs locally via WebAssembly.
      </p>

      {/* FAQ */}
      <div className="mb-12">
        <FAQAccordion items={config.faq} pageUrl={`https://convertyard.com/${config.slug}`} />
      </div>

      {/* Related tools */}
      <RelatedToolsStrip slugs={config.relatedTools} />
    </div>
  )
}
