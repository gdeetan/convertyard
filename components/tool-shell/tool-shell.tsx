'use client'

import { useState, useCallback, useReducer, useRef, useEffect } from 'react'
import { Lock, RefreshCcw, Upload } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
import { Dropzone } from './dropzone'
import { OptionsPanel } from './options-panel'
import { ProgressList } from './progress-list'
import { ResultList } from './result-list'
import { FAQAccordion } from './faq-accordion'
import { RelatedToolsStrip } from './related-tools-strip'
import { RelatedArticlesStrip } from './related-articles-strip'
import type { ToolConfig, FileEntry, ToolPhase, ToolOptions } from '@/lib/types'
import { Breadcrumb } from '@/components/ui/breadcrumb'

interface ToolShellProps {
  config: ToolConfig
}

// ── State ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_FILES'; files: File[] }
  | { type: 'SET_PROGRESS'; fileIndex: number; pct: number }
  | { type: 'SET_RESULT'; fileIndex: number; result: File }
  | { type: 'SET_ERROR'; fileIndex: number; error: string }
  | { type: 'START_CONVERTING' }
  | { type: 'FINISH' }
  | { type: 'RESET' }

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
    opts[opt.name] = opt.default
  }
  return opts
}

// ── Component ──────────────────────────────────────────────────────────────

export function ToolShell({ config }: ToolShellProps) {
  const [state, dispatch] = useReducer(reducer, {
    entries: [],
    phase: 'idle',
    announcement: '',
  })
  const [options, setOptions] = useState<ToolOptions>(() => buildDefaultOptions(config))

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

    let results: (File | Error)[]
    try {
      results = await config.convertFn(files, options, onProgress)
    } catch (err) {
      results = files.map(() => new Error(err instanceof Error ? err.message : 'Conversion failed'))
    }

    for (let i = 0; i < results.length; i++) {
      const r = results[i]
      if (r instanceof Error) {
        dispatch({ type: 'SET_ERROR', fileIndex: i, error: r.message })
      } else {
        dispatch({ type: 'SET_RESULT', fileIndex: i, result: r })
      }
    }
    dispatch({ type: 'FINISH' })
  }, [state.entries, config, options])

  const { entries, phase, announcement } = state
  const hasFiles = entries.length > 0
  const totalBytes = entries.reduce((s, e) => s + e.file.size, 0)

  const zipName = `${config.slug}-converted.zip`

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Tools', href: '/tools' }, { label: config.title }]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {config.title}
        </h1>
        <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
          Files never leave your browser. No uploads. No accounts.
        </div>
      </div>

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

            {config.options && config.options.length > 0 && (
              <OptionsPanel
                options={config.options}
                values={options}
                onChange={handleOptionChange}
              />
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET' })}
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
          <ProgressList entries={entries} announcement={announcement} />
        )}

        {/* Done */}
        {phase === 'done' && (
          <div className="space-y-6">
            <ResultList entries={entries} zipName={zipName} />
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESET' })}
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

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      {config.faq.length > 0 && (
        <section className="mt-12">
          <FAQAccordion items={config.faq} />
        </section>
      )}

      {/* ── Related tools ────────────────────────────────────────────────── */}
      {config.relatedTools.length > 0 && (
        <section className="mt-12">
          <RelatedToolsStrip slugs={config.relatedTools} />
        </section>
      )}

      {/* ── Related articles ─────────────────────────────────────────────── */}
      {config.relatedArticles.length > 0 && (
        <section className="mt-12">
          <RelatedArticlesStrip slugs={config.relatedArticles} />
        </section>
      )}
    </div>
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
