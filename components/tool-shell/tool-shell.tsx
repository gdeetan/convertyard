'use client'

import { useState, useCallback, useReducer, useRef, useEffect } from 'react'
import { Lock, RefreshCcw, Upload, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
import { Dropzone } from './dropzone'
import { OptionsPanel } from './options-panel'
import { ProgressList } from './progress-list'
import { ResultList } from './result-list'
import { FAQAccordion } from './faq-accordion'
import { RelatedToolsStrip } from './related-tools-strip'
import { RelatedArticlesStrip } from './related-articles-strip'
import type { ToolConfig, FileEntry, ToolPhase, ToolOptions, ToolCategory, CompressionMeta, OcrResultMeta, ConversionResult } from '@/lib/types'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { sizeTargets } from '@/content/size-target-registry'
import { useRecentTools } from '@/lib/hooks/use-recent-tools'

const CATEGORY_META: Record<ToolCategory, { label: string; href: string }> = {
  images:           { label: 'Image Converters',     href: '/images' },
  'image-editing':  { label: 'Image Editing',        href: '/image-editing' },
  'image-to-text':  { label: 'Image to Text',        href: '/image-to-text-converter' },
  pdf:              { label: 'PDF Tools',            href: '/pdf' },
  'video-audio':    { label: 'Video & Audio',        href: '/video-audio' },
  dev:              { label: 'Developer Tools',      href: '/developer' },
  web:              { label: 'Web Tools',            href: '/web-tools' },
  ai:               { label: 'AI Tools',             href: '/ai-tools' },
}

interface ToolShellProps {
  config: ToolConfig
  embedded?: boolean
  onResults?: (results: File[]) => void
  initialOptions?: ToolOptions
  notice?: React.ReactNode
}

// ── State ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_FILES'; files: File[] }
  | { type: 'SET_PROGRESS'; fileIndex: number; pct: number }
  | { type: 'SET_RESULT'; fileIndex: number; result: File; resultMeta?: CompressionMeta; ocrMeta?: OcrResultMeta }
  | { type: 'SET_ERROR'; fileIndex: number; error: string }
  | { type: 'START_CONVERTING' }
  | { type: 'FINISH' }
  | { type: 'RESET' }
  | { type: 'EDIT_RESULT'; fileIndex: number; newFile: File }

interface State {
  entries: FileEntry[]
  phase: ToolPhase
  announcement: string
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FILES': {
      const next: FileEntry[] = action.files.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        status: 'pending',
        progress: 0,
      }))
      return { ...state, entries: [...state.entries, ...next] }
    }
    case 'START_CONVERTING': {
      return {
        ...state,
        phase: 'converting',
        entries: state.entries.map((e) => ({ ...e, status: 'processing', progress: 0 })),
        announcement: `Converting ${state.entries.length} file${state.entries.length > 1 ? 's' : ''}…`,
      }
    }
    case 'SET_PROGRESS': {
      const entries = [...state.entries]
      if (entries[action.fileIndex]) {
        entries[action.fileIndex] = {
          ...entries[action.fileIndex],
          progress: action.pct,
        }
      }
      return { ...state, entries }
    }
    case 'SET_RESULT': {
      const entries = [...state.entries]
      if (entries[action.fileIndex]) {
        entries[action.fileIndex] = {
          ...entries[action.fileIndex],
          status: 'done',
          progress: 100,
          result: action.result,
          resultMeta: action.resultMeta,
          ocrMeta: action.ocrMeta,
        }
      }
      return { ...state, entries }
    }
    case 'EDIT_RESULT': {
      const entries = [...state.entries]
      if (entries[action.fileIndex]?.result) {
        entries[action.fileIndex] = {
          ...entries[action.fileIndex],
          result: action.newFile,
        }
      }
      return { ...state, entries }
    }
    case 'SET_ERROR': {
      const entries = [...state.entries]
      if (entries[action.fileIndex]) {
        entries[action.fileIndex] = {
          ...entries[action.fileIndex],
          status: 'error',
          progress: 100,
          error: action.error,
        }
      }
      return { ...state, entries }
    }
    case 'FINISH': {
      const done = state.entries.filter((e) => e.status === 'done').length
      const failed = state.entries.filter((e) => e.status === 'error').length
      const total = state.entries.length
      const msg =
        failed === 0
          ? `Done. ${done} file${done > 1 ? 's' : ''} ready to download.`
          : `Done. ${done} of ${total} succeeded, ${failed} failed.`
      return { ...state, phase: 'done', announcement: msg }
    }
    case 'RESET':
      return { entries: [], phase: 'idle', announcement: '' }
    default:
      return state
  }
}

function buildDefaultOptions(config: ToolConfig): ToolOptions {
  const opts: ToolOptions = {}
  for (const opt of config.options ?? []) {
    if (opt.type === 'section-header') continue
    opts[opt.name] = opt.default
  }
  for (const opt of config.advancedOptions ?? []) {
    if (opt.type !== 'section-header') {
      opts[opt.name] = opt.default
    }
  }
  return opts
}

