'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, Lock, Pipette } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { RelatedArticlesStrip } from '@/components/tool-shell/related-articles-strip'
import {
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToOklch, isValidHex,
} from '@/lib/dev-tools/color'
import type { RGB, HSL, OKLCH } from '@/lib/dev-tools/color'

const STORAGE_KEY = 'cy-recent-colors'
const MAX_RECENT = 12

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(hex: string) {
  try {
    const prev = loadRecent().filter(h => h !== hex)
    localStorage.setItem(STORAGE_KEY, JSON.stringify([hex, ...prev].slice(0, MAX_RECENT)))
  } catch { /* */ }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    saveRecent(text.startsWith('#') ? text : '')
  }, [text])
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'flex w-full items-center justify-between rounded-lg border border-border bg-bg-muted px-3 py-2',
        'text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      )}
    >
      <span className="font-medium text-fg mr-2 shrink-0">{label}</span>
      <span className="font-mono text-fg-muted truncate mr-2">{text}</span>
      {copied
        ? <Check className="h-3.5 w-3.5 text-green-500 shrink-0" aria-hidden />
        : <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
      }
    </button>
  )
}

function NumInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-6 shrink-0 text-xs font-medium text-fg-muted">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => {
          const v = Number(e.target.value)
          if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
        }}
        className={cn(
          'w-full rounded-md border border-border bg-bg-muted px-2 py-1 text-xs text-fg',
          'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        )}
      />
    </div>
  )
}

const FAQ = [
  { q: 'What color formats does this tool support?', a: 'HEX (e.g. #ff6b35), RGB (e.g. rgb(255, 107, 53)), HSL (e.g. hsl(17, 100%, 60%)), and OKLCH — a perceptually uniform color space that produces more natural gradients than HSL.' },
  { q: 'What is OKLCH?', a: 'OKLCH is a modern CSS color space (supported in all major browsers) where L is lightness (0–1), C is chroma (roughly saturation, 0–0.4), and H is hue (0–360°). Unlike HSL, equal steps in OKLCH produce equal perceived brightness changes, which makes it ideal for design systems and accessible color palettes.' },
  { q: 'Why is the eyedropper button not showing?', a: 'The EyeDropper API is only available in Chromium-based browsers (Chrome, Edge, Arc). It is not supported in Firefox or Safari. The button is hidden entirely on unsupported browsers rather than showing a broken one.' },
  { q: 'What are recent colors?', a: 'The last 12 colors you copied are saved to your browser\'s local storage and shown below the picker. They persist across sessions on the same device and browser.' },
  { q: 'Are my colors sent anywhere?', a: 'No. Everything runs in your browser. No data is sent to a server.' },
]

