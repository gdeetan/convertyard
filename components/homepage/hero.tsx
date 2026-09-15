'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Lock, UploadCloud, Download, RefreshCcw, AlertCircle, FileImage } from 'lucide-react'
import { zipSync } from 'fflate'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'
import { convertViaWorker } from '@/lib/converters/vips-client'

type OutputFormat = 'webp' | 'avif' | 'jpg' | 'png' | 'tiff'
type ConverterState = 'idle' | 'converting' | 'done' | 'error'

interface FileResult {
  blob: Blob
  previewUrl: string
  originalSize: number
  outputSize: number
  fileName: string
}

const OUTPUT_FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
  { value: 'jpg',  label: 'JPG'  },
  { value: 'png',  label: 'PNG'  },
  { value: 'tiff', label: 'TIFF' },
]

const ACCEPT_MIME = 'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,image/gif,image/tiff,image/bmp'
const ACCEPT_EXT_RE = /\.(jpe?g|png|webp|avif|heic|heif|gif|tiff?|bmp)$/i

function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true
  return ACCEPT_EXT_RE.test(file.name)
}

function download(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function downloadZip(results: FileResult[], format: OutputFormat) {
  const map: Record<string, Uint8Array> = {}
  for (const r of results) {
    map[r.fileName] = new Uint8Array(await r.blob.arrayBuffer())
  }
  const zipped = zipSync(map)
  const blob = new Blob([zipped as BlobPart], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  download(url, `convertyard-${format}.zip`)
  setTimeout(() => URL.revokeObjectURL(url), 5_000)
}

function MiniConverter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [format, setFormat] = useState<OutputFormat>('webp')
  const [state, setState] = useState<ConverterState>('idle')
  const [results, setResults] = useState<FileResult[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })

  const run = useCallback(async (files: File[]) => {
    const images = files.filter(isImageFile)
    if (images.length === 0) {
      setErrorMsg('Drop an image (JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP).')
      setState('error')
      return
    }

    setState('converting')
    setProgress({ done: 0, total: images.length })
    const out: FileResult[] = []

    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      try {
        const outFile = await convertViaWorker(file, format, { quality: 80 })
        out.push({
          blob: outFile,
          previewUrl: URL.createObjectURL(outFile),
          originalSize: file.size,
          outputSize: outFile.size,
          fileName: outFile.name,
        })
      } catch {
        // skip broken file, keep going
      }
      setProgress({ done: i + 1, total: images.length })
    }

    if (out.length === 0) {
      setErrorMsg('Conversion failed for every file. Try different images.')
      setState('error')
      return
    }
    setResults(out)
    setState('done')
  }, [format])

  const reset = () => {
    results.forEach((r) => URL.revokeObjectURL(r.previewUrl))
    setResults([])
    setState('idle')
    setErrorMsg('')
    setProgress({ done: 0, total: 0 })
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length) run(files)
  }

  const totalOriginal = results.reduce((s, r) => s + r.originalSize, 0)
  const totalOutput = results.reduce((s, r) => s + r.outputSize, 0)
  const savedPct = totalOriginal
    ? Math.max(0, Math.round(((totalOriginal - totalOutput) / totalOriginal) * 100))
    : 0

  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-1 shadow-lg">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-error/40" />
          <div className="h-3 w-3 rounded-full bg-warning/40" />
          <div className="h-3 w-3 rounded-full bg-success/40" />
        </div>
        <span className="text-xs text-fg-subtle">Batch image converter</span>
      </div>

      <div className="p-4">
        {/* Format selector — always visible */}
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-medium text-fg-muted">Convert to</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Output format">
            {OUTPUT_FORMATS.map((f) => {
              const active = f.value === format
              return (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={state === 'converting'}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    active
                      ? 'border-primary bg-primary text-primary-fg'
                      : 'border-border bg-bg text-fg-muted hover:border-primary/60 hover:text-fg',
                    state === 'converting' && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Idle: dropzone */}
        {state === 'idle' && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_MIME}
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                if (files.length) run(files)
                e.target.value = ''
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop images here or press Enter to open file picker"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  inputRef.current?.click()
                }
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false)
              }}
              onDrop={onDrop}
              className={cn(
                'flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl',
                'border-2 border-dashed transition-all duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                dragOver
                  ? 'border-primary bg-bg-muted scale-[1.01]'
                  : 'border-border hover:border-primary hover:bg-bg-muted',
              )}
            >
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl border border-border',
                dragOver && 'border-primary bg-bg-muted',
              )}>
                <UploadCloud className={cn('h-6 w-6', dragOver ? 'text-primary' : 'text-fg-muted')} aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-fg">
                  {dragOver ? `Release to convert to ${format.toUpperCase()}` : `Drop images to convert to ${format.toUpperCase()}`}
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  or <span className="text-primary underline underline-offset-2">click to browse</span> · batch supported
                </p>
              </div>
              <p className="text-xs text-fg-subtle">JPG · PNG · WebP · AVIF · HEIC · GIF · TIFF · BMP</p>
            </div>
          </>
        )}

        {/* Converting */}
        {state === 'converting' && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
            <p className="text-sm text-fg-muted" role="status" aria-live="polite">
              Converting {progress.done} of {progress.total}…
            </p>
          </div>
        )}

        {/* Done */}
        {state === 'done' && results.length > 0 && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="rounded-lg border border-border bg-bg-muted/40 px-3 py-2 text-xs text-fg-muted">
              <span className="font-semibold text-fg">{results.length}</span> file{results.length > 1 ? 's' : ''} converted to{' '}
              <span className="font-semibold text-fg">{format.toUpperCase()}</span>
              {savedPct > 0 && (
                <>
                  {' · '}saved{' '}
                  <span className="font-semibold text-success">{savedPct}%</span>{' '}
                  ({formatBytes(totalOriginal)} → {formatBytes(totalOutput)})
                </>
              )}
            </div>

            {/* File list */}
            <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-bg px-2.5 py-2">
                  <FileImage className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-fg" title={r.fileName}>{r.fileName}</p>
                    <p className="text-[11px] text-fg-muted">
                      {formatBytes(r.originalSize)} → {formatBytes(r.outputSize)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => download(r.previewUrl, r.fileName)}
                    className="rounded-md border border-border p-1.5 text-fg-muted transition-colors hover:border-primary hover:text-primary"
                    aria-label={`Download ${r.fileName}`}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (results.length === 1) download(results[0].previewUrl, results[0].fileName)
                  else downloadZip(results, format)
                }}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-4',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                )}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {results.length === 1 ? `Download ${format.toUpperCase()}` : `Download all (ZIP)`}
              </button>
              <button
                type="button"
                onClick={reset}
                className={cn(
                  'flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded',
                )}
                aria-label="Try another batch"
              >
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset
              </button>
            </div>

            <p className="text-center text-xs text-fg-subtle">
              These files never left your device.
            </p>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="h-8 w-8 text-error" aria-hidden="true" />
            <p className="text-sm text-fg-muted" role="alert">{errorMsg}</p>
            <button
              type="button"
              onClick={reset}
              className={cn(
                'text-sm font-medium text-primary hover:underline',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm',
              )}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-5 lg:gap-12">
        {/* Left: copy — 2/5 width on desktop */}
        <div className="lg:col-span-2">
          <p
            className="mb-4 hidden text-sm font-semibold tracking-wide text-primary lg:block"
            aria-hidden="true"
          >
            ConvertYard
          </p>

          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl"
          >
            Your files never
            <br />
            leave your computer.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
            Convert images, PDFs, videos, or audio files, up to 1,000 files per batch, locally, in your browser, so nothing is uploaded.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="#tools"
              className={cn(
                'inline-flex items-center rounded-xl px-6 py-3',
                'bg-primary text-primary-fg text-base font-semibold',
                'transition-colors hover:bg-primary-hover',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                'min-h-[48px]',
              )}
            >
              Browse tools →
            </Link>
            <Link
              href="#how-it-works"
              className={cn(
                'inline-flex items-center rounded-xl border border-border px-6 py-3',
                'text-base font-semibold text-fg-muted',
                'transition-colors hover:border-border-strong hover:text-fg',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                'min-h-[48px]',
              )}
            >
              How it works
            </Link>
          </div>

          <p className="mt-6 flex items-center gap-1.5 text-sm text-fg-subtle">
            <Lock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            No accounts. No uploads. No watermarks. Clean tool UIs.
          </p>
        </div>

        {/* Right: mini-converter — 3/5 width on desktop, aligned to Tools menu */}
        <div className="lg:col-span-3">
          <MiniConverter />
        </div>
      </div>
    </section>
  )
}