// ── Component ──────────────────────────────────────────────────────────────

export function ToolShell({ config, embedded = false, onResults, initialOptions, notice }: ToolShellProps) {
  const [state, dispatch] = useReducer(reducer, {
    entries: [],
    phase: 'idle',
    announcement: '',
  })
  const [options, setOptions] = useState<ToolOptions>(() => ({
    ...buildDefaultOptions(config),
    ...initialOptions,
  }))
  const [fileWarning, setFileWarning] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const { record } = useRecentTools()

  const handlePresetApply = useCallback((values: ToolOptions) => {
    setOptions(prev => ({ ...prev, ...values }))
    setAdvancedOpen(true)
  }, [])

  // Batch progress updates via RAF to avoid flooding React
  const pendingProgress = useRef<Array<[number, number]>>([])

  useEffect(() => {
    if (state.phase !== 'converting') return
    let rafId: number
    const flush = () => {
      const updates = pendingProgress.current.splice(0)
      for (const [idx, pct] of updates) {
        dispatch({ type: 'SET_PROGRESS', fileIndex: idx, pct })
      }
      rafId = requestAnimationFrame(flush)
    }
    rafId = requestAnimationFrame(flush)
    return () => cancelAnimationFrame(rafId)
  }, [state.phase])

  const handleAdd = useCallback((files: File[]) => {
    dispatch({ type: 'ADD_FILES', files })
    if (config.warningFn) {
      setFileWarning(config.warningFn(files))
    }
  }, [config])

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' })
    setFileWarning(null)
  }, [])

  const handleOptionChange = useCallback((name: string, value: unknown) => {
    setOptions((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleConvert = useCallback(async () => {
    if (state.entries.length === 0) return
    dispatch({ type: 'START_CONVERTING' })

    const files = state.entries.map((e) => e.file)
    const onProgress = (fileIndex: number, pct: number) => {
      pendingProgress.current.push([fileIndex, pct])
    }

    let results: ConversionResult[]
    try {
      results = await config.convertFn(files, options, onProgress)
    } catch (err) {
      results = files.map(() => new Error(err instanceof Error ? err.message : 'Conversion failed'))
    }

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r instanceof Error) {
        dispatch({ type: 'SET_ERROR', fileIndex: i, error: r.message })
      } else if (r instanceof File) {
        dispatch({ type: 'SET_RESULT', fileIndex: i, result: r })
      } else if ('ocrMeta' in r) {
        dispatch({ type: 'SET_RESULT', fileIndex: i, result: r.file, ocrMeta: r.ocrMeta })
      } else {
        dispatch({ type: 'SET_RESULT', fileIndex: i, result: r.file, resultMeta: r.meta })
      }
    }
    dispatch({ type: 'FINISH' })
    const anySucceeded = results.some((r) => !(r instanceof Error))
    if (anySucceeded) record(config.slug, config.title)
    if (onResults) {
      const successFiles = results.filter((r): r is File => r instanceof File)
      onResults(successFiles)
    }
  }, [state.entries, config, options, onResults, record])

  const { entries, phase, announcement } = state
  const hasFiles = entries.length > 0
  const totalBytes = entries.reduce((s, e) => s + e.file.size, 0)

  const zipName = `${config.slug}-converted.zip`

  const inner = (
    <div className={embedded ? undefined : 'mx-auto max-w-3xl px-4 py-10 sm:px-6'}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      {!embedded && (
        <div className="mb-8">
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Tools', href: '/tools' },
            { label: CATEGORY_META[config.category].label, href: CATEGORY_META[config.category].href },
            { label: config.title },
          ]} />
          <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            {config.title}
          </h1>
          <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
          {config.limitationNote && (
            <details className="mt-2 group">
              <summary className="cursor-pointer list-none text-sm text-fg-muted hover:text-fg transition-colors select-none inline-flex items-center gap-1">
                <span className="group-open:hidden">▸</span>
                <span className="hidden group-open:inline">▾</span>
                {config.limitationNote.summary}
              </summary>
              <p className="mt-1.5 pl-3 text-sm text-fg-subtle border-l-2 border-border">
                {config.limitationNote.body}
              </p>
            </details>
          )}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
            <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
            Files never leave your browser. No uploads. No accounts.
          </div>
        </div>
      )}

      {/* ── Optional notice banner ──────────────────────────────────────── */}
      {notice && <div className="mb-4">{notice}</div>}

      {/* ── Main tool card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">
        {/* Idle: no files */}
        {phase === 'idle' && !hasFiles && (
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={handleAdd}
          />
        )}

        {/* Idle: files present */}
        {phase === 'idle' && hasFiles && (
          <div className="space-y-4">
            <Dropzone
              accepts={config.accepts}
              acceptsExt={config.acceptsExt}
              onAdd={handleAdd}
              compact
              fileCount={entries.length}
              totalBytes={totalBytes}
            />

            {config.previewPanel && (
              <config.previewPanel
                files={entries.map(e => e.file)}
                results={[]}
                options={options}
              />
            )}

            {config.interactivePanel && (
              <config.interactivePanel
                files={entries.map(e => e.file)}
                options={options}
                onChange={handleOptionChange}
              />
            )}

            {fileWarning && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {fileWarning}
              </div>
            )}

            {config.options && config.options.length > 0 && (
              <OptionsPanel
                options={config.options}
                values={options}
                onChange={handleOptionChange}
              />
            )}

            {(config.presetBar || (config.advancedOptions && config.advancedOptions.length > 0)) && (
              <div className="space-y-2">
                {config.presetBar && (
                  <config.presetBar onApply={handlePresetApply} />
                )}
                {config.advancedOptions && config.advancedOptions.length > 0 && (
                  <details
                    open={advancedOpen}
                    onToggle={(e) => setAdvancedOpen(e.currentTarget.open)}
                    className="rounded-lg border border-border"
                  >
                    <summary className="flex cursor-pointer select-none items-center gap-1 px-4 py-3 text-sm font-medium text-fg hover:text-fg transition-colors list-none">
                      <span className="mr-1 text-fg-subtle">{advancedOpen ? '▾' : '▸'}</span>
                      Advanced settings
                    </summary>
                    <div className="border-t border-border px-4 pb-4 pt-4">
                      <OptionsPanel
                        options={config.advancedOptions}
                        values={options}
                        onChange={handleOptionChange}
                      />
                    </div>
                  </details>
                )}
              </div>
            )}

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
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                )}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Convert {entries.length} file{entries.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Converting */}
        {phase === 'converting' && (
          <div className="space-y-4">
            {config.previewPanel && (
              <config.previewPanel
                files={entries.map(e => e.file)}
                results={[]}
                options={options}
              />
            )}
            <ProgressList entries={entries} announcement={announcement} />
          </div>
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="space-y-6">
            {config.previewPanel && (
              <config.previewPanel
                files={entries.map(e => e.file)}
                results={entries.map(e => e.result ?? null)}
                options={options}
              />
            )}
            {config.reviewPanel && (
              <config.reviewPanel
                files={entries.map(e => e.file)}
                results={entries.map(e =>
                  e.ocrMeta
                    ? { file: e.result!, ocrMeta: e.ocrMeta }
                    : e.result ?? new Error(e.error ?? 'unknown error')
                )}
                onResultEdit={(index, newFile) =>
                  dispatch({ type: 'EDIT_RESULT', fileIndex: index, newFile })
                }
              />
            )}
            <ResultList entries={entries} zipName={zipName} />
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
                Convert more files
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── How this tool works ──────────────────────────────────────────── */}
      <HowItWorks title={config.title} hasOptions={!!config.options?.length} />

      {/* ── FAQ, related tools, related articles (hidden when embedded) ─── */}
      {!embedded && (
        <>
          <SizeTargetGrid slug={config.slug} />

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

          {config.relatedArticles.length > 0 && (
            <section className="mt-12">
              <RelatedArticlesStrip slugs={config.relatedArticles} />
            </section>
          )}
        </>
      )}
    </div>
  )

  return inner
}

