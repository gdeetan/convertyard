// components/text-tool-shell/text-tool-shell.tsx
'use client'

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useTransition,
} from 'react'
import {
  Copy,
  Download,
  Lock,
  RefreshCcw,
  Check,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { OptionsPanel } from '@/components/tool-shell/options-panel'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { RelatedArticlesStrip } from '@/components/tool-shell/related-articles-strip'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { highlightJson } from '@/lib/utils/json-highlight'
import { looksLikeBase64 } from '@/lib/converters/base64'
import type { TextToolConfig, TextConvertResult } from '@/lib/types-text'
import type { ToolOptions, ToolCategory } from '@/lib/types'

const CATEGORY_META: Record<ToolCategory, { label: string; href: string }> = {
  images:        { label: 'Image Converters', href: '/images' },
  pdf:           { label: 'PDF Tools',        href: '/pdf' },
  'video-audio': { label: 'Video & Audio',    href: '/video-audio' },
  dev:           { label: 'Developer Tools',  href: '/developer' },
  web:           { label: 'Web Tools',        href: '/web-tools' },
  ai:            { label: 'AI Tools',         href: '/ai-tools' },
}

function buildDefaultOptions(config: TextToolConfig): ToolOptions {
  const opts: ToolOptions = {}
  for (const opt of config.options ?? []) opts[opt.name] = opt.default
  return opts
}

function encodeHash(input: string): string {
  try { return btoa(encodeURIComponent(input)) } catch { return '' }
}
function decodeHash(hash: string): string {
  try { return decodeURIComponent(atob(hash)) } catch { return '' }
}

function downloadText(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function getStats(text: string) {
  return { chars: text.length, bytes: new TextEncoder().encode(text).length }
}

// ── Line-numbered textarea ─────────────────────────────────────────────────

interface LNTextareaProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id?: string
}

function LNTextarea({ value, onChange, placeholder, id }: LNTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const lineCount = value ? value.split('\n').length : 1

  const handleScroll = useCallback(() => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  return (
    <div className="relative flex overflow-hidden rounded-lg border border-border bg-bg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden border-r border-border bg-bg-muted px-3 py-3 font-mono text-xs leading-6 text-fg-subtle"
        style={{ minWidth: '3rem', maxHeight: '24rem' }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="text-right">{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className={cn(
          'flex-1 resize-none bg-transparent py-3 pl-3 pr-4',
          'font-mono text-xs leading-6 text-fg placeholder:text-fg-subtle',
          'focus:outline-none min-h-[12rem] max-h-[24rem]',
        )}
      />
    </div>
  )
}

// ── CSV preview table ──────────────────────────────────────────────────────

function CsvPreviewTable({ preview }: { preview: { headers: string[]; rows: string[][] } }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-fg-muted">Preview (first {preview.rows.length} rows)</p>
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full min-w-max text-xs">
          <thead className="bg-bg-muted">
            <tr>
              {preview.headers.map((h) => (
                <th key={h} className="border-b border-border px-3 py-2 text-left font-medium text-fg whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border last:border-0 hover:bg-bg-muted/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-fg-muted whitespace-nowrap">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Output panel ───────────────────────────────────────────────────────────

function OutputPanel({ result, outputLabel }: { result: TextConvertResult; outputLabel: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.output)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = result.output
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [result.output])

  const handleDownload = useCallback(() => {
    downloadText(result.output, result.outputFilename, result.outputMime)
  }, [result])

  const isJson = result.outputMime === 'application/json'
  const stats = getStats(result.output)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-sm font-medium text-fg">{outputLabel}</label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg-subtle">{stats.chars.toLocaleString()} chars · {stats.bytes.toLocaleString()} bytes</span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
              'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
              'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            )}
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Download
          </button>
        </div>
      </div>

      <pre className={cn(
        'overflow-auto rounded-lg border border-border bg-bg-muted p-4',
        'font-mono text-xs leading-6 text-fg min-h-[6rem] max-h-[32rem]',
      )}>
        <code>{isJson ? highlightJson(result.output) : result.output}</code>
      </pre>

      {result.tablePreview && result.tablePreview.headers.length > 0 && (
        <CsvPreviewTable preview={result.tablePreview} />
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function TextToolShell({ config }: { config: TextToolConfig }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<TextConvertResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [options, setOptions] = useState<ToolOptions>(() => buildDefaultOptions(config))
  const [fileError, setFileError] = useState<string | null>(null)
  const [autoDetectMsg, setAutoDetectMsg] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!config.enableUrlHash) return
    const hash = window.location.hash.slice(1)
    if (hash) {
      const decoded = decodeHash(hash)
      if (decoded) setInput(decoded)
    }
  }, [config.enableUrlHash])

  useEffect(() => {
    if (!config.enableUrlHash) return
    if (hashTimer.current) clearTimeout(hashTimer.current)
    hashTimer.current = setTimeout(() => {
      if (input) {
        const encoded = encodeHash(input)
        if (encoded) history.replaceState(null, '', `#${encoded}`)
      } else {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }, 500)
    return () => { if (hashTimer.current) clearTimeout(hashTimer.current) }
  }, [input, config.enableUrlHash])

  useEffect(() => {
    if (!input.trim()) {
      setResult(null)
      setAutoDetectMsg(null)
      return
    }
    startTransition(() => {
      setResult(config.convertFn(input, options))
    })
    if (config.enableAutoDetect && (options.mode as string) === 'encode' && looksLikeBase64(input)) {
      setAutoDetectMsg('This input looks like it might already be base64-encoded. Switch to Decode?')
    } else {
      setAutoDetectMsg(null)
    }
  }, [input, options, config])

  const handleOptionChange = useCallback((name: string, value: unknown) => {
    setOptions((prev) => ({ ...prev, [name]: value }))
    setAutoDetectMsg(null)
  }, [])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInput(text)
    } catch {
      document.getElementById('text-tool-input')?.focus()
    }
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setFileError(null)
    try {
      const text = config.fileToTextFn ? await config.fileToTextFn(file) : await file.text()
      setInput(text)
    } catch (err) {
      setFileError(`Could not read file: ${err instanceof Error ? err.message : 'unknown error'}`)
    }
  }, [config])

  const handleReset = useCallback(() => {
    setInput('')
    setResult(null)
    setFileError(null)
    setAutoDetectMsg(null)
    if (config.enableUrlHash) {
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [config.enableUrlHash])

  const catMeta = CATEGORY_META[config.category]
  const hasOutput = !!result && !result.errorMessage && !!result.output
  const inputStats = getStats(input)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: catMeta.label, href: catMeta.href },
          { label: config.title },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{config.title}</h1>
        <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
          Runs entirely in your browser. Nothing is sent to a server.
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-6">

        {/* Input section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label htmlFor="text-tool-input" className="text-sm font-medium text-fg">{config.inputLabel}</label>
            <div className="flex items-center gap-2 flex-wrap">
              {input && (
                <span className="text-xs text-fg-subtle">{inputStats.chars.toLocaleString()} chars · {inputStats.bytes.toLocaleString()} bytes</span>
              )}
              <button
                type="button"
                onClick={handlePaste}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
                  'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                )}
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Paste
              </button>
              {config.acceptsFile && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={[...(config.acceptsFile ?? []), ...(config.acceptsFileExt ?? [])].join(',')}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
                    className="sr-only"
                    aria-label="Upload file"
                    tabIndex={-1}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
                      'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    )}
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden />
                    {config.acceptsFileExt?.join(' / ') ?? 'File'}
                  </button>
                </>
              )}
              {input && (
                <button
                  type="button"
                  onClick={handleReset}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
                    'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  )}
                >
                  <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); if (config.acceptsFile) setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            className={cn(dragOver && 'ring-2 ring-primary ring-offset-1 rounded-lg')}
          >
            <LNTextarea id="text-tool-input" value={input} onChange={setInput} placeholder={config.inputPlaceholder} />
          </div>

          {fileError && (
            <p className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden /> {fileError}
            </p>
          )}
        </div>

        {/* Options */}
        {config.options && config.options.length > 0 && (
          <OptionsPanel options={config.options} values={options} onChange={handleOptionChange} />
        )}

        {/* Auto-detect suggestion */}
        {autoDetectMsg && (
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-xs text-fg">{autoDetectMsg}</p>
            <button
              type="button"
              onClick={() => handleOptionChange('mode', 'decode')}
              className="ml-4 shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-fg hover:bg-primary-hover transition-colors"
            >
              Switch to Decode
            </button>
          </div>
        )}

        {/* Error */}
        {result?.errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
            <div>
              <p className="text-sm font-medium text-red-500">Error</p>
              <p className="text-xs text-fg-muted mt-0.5">
                {result.errorMessage}
                {result.errorLine != null && (
                  <span className="ml-1 font-mono">(line {result.errorLine}{result.errorCol != null ? `, col ${result.errorCol}` : ''})</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Output */}
        {hasOutput && result && (
          <OutputPanel result={result} outputLabel={config.outputLabel ?? 'Output'} />
        )}

        {isPending && <p className="text-xs text-fg-subtle animate-pulse">Processing…</p>}
      </div>

      {/* How it works */}
      <TextHowItWorks config={config} />

      {config.faq.length > 0 && (
        <section className="mt-12"><FAQAccordion items={config.faq} /></section>
      )}
      {config.relatedTools.length > 0 && (
        <section className="mt-12"><RelatedToolsStrip slugs={config.relatedTools} /></section>
      )}
      {config.relatedArticles.length > 0 && (
        <section className="mt-12"><RelatedArticlesStrip slugs={config.relatedArticles} /></section>
      )}
    </div>
  )
}

function TextHowItWorks({ config }: { config: TextToolConfig }) {
  const steps = [
    {
      n: '1',
      label: 'Paste or upload',
      desc: config.acceptsFile
        ? `Paste text into the input box, or click the file button to load a ${config.acceptsFileExt?.join(' or ')} file.`
        : 'Paste your text directly into the input box.',
    },
    ...(config.options?.length
      ? [{ n: '2', label: 'Set options', desc: 'Adjust formatting or conversion options to match your needs.' }]
      : []),
    {
      n: config.options?.length ? '3' : '2',
      label: 'Output appears instantly',
      desc: 'Results update as you type. Everything runs locally in your browser.',
    },
    {
      n: config.options?.length ? '4' : '3',
      label: 'Copy or download',
      desc: 'Copy the output to clipboard, or download it as a file.',
    },
  ]

  return (
    <section className="mt-12" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-fg">How it works</h2>
      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
        {steps.map((step) => (
          <li key={step.n} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">
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
