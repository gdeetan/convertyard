'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Lock, UploadCloud, Download, RefreshCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'

type ConverterState = 'idle' | 'converting' | 'done' | 'error'

interface Result {
  blob: Blob
  previewUrl: string
  originalSize: number
  webpSize: number
  fileName: string
}

// Canvas-based JPG→WebP conversion — no WASM, no deps, instant
function convertToWebP(file: File): Promise<Result> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const srcUrl = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(srcUrl)
        reject(new Error('Canvas not available'))
        return
      }
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(srcUrl)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Conversion failed'))
            return
          }
          const baseName = file.name.replace(/\.[^.]+$/, '')
          resolve({
            blob,
            previewUrl: URL.createObjectURL(blob),
            originalSize: file.size,
            webpSize: blob.size,
            fileName: `${baseName}.webp`,
          })
        },
        'image/webp',
        0.8
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(srcUrl)
      reject(new Error('Could not read image'))
    }

    img.src = srcUrl
  })
}

function download(result: Result) {
  const a = document.createElement('a')
  a.href = result.previewUrl
  a.download = result.fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ── Mini-converter ─────────────────────────────────────────────────────────

function MiniConverter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ConverterState>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const run = useCallback(async (file: File) => {
    // Validate type
    if (!['image/jpeg', 'image/jpg'].includes(file.type) && !file.name.toLowerCase().match(/\.jpe?g$/)) {
      setErrorMsg('Drop a JPG file to try the converter.')
      setState('error')
      return
    }

    setState('converting')
    try {
      const res = await convertToWebP(file)
      setResult(res)
      setState('done')
    } catch {
      setErrorMsg('Conversion failed. Try another image.')
      setState('error')
    }
  }, [])

  const reset = () => {
    if (result) URL.revokeObjectURL(result.previewUrl)
    setResult(null)
    setState('idle')
    setErrorMsg('')
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) run(file)
  }

  const savedPct = result
    ? Math.round(((result.originalSize - result.webpSize) / result.originalSize) * 100)
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
        <span className="text-xs text-fg-subtle">JPG → WebP converter</span>
      </div>

      <div className="p-4">
        {/* Idle: dropzone */}
        {state === 'idle' && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,.jpg,.jpeg"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) run(f)
                e.target.value = ''
              }}
            />
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop a JPG here or press Enter to open file picker"
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
                  : 'border-border hover:border-primary hover:bg-bg-muted'
              )}
            >
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl border border-border',
                dragOver && 'border-primary bg-bg-muted'
              )}>
                <UploadCloud className={cn('h-6 w-6', dragOver ? 'text-primary' : 'text-fg-muted')} aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-fg">
                  {dragOver ? 'Release to convert' : 'Drop a JPG to see ConvertYard in action'}
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  or <span className="text-primary underline underline-offset-2">click to browse</span>
                </p>
              </div>
              <p className="text-xs text-fg-subtle">Accepts .jpg · .jpeg</p>
            </div>
          </>
        )}

        {/* Converting */}
        {state === 'converting' && (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
            <p className="text-sm text-fg-muted" role="status" aria-live="polite">
              Converting…
            </p>
          </div>
        )}

        {/* Done */}
        {state === 'done' && result && (
          <div className="space-y-4">
            {/* Preview + stats */}
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.previewUrl}
                alt="Converted WebP preview"
                className="h-24 w-24 shrink-0 rounded-lg object-cover border border-border"
              />
              <div className="flex flex-col justify-center">
                <p className="text-sm font-medium text-fg">{result.fileName}</p>
                <p className="mt-1 text-xs text-fg-muted">
                  Original: {formatBytes(result.originalSize)}
                  <span className="mx-1">→</span>
                  WebP: {formatBytes(result.webpSize)}
                </p>
                {savedPct > 0 && (
                  <p className="mt-1 text-sm font-semibold text-success">
                    Saved {savedPct}%
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => download(result)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 px-4',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                )}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download WebP
              </button>
              <button
                type="button"
                onClick={reset}
                className={cn(
                  'flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded'
                )}
                aria-label="Try another file"
              >
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Try another
              </button>
            </div>

            <p className="text-center text-xs text-fg-subtle">
              This file never left your device.
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
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm'
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

// ── Hero ───────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
    >
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-5 lg:gap-16">
        {/* Left: copy — 3/5 width on desktop */}
        <div className="lg:col-span-3">
          {/* Eyebrow — desktop only */}
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
            Local-first conversion,
            <br />
            built for batches.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
            Convert thousands of images, PDFs, videos, and audio files entirely
            in your browser. Nothing uploads.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="#tools"
              className={cn(
                'inline-flex items-center rounded-xl px-6 py-3',
                'bg-primary text-primary-fg text-base font-semibold',
                'transition-colors hover:bg-primary-hover',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                'min-h-[48px]'
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
                'min-h-[48px]'
              )}
            >
              How it works
            </Link>
          </div>

          {/* Trust micro-line */}
          <p className="mt-6 flex items-center gap-1.5 text-sm text-fg-subtle">
            <Lock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            No accounts. No uploads. No watermarks. Clean tool UIs.
          </p>
        </div>

        {/* Right: mini-converter — 2/5 width on desktop */}
        <div className="lg:col-span-2">
          <MiniConverter />
        </div>
      </div>
    </section>
  )
}
