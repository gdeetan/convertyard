'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Download,
  ImagePlus,
  Lock,
  RefreshCcw,
  Upload,
} from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { config } from '@/content/tools/og-image-generator'

const WIDTH = 1200
const HEIGHT = 630

type TemplateId = 'launch' | 'editorial' | 'developer' | 'minimal' | 'photo'
type ExportType = 'image/png' | 'image/jpeg' | 'image/webp'

interface OgState {
  template: TemplateId
  title: string
  subtitle: string
  eyebrow: string
  siteName: string
  imageUrl: string
  background: string
  accent: string
  text: string
  muted: string
  imagePath: string
}

const TEMPLATES: Array<{
  id: TemplateId
  name: string
  state: Pick<OgState, 'background' | 'accent' | 'text' | 'muted'>
}> = [
  { id: 'launch', name: 'Launch', state: { background: '#0f172a', accent: '#f97316', text: '#f8fafc', muted: '#cbd5e1' } },
  { id: 'editorial', name: 'Editorial', state: { background: '#fafaf9', accent: '#2563eb', text: '#18181b', muted: '#52525b' } },
  { id: 'developer', name: 'Developer', state: { background: '#111827', accent: '#22c55e', text: '#f9fafb', muted: '#9ca3af' } },
  { id: 'minimal', name: 'Minimal', state: { background: '#ffffff', accent: '#111827', text: '#111827', muted: '#4b5563' } },
  { id: 'photo', name: 'Photo overlay', state: { background: '#1f2937', accent: '#facc15', text: '#ffffff', muted: '#e5e7eb' } },
]

const DEFAULT_STATE: OgState = {
  template: 'launch',
  title: 'Design Open Graph images that people notice',
  subtitle: 'Create a crisp 1200x630 social preview in your browser. No upload, no watermark.',
  eyebrow: 'ConvertYard Web Tools',
  siteName: 'convertyard.com',
  imageUrl: 'https://convertyard.com/og-image.png',
  background: '#0f172a',
  accent: '#f97316',
  text: '#f8fafc',
  muted: '#cbd5e1',
  imagePath: '',
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    } else {
      line = test
    }
  }

  if (line && lines.length < maxLines) lines.push(line)
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight))
  return lines.length
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }, [value])

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-muted px-3 py-2 text-xs font-medium text-fg transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  )
}

