'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Loader2, RefreshCcw, Sparkles } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { config } from '@/content/tools/background-remover'
import { removeBackground, type BackgroundRemovalPreset } from '@/lib/converters/background-remover'
import { cn } from '@/lib/utils/cn'
import { formatBytes } from '@/lib/utils/download'

type Phase = 'idle' | 'ready' | 'processing' | 'done' | 'error'

type ResultState = {
  url: string
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

const PRESETS: Array<{ value: BackgroundRemovalPreset; label: string; hint: string }> = [
  { value: 'balanced', label: 'Balanced', hint: 'Default' },
  { value: 'sharper-edges', label: 'Sharper edges', hint: 'Products' },
  { value: 'softer-edges', label: 'Softer edges', hint: 'Hair' },
]

function stepText(progress: number): string {
  if (progress < 15) return 'Preparing background remover'
  if (progress < 55) return 'Finding the foreground'
  if (progress < 85) return 'Refining the cutout'
  if (progress < 100) return 'Exporting transparent PNG'
  return 'Transparent PNG ready'
}

function isAcceptedImage(file: File): boolean {
  return config.accepts.includes(file.type)
}

function PreviewFrame({
  title,
  src,
  checkerboard = false,
  aspectRatio,
}: {
  title: string
  src: string
  checkerboard?: boolean
  aspectRatio: number
}) {
  return (
    <section className="min-w-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
      </div>
      <div
        className={cn(
          'overflow-hidden rounded-lg border border-border bg-bg-muted',
          checkerboard && 'bg-[length:20px_20px]'
        )}
        style={{
          aspectRatio,
          backgroundImage: checkerboard
            ? 'linear-gradient(45deg, rgba(120,113,108,.22) 25%, transparent 25%), linear-gradient(-45deg, rgba(120,113,108,.22) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(120,113,108,.22) 75%), linear-gradient(-45deg, transparent 75%, rgba(120,113,108,.22) 75%)'
            : undefined,
          backgroundPosition: checkerboard ? '0 0, 0 10px, 10px -10px, -10px 0' : undefined,
        }}
      >
        <img
          src={src}
          alt={title}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
    </section>
  )
}

function BestPracticesPanel() {
  return (
    <section className="mb-6 rounded-lg border border-border bg-bg-elevated p-4">
      <h2 className="text-sm font-semibold text-fg">Best results</h2>
      <div className="mt-3 grid gap-4 text-sm leading-6 text-fg-muted md:grid-cols-3">
        <div>
          <p className="font-medium text-fg">Works best for</p>
          <p>Clear subjects with visible separation from the background: people, pets, products, vehicles, signs, buildings, and objects on simple surfaces.</p>
        </div>
        <div>
          <p className="font-medium text-fg">Harder cases</p>
          <p>Busy scenes, similar colors, glass, smoke, shadows, motion blur, fine hair, fur, grass, and multiple possible subjects can need cleanup.</p>
        </div>
        <div>
          <p className="font-medium text-fg">Preset tips</p>
          <p>Use Balanced first. Choose Sharper edges for products and signs. Choose Softer edges for hair, fur, fabric, plants, and natural subjects.</p>
        </div>
      </div>
    </section>
  )
}

export default function BackgroundRemoverPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ResultState | null>(null)
  const [preset, setPreset] = useState<BackgroundRemovalPreset>('balanced')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const processingRef = useRef(false)
  const previewUrlRef = useRef<string | null>(null)
  const resultUrlRef = useRef<string | null>(null)

  const aspectRatio = dimensions ? dimensions.width / dimensions.height : 4 / 3

  useEffect(() => {
    previewUrlRef.current = previewUrl
  }, [previewUrl])

  useEffect(() => {
    resultUrlRef.current = result?.url ?? null
  }, [result?.url])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
    }
  }, [])

  const resetResult = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url)
    setResult(null)
    setProgress(0)
    setError(null)
  }, [result])

  const handleAdd = useCallback((files: File[]) => {
    const next = files.find(isAcceptedImage)
    if (!next) {
      setError('Unsupported file type. Use PNG, JPG, JPEG, or WebP.')
      setPhase('error')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (result?.url) URL.revokeObjectURL(result.url)

    const url = URL.createObjectURL(next)
    setFile(next)
    setPreviewUrl(url)
    setResult(null)
    setProgress(0)
    setError(null)
    setPhase('ready')

    const img = new Image()
    img.onload = () => setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => setDimensions(null)
    img.src = url
  }, [previewUrl, result?.url])

  const handleReset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (result?.url) URL.revokeObjectURL(result.url)
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setPreset('balanced')
    setProgress(0)
    setError(null)
    setDimensions(null)
    setPhase('idle')
    processingRef.current = false
  }, [previewUrl, result?.url])

  const handleRemove = useCallback(async () => {
    if (!file || processingRef.current) return
    processingRef.current = true
    resetResult()
    setPhase('processing')
    setProgress(0)

    try {
      const output = await removeBackground(file, { preset }, (pct) => {
        setProgress(Math.max(0, Math.min(100, Math.round(pct))))
      })
      const url = URL.createObjectURL(output.outputBlob)
      setResult({
        url,
        confidence: output.confidence,
        warnings: output.warnings,
      })
      setProgress(100)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background removal failed.')
      setPhase('error')
    } finally {
      processingRef.current = false
    }
  }, [file, preset, resetResult])

  const handleDownload = useCallback(() => {
    if (!result || !file) return
    const base = file.name.replace(/\.[^.]+$/, '') || 'cutout'
    const a = document.createElement('a')
    a.href = result.url
    a.download = `${base}-transparent.png`
    a.click()
  }, [file, result])

  const statusTone = useMemo(() => {
    if (!result) return 'border-border bg-bg-elevated text-fg-muted'
    if (result.confidence === 'high') return 'border-success/30 bg-success/10 text-success'
    if (result.confidence === 'medium') return 'border-warning/30 bg-warning/10 text-warning'
    return 'border-error/30 bg-error/10 text-error'
  }, [result])

  const hasImage = Boolean(file && previewUrl)
  const isProcessing = phase === 'processing'

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: 'Image Editing', href: '/image-editing' },
        { label: config.title },
      ]} />

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          Background Remover
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
          Remove clear foregrounds locally in your browser. Difficult edges, clutter, glass, shadows, and ambiguous scenes may need cleanup.
        </p>
      </header>

      {!hasImage && (
        <>
          <div className="mb-6">
            <Dropzone
              accepts={config.accepts}
              acceptsExt={config.acceptsExt}
              onAdd={handleAdd}
              disabled={isProcessing}
            />
          </div>
          <BestPracticesPanel />
        </>
      )}

      {hasImage && file && previewUrl && (
        <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="min-w-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <PreviewFrame title="Original" src={previewUrl} aspectRatio={aspectRatio} />
              {result ? (
                <PreviewFrame title="Transparent PNG" src={result.url} checkerboard aspectRatio={aspectRatio} />
              ) : (
                <div className="min-w-0">
                  <h2 className="mb-2 text-sm font-semibold text-fg">Transparent PNG</h2>
                  <div
                    className="flex items-center justify-center rounded-lg border border-dashed border-border bg-bg-muted text-sm text-fg-subtle"
                    style={{ aspectRatio }}
                  >
                    {isProcessing ? stepText(progress) : 'Run background removal to preview result'}
                  </div>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="rounded-lg border border-border bg-bg-elevated px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-sm text-fg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                  <span>{stepText(progress)}</span>
                  <span className="ml-auto font-medium text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {(phase === 'done' || phase === 'error') && (
              <div className={cn('rounded-lg border px-4 py-3 text-sm', phase === 'error' ? 'border-error/30 bg-error/10 text-error' : statusTone)}>
                {phase === 'error' ? (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p>{error ?? 'Background removal failed. The original image is still available.'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <p className="font-medium">Result confidence: {result?.confidence}</p>
                    </div>
                    {result?.warnings.map((warning) => (
                      <p key={warning} className="text-fg-muted">{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-bg-elevated p-4">
              <div className="mb-3">
                <p className="truncate text-sm font-medium text-fg">{file.name}</p>
                <p className="text-xs text-fg-subtle">
                  {formatBytes(file.size)}
                  {dimensions ? ` · ${dimensions.width}×${dimensions.height}` : ''}
                </p>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-fg">Quality preset</label>
                <div className="grid gap-2">
                  {PRESETS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPreset(opt.value)}
                      disabled={isProcessing}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                        preset === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-bg-muted text-fg-muted hover:border-primary hover:text-primary',
                        isProcessing && 'cursor-not-allowed opacity-60'
                      )}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs opacity-70">{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isProcessing}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
                    isProcessing
                      ? 'cursor-not-allowed bg-bg-muted text-fg-subtle'
                      : 'bg-primary text-primary-fg hover:bg-primary-hover active:scale-[0.98]'
                  )}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {result ? 'Run again' : 'Remove background'}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!result || isProcessing}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors',
                    result && !isProcessing
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                      : 'cursor-not-allowed border-border bg-bg-muted text-fg-subtle'
                  )}
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-elevated px-4 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Replace image
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {hasImage && <BestPracticesPanel />}

      <div className="mb-12">
        <FAQAccordion items={config.faq} pageUrl={`https://convertyard.com/${config.slug}`} />
      </div>

      <RelatedToolsStrip slugs={config.relatedTools} />
    </div>
  )
}
