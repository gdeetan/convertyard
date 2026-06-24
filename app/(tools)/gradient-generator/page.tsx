'use client'

import { useState, useRef, useCallback } from 'react'
import { Copy, Check, Lock, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { RelatedArticlesStrip } from '@/components/tool-shell/related-articles-strip'
import { buildCss, PRESETS } from '@/lib/dev-tools/gradient'
import type { GradientState, ColorStop, GradientType } from '@/lib/dev-tools/gradient'

let _idCounter = 0
function newId() { return `stop-${++_idCounter}` }

function deepClone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) }

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
        'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Copied!' : 'Copy CSS'}
    </button>
  )
}

function GradientBar({
  state,
  onMoveStop,
}: {
  state: GradientState
  onMoveStop: (id: string, position: number) => void
}) {
  const barRef = useRef<HTMLDivElement>(null)

  const startDrag = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault()
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()

    const onMove = (ev: PointerEvent) => {
      const pct = Math.round(Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100)))
      onMoveStop(id, pct)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [onMoveStop])

  const css = buildCss(state)

  return (
    <div className="relative" style={{ height: '48px' }}>
      <div
        ref={barRef}
        className="h-10 w-full rounded-lg border border-border"
        style={{ background: css }}
        aria-hidden
      />
      {state.stops.map(stop => (
        <div
          key={stop.id}
          onPointerDown={e => startDrag(e, stop.id)}
          style={{ left: `${stop.position}%`, top: '50%', transform: 'translate(-50%, -50%)', background: stop.color, boxSizing: 'border-box' } as React.CSSProperties}
          className="absolute h-6 w-6 cursor-grab active:cursor-grabbing rounded-full border-2 border-white shadow-md"
          role="slider"
          aria-label={`Color stop at ${stop.position}%`}
          aria-valuenow={stop.position}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') onMoveStop(stop.id, Math.max(0, stop.position - 1))
            if (e.key === 'ArrowRight') onMoveStop(stop.id, Math.min(100, stop.position + 1))
          }}
        />
      ))}
    </div>
  )
}

const FAQ = [
  { q: 'What gradient types are supported?', a: 'Linear (direction + angle), radial (circle from center), and conic (sweep from an angle). All three map directly to CSS gradient functions.' },
  { q: 'How do I add or remove color stops?', a: 'Click "Add stop" to add a new stop at 50%. Click the trash icon next to any stop to remove it. Drag the handles on the gradient bar to reposition stops.' },
  { q: 'Can I export the gradient as an image?', a: 'Yes — click "Export PNG" to download the gradient rendered at the size you choose.' },
  { q: 'What does the CSS output look like?', a: 'The output is a valid CSS background value, for example: linear-gradient(135deg, #f97316 0%, #ec4899 100%). Paste it directly into your stylesheet or a style attribute.' },
  { q: 'What is a conic gradient?', a: 'A conic gradient sweeps colors around a center point like a pie chart or color wheel, rather than moving linearly across the element. It was added to CSS in 2021 and is well supported in all modern browsers.' },
]

export default function GradientGeneratorPage() {
  const [state, setState] = useState<GradientState>(deepClone(PRESETS[0].state))

  const css = buildCss(state)

  const setType = (type: GradientType) => setState(s => ({ ...s, type }))
  const setAngle = (angle: number) => setState(s => ({ ...s, angle }))

  const moveStop = useCallback((id: string, position: number) => {
    setState(s => ({ ...s, stops: s.stops.map(st => st.id === id ? { ...st, position } : st) }))
  }, [])

  const changeColor = (id: string, color: string) => {
    setState(s => ({ ...s, stops: s.stops.map(st => st.id === id ? { ...st, color } : st) }))
  }

  const addStop = () => {
    setState(s => ({
      ...s,
      stops: [...s.stops, { id: newId(), color: '#ffffff', position: 50 }],
    }))
  }

  const removeStop = (id: string) => {
    setState(s => {
      if (s.stops.length <= 2) return s
      return { ...s, stops: s.stops.filter(st => st.id !== id) }
    })
  }

  const exportPng = useCallback(() => {
    const size = 1200
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = Math.round(size * 0.5)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sorted = [...state.stops].sort((a, b) => a.position - b.position)
    if (state.type === 'linear') {
      const rad = (state.angle * Math.PI) / 180
      const grd = ctx.createLinearGradient(
        canvas.width / 2 - (Math.cos(rad) * canvas.width) / 2,
        canvas.height / 2 - (Math.sin(rad) * canvas.height) / 2,
        canvas.width / 2 + (Math.cos(rad) * canvas.width) / 2,
        canvas.height / 2 + (Math.sin(rad) * canvas.height) / 2,
      )
      sorted.forEach(s => grd.addColorStop(s.position / 100, s.color))
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      const grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2,
      )
      sorted.forEach(s => grd.addColorStop(s.position / 100, s.color))
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'gradient.png'; a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [state])

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Web Tools', href: '/web-tools' },
          { label: 'Gradient Generator' },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">Gradient Generator</h1>
        <p className="mt-2 text-base text-fg-muted">Build CSS gradients visually. Copy the code or export as PNG.</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden />
          Runs entirely in your browser.
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-6">
          {/* Presets */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-fg-muted">Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setState(deepClone(preset.state))}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Type toggle */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-fg-muted">Type</p>
            <div className="flex rounded-lg border border-border overflow-hidden w-fit" role="group" aria-label="Gradient type">
              {(['linear', 'radial', 'conic'] as GradientType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'px-4 py-1.5 text-xs font-medium capitalize transition-colors',
                    state.type === t ? 'bg-primary text-white' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Angle (linear + conic) */}
          {(state.type === 'linear' || state.type === 'conic') && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-fg-muted w-12">Angle</label>
              <input
                type="range"
                min={0}
                max={359}
                value={state.angle}
                onChange={e => setAngle(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-xs text-right text-fg font-mono">{state.angle}°</span>
            </div>
          )}

          {/* Gradient bar */}
          <GradientBar state={state} onMoveStop={moveStop} />

          {/* Color stops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-fg-muted">Color stops</p>
              <button
                type="button"
                onClick={addStop}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add stop
              </button>
            </div>
            <div className="space-y-2">
              {[...state.stops].sort((a, b) => a.position - b.position).map(stop => (
                <div key={stop.id} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={e => changeColor(stop.id, e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded-md border border-border bg-transparent p-0.5 shrink-0"
                    aria-label="Stop color"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={stop.position}
                    onChange={e => moveStop(stop.id, Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-10 text-xs text-right font-mono text-fg">{stop.position}%</span>
                  <button
                    type="button"
                    onClick={() => removeStop(stop.id)}
                    disabled={state.stops.length <= 2}
                    className="text-fg-subtle hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label="Remove stop"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CSS output */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-fg-muted">CSS output</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-bg-muted px-3 py-2 font-mono text-xs text-fg break-all">
                background: {css};
              </code>
              <CopyButton text={`background: ${css};`} />
            </div>
          </div>

          {/* Export PNG */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={exportPng}
              className={cn(
                'rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg-muted',
                'transition-colors hover:border-border-strong hover:text-fg',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              )}
            >
              Export PNG (1200×600)
            </button>
          </div>
        </div>

        <FAQAccordion items={FAQ} />
        <RelatedToolsStrip slugs={['color-picker', 'favicon-generator', 'image-compressor']} />
        <RelatedArticlesStrip slugs={[]} />
      </div>
    </div>
  )
}
