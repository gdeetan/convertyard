'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Copy, Check, Lock, Download, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { RelatedArticlesStrip } from '@/components/tool-shell/related-articles-strip'
import { renderQrToCanvas, renderQrToSvgString, generateQrBatch } from '@/lib/dev-tools/qr'
import type { QrOptions } from '@/lib/dev-tools/qr'
import { zipSync } from 'fflate'

const EC_LABELS: Record<string, string> = {
  L: 'Low (~7% recoverable) — smaller, denser',
  M: 'Medium (~15% recoverable) — balanced',
  Q: 'Quartile (~25% recoverable) — more resilient',
  H: 'High (~30% recoverable) — best resilience, densest pattern',
}

function encodeHash(text: string): string {
  try { return btoa(encodeURIComponent(text)) } catch { return '' }
}
function decodeHash(s: string): string {
  try { return decodeURIComponent(atob(s)) } catch { return '' }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  return (
    <button type="button" onClick={copy} className={cn(
      'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
      'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    )}>
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Copied!' : 'Copy URL'}
    </button>
  )
}

// ── Quick mode ─────────────────────────────────────────────────────────────

function QuickMode() {
  const [text, setText] = useState('')
  const [opts, setOpts] = useState<QrOptions>({
    size: 256,
    foreground: '#000000',
    background: '#ffffff',
    errorCorrectionLevel: 'M',
  })
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hydrate from hash
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const t = decodeHash(hash)
      if (t) setText(t)
    }
  }, [])

  // Write hash
  useEffect(() => {
    if (hashTimer.current) clearTimeout(hashTimer.current)
    hashTimer.current = setTimeout(() => {
      if (text) {
        const enc = encodeHash(text)
        if (enc) history.replaceState(null, '', `#${enc}`)
      } else {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }, 500)
    return () => { if (hashTimer.current) clearTimeout(hashTimer.current) }
  }, [text])

  // Render QR
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !text.trim()) return
    if (renderTimer.current) clearTimeout(renderTimer.current)
    renderTimer.current = setTimeout(async () => {
      try {
        setError(null)
        await renderQrToCanvas(canvas, text.trim(), opts)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate QR code')
      }
    }, 150)
    return () => { if (renderTimer.current) clearTimeout(renderTimer.current) }
  }, [text, opts])

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'qrcode.png'; a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [])

  const downloadSvg = useCallback(async () => {
    if (!text.trim()) return
    try {
      const svg = await renderQrToSvgString(text.trim(), opts)
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'qrcode.svg'; a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate SVG')
    }
  }, [text, opts])

  const setOpt = <K extends keyof QrOptions>(key: K, val: QrOptions[K]) =>
    setOpts(o => ({ ...o, [key]: val }))

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#${encodeHash(text)}`
    : ''

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {/* Left: input + options */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="qr-text" className="block text-sm font-medium text-fg">Text or URL</label>
          <textarea
            id="qr-text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="https://example.com"
            rows={3}
            className={cn(
              'w-full rounded-lg border border-border bg-bg-muted px-3 py-2',
              'text-sm text-fg placeholder:text-fg-subtle resize-y',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-fg-muted">Size</label>
            <span className="font-mono text-xs text-fg">{opts.size}px</span>
          </div>
          <input
            type="range" min={64} max={1024} step={32} value={opts.size}
            onChange={e => setOpt('size', Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-fg-muted">Foreground</label>
            <input type="color" value={opts.foreground}
              onChange={e => setOpt('foreground', e.target.value)}
              className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent p-0.5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-fg-muted">Background</label>
            <input type="color" value={opts.background}
              onChange={e => setOpt('background', e.target.value)}
              className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent p-0.5"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-fg-muted">Error correction</label>
          <div className="grid grid-cols-4 gap-1" role="group" aria-label="Error correction level">
            {(['L', 'M', 'Q', 'H'] as const).map(ec => (
              <button
                key={ec}
                type="button"
                onClick={() => setOpt('errorCorrectionLevel', ec)}
                title={EC_LABELS[ec]}
                aria-pressed={opts.errorCorrectionLevel === ec}
                className={cn(
                  'rounded-md border py-1.5 text-xs font-medium transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  opts.errorCorrectionLevel === ec
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
                )}
              >
                {ec}
              </button>
            ))}
          </div>
          <p className="text-xs text-fg-subtle">{EC_LABELS[opts.errorCorrectionLevel]}</p>
        </div>
      </div>

      {/* Right: preview + download */}
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl border border-border bg-bg-muted p-3 min-h-[200px] flex items-center justify-center">
          {text.trim() ? (
            <canvas
              ref={canvasRef}
              className="max-w-full"
              aria-label="QR code preview"
            />
          ) : (
            <p className="text-sm text-fg-subtle">Enter text to preview</p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        {text.trim() && !error && (
          <div className="flex flex-wrap gap-2 justify-center">
            <button type="button" onClick={downloadPng} className={cn(
              'flex items-center gap-1.5 rounded-lg border border-border px-3 py-2',
              'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            )}>
              <Download className="h-3.5 w-3.5" aria-hidden /> Download PNG
            </button>
            <button type="button" onClick={downloadSvg} className={cn(
              'flex items-center gap-1.5 rounded-lg border border-border px-3 py-2',
              'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            )}>
              <Download className="h-3.5 w-3.5" aria-hidden /> Download SVG
            </button>
            <CopyButton text={shareUrl} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Batch mode ─────────────────────────────────────────────────────────────

function BatchMode() {
  const [items, setItems] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [opts] = useState<QrOptions>({ size: 256, foreground: '#000000', background: '#ffffff', errorCorrectionLevel: 'M' })

  const loadFile = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(l => {
        const col = l.split(',')[0].trim()
        return col.length > 0
      }).map(l => l.split(',')[0].trim())
      setItems(lines)
      setDone(false)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read file')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }, [loadFile])

  const generate = useCallback(async () => {
    setProgress(0)
    setDone(false)
    setError(null)
    try {
      const results = await generateQrBatch(items, opts, idx => {
        setProgress(Math.round((idx / items.length) * 100))
      })
      if (results.length === 0) { setError('No valid items to generate'); setProgress(null); return }
      const zipFiles: Record<string, Uint8Array> = {}
      for (const r of results) zipFiles[r.name] = r.data
      const zipped = zipSync(zipFiles)
      const url = URL.createObjectURL(new Blob([zipped], { type: 'application/zip' }))
      const a = document.createElement('a')
      a.href = url; a.download = `qr-codes-${results.length}.zip`; a.click()
      URL.revokeObjectURL(url)
      setProgress(100)
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
      setProgress(null)
    }
  }, [items, opts])

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
        )}
        role="button"
        tabIndex={0}
        aria-label="Drop a .txt or .csv file here"
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
      >
        <p className="text-sm text-fg-muted">Drop a <code>.txt</code> or <code>.csv</code> file here, or click to browse</p>
        <p className="mt-1 text-xs text-fg-subtle">One URL or value per line. For CSV, the first column is used.</p>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.csv,text/plain,text/csv"
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">
            <span className="font-medium text-fg">{items.length}</span> item{items.length !== 1 ? 's' : ''} loaded
          </p>
          <div className="max-h-32 overflow-auto rounded-lg border border-border bg-bg-muted px-3 py-2">
            {items.slice(0, 20).map((item, i) => (
              <p key={i} className="truncate text-xs text-fg-muted font-mono">{item}</p>
            ))}
            {items.length > 20 && <p className="text-xs text-fg-subtle">…and {items.length - 20} more</p>}
          </div>
          {progress !== null && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-fg-subtle">{progress}%</p>
            </div>
          )}
          {done && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Done — {items.length} QR codes downloaded as ZIP
            </p>
          )}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
            </div>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={progress !== null && !done}
            className={cn(
              'rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white',
              'transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            )}
          >
            Generate {items.length} QR code{items.length !== 1 ? 's' : ''} → ZIP
          </button>
        </div>
      )}
    </div>
  )
}

// ── FAQ ────────────────────────────────────────────────────────────────────

const FAQ = [
  { q: 'What does error correction mean?', a: 'QR codes can recover from partial damage or obstruction. Higher error correction (H) can restore up to 30% of damaged data, but requires more modules (dots), making the code denser. L is fine for clean digital use; H is better for printed codes that might get dirty or worn.' },
  { q: 'Should I use PNG or SVG?', a: 'SVG is best for print, large-format display, or any use where the code will be scaled up — it is infinitely crisp at any size. PNG is better for web use, messaging apps, and anywhere vector files are not supported.' },
  { q: 'How many characters can a QR code hold?', a: 'Up to 4,296 alphanumeric characters or 2,953 bytes with error correction level L. Short URLs work best — very long content produces dense codes that are harder to scan, especially on smaller prints. Use a URL shortener if your content is long.' },
  { q: 'Do QR codes expire?', a: 'The QR code itself never expires — it is just an encoding of text. What can "break" is the destination: if the URL the code points to goes offline or changes, the code still scans successfully but leads nowhere. The code is permanent; the destination is not.' },
  { q: 'What format should the CSV be for batch mode?', a: 'A plain text file with one URL or value per line, or a CSV where the first column contains the values. Empty lines are skipped. Headers are included if present — remove them before uploading if the first row is not a real QR code value.' },
  { q: 'Can I customise the QR code colors?', a: 'Yes — you can set any foreground and background color. Make sure there is sufficient contrast between the two: dark on light, or light on dark. Scanners rely on contrast to distinguish modules from background.' },
]

// ── Page ───────────────────────────────────────────────────────────────────

export default function QrCodeGeneratorPage() {
  const [mode, setMode] = useState<'quick' | 'batch'>('quick')

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Web Tools', href: '/web-tools' },
          { label: 'QR Code Generator' },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">QR Code Generator</h1>
        <p className="mt-2 text-base text-fg-muted">Generate QR codes for any URL. Single or batch from CSV. Download PNG or SVG.</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden />
          Runs entirely in your browser.
        </div>
      </div>

      <div className="space-y-6">
        {/* Mode tabs */}
        <div className="flex rounded-xl border border-border overflow-hidden w-fit" role="tablist">
          {(['quick', 'batch'] as const).map(m => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                'px-5 py-2 text-sm font-medium capitalize transition-colors',
                mode === m ? 'bg-primary text-white' : 'text-fg-muted hover:text-fg',
              )}
            >
              {m === 'quick' ? 'Single QR' : 'Batch from CSV'}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">
          {mode === 'quick' ? <QuickMode /> : <BatchMode />}
        </div>

        <FAQAccordion items={FAQ} />
        <RelatedToolsStrip slugs={['favicon-generator', 'color-picker', 'base64']} />
        <RelatedArticlesStrip slugs={[]} />
      </div>
    </div>
  )
}