export default function OgImageGeneratorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [state, setState] = useState<OgState>(DEFAULT_STATE)
  const [imageName, setImageName] = useState('')

  const metaHtml = useMemo(() => {
    return `<meta property="og:image" content="${state.imageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="${state.imageUrl}" />`
  }, [state.imageUrl])

  const nextSnippet = useMemo(() => {
    return `export const metadata = {
  openGraph: {
    images: [{ url: '${state.imageUrl}', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['${state.imageUrl}'],
  },
}`
  }, [state.imageUrl])

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = WIDTH
    canvas.height = HEIGHT
    ctx.clearRect(0, 0, WIDTH, HEIGHT)

    const grd = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
    grd.addColorStop(0, state.background)
    grd.addColorStop(1, state.template === 'minimal' ? '#f3f4f6' : state.accent)
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    if (state.template === 'photo' && imageRef.current) {
      ctx.globalAlpha = 0.58
      ctx.drawImage(imageRef.current, 0, 0, WIDTH, HEIGHT)
      ctx.globalAlpha = 1
      const overlay = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0.72)')
      overlay.addColorStop(1, 'rgba(0, 0, 0, 0.22)')
      ctx.fillStyle = overlay
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }

    if (state.template === 'developer') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
      for (let x = 72; x < WIDTH; x += 64) {
        ctx.fillRect(x, 0, 1, HEIGHT)
      }
      for (let y = 58; y < HEIGHT; y += 64) {
        ctx.fillRect(0, y, WIDTH, 1)
      }
    }

    if (state.template === 'editorial' || state.template === 'minimal') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.72)'
      roundRect(ctx, 56, 54, WIDTH - 112, HEIGHT - 108, 28)
      ctx.fill()
    }

    ctx.fillStyle = state.accent
    roundRect(ctx, 76, 72, 72, 72, 18)
    ctx.fill()
    if (state.imagePath && imageRef.current && state.template !== 'photo') {
      ctx.save()
      roundRect(ctx, 76, 72, 72, 72, 18)
      ctx.clip()
      ctx.drawImage(imageRef.current, 76, 72, 72, 72)
      ctx.restore()
    } else {
      ctx.fillStyle = state.template === 'editorial' || state.template === 'minimal' ? '#ffffff' : state.background
      ctx.font = '700 32px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(state.siteName.slice(0, 1).toUpperCase(), 112, 120)
      ctx.textAlign = 'left'
    }

    ctx.fillStyle = state.accent
    ctx.font = '700 25px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(state.eyebrow, 176, 116)

    ctx.fillStyle = state.text
    ctx.font = state.title.length > 72
      ? '800 56px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      : '800 66px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    const titleLines = drawWrappedText(ctx, state.title, 76, 258, 880, state.title.length > 72 ? 64 : 76, 3)

    ctx.fillStyle = state.muted
    ctx.font = '400 31px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    drawWrappedText(ctx, state.subtitle, 80, 288 + titleLines * 72, 820, 42, 2)

    ctx.fillStyle = state.accent
    ctx.fillRect(76, HEIGHT - 92, 152, 8)
    ctx.fillStyle = state.muted
    ctx.font = '500 25px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(state.siteName, 76, HEIGHT - 50)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)'
    ctx.lineWidth = 2
    ctx.strokeRect(48, 48, WIDTH - 96, HEIGHT - 96)
  }, [state])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  useEffect(() => {
    if (!state.imagePath) {
      imageRef.current = null
      renderCanvas()
      return
    }
    const image = new Image()
    image.onload = () => {
      imageRef.current = image
      renderCanvas()
    }
    image.src = state.imagePath
  }, [renderCanvas, state.imagePath])

  const update = <K extends keyof OgState>(key: K, value: OgState[K]) => {
    setState(prev => ({ ...prev, [key]: value }))
  }

  const applyTemplate = (template: TemplateId) => {
    const picked = TEMPLATES.find(item => item.id === template)
    if (!picked) return
    setState(prev => ({ ...prev, template, ...picked.state }))
  }

  const handleImage = (file: File | undefined) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageName(file.name)
    setState(prev => ({ ...prev, imagePath: url }))
  }

  const exportImage = (type: ExportType) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ext = type === 'image/jpeg' ? 'jpg' : type.split('/')[1]
      a.href = url
      a.download = `og-image.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    }, type, 0.92)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Web Tools', href: '/web-tools' },
          { label: 'OG Image Generator' },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">OG Image Generator</h1>
        <p className="mt-2 max-w-2xl text-base text-fg-muted">
          Create a 1200x630 social preview image for blog posts, product pages, docs, launches, and link shares.
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden />
          Runs entirely in your browser. No uploads, accounts, or watermarks.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="rounded-xl border border-border bg-bg-elevated p-3 shadow-sm">
            <canvas
              ref={canvasRef}
              className="aspect-[1200/630] w-full rounded-lg border border-border bg-bg-muted"
              aria-label="Open Graph image preview"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(['image/png', 'image/jpeg', 'image/webp'] as ExportType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => exportImage(type)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Download className="h-4 w-4" />
                {type === 'image/png' ? 'Download PNG' : type === 'image/jpeg' ? 'Download JPEG' : 'Download WebP'}
              </button>
            ))}
          </div>

          <section className="rounded-xl border border-border bg-bg-elevated p-5">
            <h2 className="text-lg font-semibold text-fg">Meta tags</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Host the downloaded image at the URL below, then paste one of these snippets into your site.
            </p>
            <label className="mt-4 block text-xs font-medium text-fg-muted" htmlFor="image-url">Public image URL</label>
            <input
              id="image-url"
              value={state.imageUrl}
              onChange={e => update('imageUrl', e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-bg-muted px-3 py-2 text-sm text-fg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-fg">HTML</p>
                  <CopyButton value={metaHtml} label="Copy HTML" />
                </div>
                <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-bg-muted p-3 text-xs text-fg-muted"><code>{metaHtml}</code></pre>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-fg">Next.js</p>
                  <CopyButton value={nextSnippet} label="Copy Next.js" />
                </div>
                <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-bg-muted p-3 text-xs text-fg-muted"><code>{nextSnippet}</code></pre>
              </div>
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-bg-elevated p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-fg">Customize</h2>
              <button
                type="button"
                onClick={() => {
                  if (state.imagePath) URL.revokeObjectURL(state.imagePath)
                  setImageName('')
                  setState(DEFAULT_STATE)
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:text-fg"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-fg-muted">Template</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors',
                        state.template === template.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-bg-muted text-fg-muted hover:border-border-strong hover:text-fg',
                      )}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-medium text-fg-muted">Eyebrow</span>
                <input value={state.eyebrow} onChange={e => update('eyebrow', e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-bg-muted px-3 py-2 text-sm text-fg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-fg-muted">Title</span>
                <textarea value={state.title} onChange={e => update('title', e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-lg border border-border bg-bg-muted px-3 py-2 text-sm text-fg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-fg-muted">Subtitle</span>
                <textarea value={state.subtitle} onChange={e => update('subtitle', e.target.value)} rows={3} className="mt-1 w-full resize-none rounded-lg border border-border bg-bg-muted px-3 py-2 text-sm text-fg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-fg-muted">Site name</span>
                <input value={state.siteName} onChange={e => update('siteName', e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-bg-muted px-3 py-2 text-sm text-fg outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </label>

              <div className="grid grid-cols-2 gap-3">
                {([
                  ['background', 'Background'],
                  ['accent', 'Accent'],
                  ['text', 'Text'],
                  ['muted', 'Muted text'],
                ] as Array<[keyof OgState, string]>).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-xs font-medium text-fg-muted">{label}</span>
                    <div className="mt-1 flex overflow-hidden rounded-lg border border-border bg-bg-muted">
                      <input
                        type="color"
                        value={String(state[key])}
                        onChange={e => update(key, e.target.value)}
                        className="h-10 w-11 border-0 bg-transparent p-1"
                        aria-label={label}
                      />
                      <input
                        value={String(state[key])}
                        onChange={e => update(key, e.target.value)}
                        className="min-w-0 flex-1 bg-transparent px-2 text-xs font-mono text-fg outline-none"
                      />
                    </div>
                  </label>
                ))}
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg-muted px-4 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-primary hover:text-primary">
                <Upload className="h-4 w-4" />
                {imageName || 'Upload logo or photo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="sr-only"
                  onChange={e => handleImage(e.target.files?.[0])}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-bg-elevated p-5">
            <h2 className="text-lg font-semibold text-fg">Social previews</h2>
            <div className="mt-4 space-y-3">
              {['Slack / Discord', 'LinkedIn', 'X summary card'].map(label => (
                <div key={label} className="rounded-lg border border-border bg-bg-muted p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-fg-muted">
                    <ImagePlus className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <div className="aspect-[1200/630] rounded-md border border-border bg-cover bg-center" style={{ backgroundImage: `url(${canvasRef.current?.toDataURL('image/png') ?? ''})` }} />
                  <p className="mt-2 truncate text-xs font-medium text-fg">{state.title}</p>
                  <p className="truncate text-xs text-fg-subtle">{state.siteName}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          ['Start with the headline', 'Use the page title or launch message. Keep it under 80 characters when possible so previews stay readable.'],
          ['Keep the edges clean', 'Important text should stay inside the visible safe area. Social apps may crop tight borders in compact feeds.'],
          ['Paste complete tags', 'Use both Open Graph and Twitter tags. That covers link previews in feeds, chat apps, docs, and team tools.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl border border-border bg-bg-elevated p-5">
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <FAQAccordion items={config.faq} />
      </section>

      <section className="mt-12">
        <RelatedToolsStrip slugs={config.relatedTools} />
      </section>
    </div>
  )
}