export default function ColorPickerPage() {
  const [hex, setHex] = useState('#3b82f6')
  const [hexInput, setHexInput] = useState('#3b82f6')
  const [rgb, setRgb] = useState<RGB>({ r: 59, g: 130, b: 246 })
  const [hsl, setHsl] = useState<HSL>({ h: 217, s: 91, l: 60 })
  const [oklch, setOklch] = useState<OKLCH>({ l: 0.623, c: 0.189, h: 259.1 })
  const [recent, setRecent] = useState<string[]>([])
  const [hasEyeDropper, setHasEyeDropper] = useState(false)

  useEffect(() => {
    setHasEyeDropper('EyeDropper' in window)
    setRecent(loadRecent())
  }, [])

  const syncFromHex = useCallback((h: string) => {
    const r = hexToRgb(h)
    if (!r) return
    setHex(h)
    setHexInput(h)
    setRgb(r)
    setHsl(rgbToHsl(r))
    setOklch(rgbToOklch(r))
    saveRecent(h)
    setRecent(loadRecent())
  }, [])

  const syncFromRgb = useCallback((r: RGB) => {
    const h = rgbToHex(r)
    setHex(h)
    setHexInput(h)
    setRgb(r)
    setHsl(rgbToHsl(r))
    setOklch(rgbToOklch(r))
  }, [])

  const syncFromHsl = useCallback((s: HSL) => {
    const r = hslToRgb(s)
    syncFromRgb(r)
  }, [syncFromRgb])

  const pickColor = useCallback(async () => {
    try {
      // @ts-expect-error EyeDropper not in TS lib yet
      const picker = new window.EyeDropper()
      const result = await picker.open()
      syncFromHex(result.sRGBHex)
    } catch { /* user cancelled */ }
  }, [syncFromHex])

  const hexStr = hex
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  const oklchStr = `oklch(${oklch.l} ${oklch.c} ${oklch.h})`

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Web Tools', href: '/web-tools' },
          { label: 'Color Picker' },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">Color Picker</h1>
        <p className="mt-2 text-base text-fg-muted">Pick a color and copy it as HEX, RGB, HSL, or OKLCH.</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden />
          Runs entirely in your browser.
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-6">
          {/* Swatch + native picker */}
          <div className="flex items-start gap-4">
            <div
              className="h-24 w-24 shrink-0 rounded-xl border border-border shadow-inner"
              style={{ background: hex }}
              aria-label={`Current color: ${hex}`}
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <label htmlFor="native-color" className="text-sm font-medium text-fg">Hex</label>
                <input
                  id="native-color"
                  type="color"
                  value={hex}
                  onChange={e => syncFromHex(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                  aria-label="Color wheel picker"
                />
                <input
                  type="text"
                  value={hexInput}
                  maxLength={7}
                  onChange={e => {
                    const v = e.target.value
                    setHexInput(v)
                    if (isValidHex(v)) syncFromHex(v.startsWith('#') ? v : '#' + v)
                  }}
                  spellCheck={false}
                  className={cn(
                    'w-28 rounded-md border border-border bg-bg-muted px-2 py-1.5 font-mono text-sm text-fg',
                    'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  )}
                />
                {hasEyeDropper && (
                  <button
                    type="button"
                    onClick={pickColor}
                    title="Pick color from screen"
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg border border-border px-3 py-2',
                      'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    )}
                  >
                    <Pipette className="h-3.5 w-3.5" aria-hidden />
                    Pick
                  </button>
                )}
              </div>

              {/* RGB inputs */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-fg-muted">RGB</p>
                <div className="grid grid-cols-3 gap-2">
                  <NumInput label="R" value={rgb.r} min={0} max={255} onChange={v => syncFromRgb({ ...rgb, r: v })} />
                  <NumInput label="G" value={rgb.g} min={0} max={255} onChange={v => syncFromRgb({ ...rgb, g: v })} />
                  <NumInput label="B" value={rgb.b} min={0} max={255} onChange={v => syncFromRgb({ ...rgb, b: v })} />
                </div>
              </div>

              {/* HSL inputs */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-fg-muted">HSL</p>
                <div className="grid grid-cols-3 gap-2">
                  <NumInput label="H" value={hsl.h} min={0} max={360} onChange={v => syncFromHsl({ ...hsl, h: v })} />
                  <NumInput label="S" value={hsl.s} min={0} max={100} onChange={v => syncFromHsl({ ...hsl, s: v })} />
                  <NumInput label="L" value={hsl.l} min={0} max={100} onChange={v => syncFromHsl({ ...hsl, l: v })} />
                </div>
              </div>
            </div>
          </div>

          {/* Copy rows */}
          <div className="space-y-2">
            <CopyButton text={hexStr} label="HEX" />
            <CopyButton text={rgbStr} label="RGB" />
            <CopyButton text={hslStr} label="HSL" />
            <CopyButton text={oklchStr} label="OKLCH" />
          </div>
        </div>

        {/* Recent colors */}
        {recent.length > 0 && (
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-3">
            <p className="text-sm font-medium text-fg">Recent colors</p>
            <div className="flex flex-wrap gap-2">
              {recent.filter(h => isValidHex(h)).map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => syncFromHex(h)}
                  title={h}
                  className="h-9 w-9 rounded-lg border border-border shadow-sm transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  style={{ background: h }}
                  aria-label={`Select ${h}`}
                />
              ))}
            </div>
          </div>
        )}

        <FAQAccordion items={FAQ} />
        <RelatedToolsStrip slugs={['gradient-generator', 'favicon-generator', 'image-compressor']} />
        <RelatedArticlesStrip slugs={[]} />
      </div>
    </div>
  )
}