// ── Common target sizes grid ───────────────────────────────────────────────

function SizeTargetGrid({ slug }: { slug: string }) {
  const targets = sizeTargets.filter((t) => t.parentTool === slug)
  if (targets.length === 0) return null

  return (
    <section className="mt-12" aria-labelledby="size-targets-heading">
      <h2 id="size-targets-heading" className="mb-6 text-xl font-semibold text-fg">
        Common target sizes
      </h2>
      <ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        role="list"
      >
        {targets.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/${slug}/${t.slug}`}
              className={cn(
                'group relative flex flex-col gap-1.5 rounded-xl border border-border bg-bg-elevated p-4',
                'transition-colors hover:border-primary/40 hover:bg-bg-muted',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
              )}
            >
              <span className="text-sm font-semibold text-fg">{t.targetLabel}</span>
              <span className="flex-1 text-xs leading-relaxed text-fg-muted line-clamp-2">
                {t.subhead}
              </span>
              <ArrowRight
                className="mt-2 h-3.5 w-3.5 self-end text-fg-subtle transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ── How it works mini-section ──────────────────────────────────────────────

function HowItWorks({ title, hasOptions }: { title: string; hasOptions: boolean }) {
  const steps = [
    { n: '1', label: 'Drop your files', desc: 'Drag and drop, click to browse, or paste from clipboard. Up to 1,000 files at once.' },
    ...(hasOptions ? [{ n: '2', label: 'Choose settings', desc: 'Adjust quality, format, and other options to match your needs.' }] : []),
    { n: hasOptions ? '3' : '2', label: 'Click Convert', desc: `Everything runs in your browser via WebAssembly. ${title} happens locally — no server involved.` },
    { n: hasOptions ? '4' : '3', label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ]

  return (
    <section className="mt-12" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-fg">
        How it works
      </h2>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
        {steps.map((step) => (
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
  )
}
