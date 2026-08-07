'use client'

import { useRef, useState } from 'react'
import type { CaptionOptions, FontSource, CaptionStyleId } from '@/lib/converters/caption-types'
import { BUILTIN_FONTS } from '@/lib/converters/caption-fonts'
import { cn } from '@/lib/utils/cn'
const HIGHLIGHT_STYLES: CaptionStyleId[] = ['mrbeast', 'karaoke']

interface Props {
  options: CaptionOptions
  onChange: (patch: Partial<CaptionOptions>) => void
}

export function CaptionFontPanel({ options, onChange }: Props) {
  const [systemFonts, setSystemFonts] = useState<string[]>([])
  const [systemLoading, setSystemLoading] = useState(false)
  const fontInputRef = useRef<HTMLInputElement>(null)

  async function loadSystemFonts() {
    if (!('queryLocalFonts' in window)) return
    setSystemLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fonts: any[] = await (window as any).queryLocalFonts()
      const families = [...new Set<string>(fonts.map((f: any) => f.family as string))].sort()
      setSystemFonts(families)
      onChange({ fontSource: 'system', systemFontFamily: families[0] ?? '', systemFontBlob: null })
    } catch {
      // user denied or API unavailable
    } finally {
      setSystemLoading(false)
    }
  }

  async function handleSystemFontSelect(family: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fonts: any[] = await (window as any).queryLocalFonts({ postscriptNames: [] })
    const match = fonts.find((f: any) => f.family === family)
    const blob: Blob | null = match ? await match.blob() : null
    onChange({ systemFontFamily: family, systemFontBlob: blob })
  }

  function handleFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onChange({ fontSource: 'upload', uploadedFont: file })
  }

  const showHighlight = HIGHLIGHT_STYLES.includes(options.styleId)

  return (
    <div className="space-y-4">
      {/* Font source tabs */}
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg">Font</p>
        <div className="flex gap-1 rounded-lg border border-border bg-bg p-1">
          {(['builtin', 'upload', 'system'] as FontSource[]).map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                if (src === 'system') { loadSystemFonts(); return }
                onChange({ fontSource: src })
              }}
              className={cn(
                'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                options.fontSource === src
                  ? 'bg-primary text-white'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {src === 'builtin' ? 'Built-in' : src === 'upload' ? 'Upload file' : 'Your computer'}
            </button>
          ))}
        </div>

        {options.fontSource === 'builtin' && (
          <select
            className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg"
            value={options.builtinFont}
            onChange={(e) => onChange({ builtinFont: e.target.value })}
          >
            {BUILTIN_FONTS.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
          </select>
        )}

        {options.fontSource === 'upload' && (
          <div className="mt-2">
            <input ref={fontInputRef} type="file" accept=".ttf,.otf,.woff" className="hidden" onChange={handleFontUpload} />
            <button
              type="button"
              onClick={() => fontInputRef.current?.click()}
              className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-sm text-fg-muted hover:border-primary hover:text-primary"
            >
              {options.uploadedFont ? options.uploadedFont.name : 'Click to upload .ttf or .otf'}
            </button>
          </div>
        )}

        {options.fontSource === 'system' && (
          <div className="mt-2">
            {systemLoading && <p className="text-xs text-fg-muted">Loading fonts…</p>}
            {systemFonts.length > 0 && (
              <select
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg"
                value={options.systemFontFamily}
                onChange={(e) => handleSystemFontSelect(e.target.value)}
              >
                {systemFonts.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
            {!systemLoading && systemFonts.length === 0 && (
              <p className="text-xs text-fg-muted">Requires Chrome or Edge. Click "Your computer" to grant permission.</p>
            )}
          </div>
        )}
      </div>

      {/* Font size */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-fg">Font size</label>
          <span className="text-sm text-fg-muted">{options.fontSize}px</span>
        </div>
        <input
          type="range" min={20} max={160} step={2}
          value={options.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          className="mt-1 w-full accent-primary"
        />
      </div>

      {/* Max chars per line */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-fg">Max characters per line</label>
          <span className="text-sm text-fg-muted">{options.maxCharsPerLine}</span>
        </div>
        <input
          type="range" min={15} max={80} step={1}
          value={options.maxCharsPerLine}
          onChange={(e) => onChange({ maxCharsPerLine: Number(e.target.value) })}
          className="mt-1 w-full accent-primary"
        />
        <p className="mt-0.5 text-xs text-fg-subtle">Text wraps at this width — applies to grouped styles</p>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-fg">Text color</label>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={options.primaryColor} onChange={(e) => onChange({ primaryColor: e.target.value })} className="h-8 w-8 cursor-pointer rounded border border-border" />
            <span className="text-xs text-fg-muted">{options.primaryColor}</span>
          </div>
        </div>
        {showHighlight && (
          <div>
            <label className="text-sm font-medium text-fg">Highlight color</label>
            <div className="mt-1 flex items-center gap-2">
              <input type="color" value={options.highlightColor} onChange={(e) => onChange({ highlightColor: e.target.value })} className="h-8 w-8 cursor-pointer rounded border border-border" />
              <span className="text-xs text-fg-muted">{options.highlightColor}</span>
            </div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-fg">Outline color</label>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={options.outlineColor} onChange={(e) => onChange({ outlineColor: e.target.value })} className="h-8 w-8 cursor-pointer rounded border border-border" />
            <span className="text-xs text-fg-muted">{options.outlineColor}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-fg">Outline width</label>
            <span className="text-sm text-fg-muted">{options.outlineWidth}px</span>
          </div>
          <input
            type="range" min={0} max={8} step={1}
            value={options.outlineWidth}
            onChange={(e) => onChange({ outlineWidth: Number(e.target.value) })}
            className="mt-1 w-full accent-primary"
          />
        </div>
      </div>

      {/* Position */}
      <div>
        <p className="text-sm font-medium text-fg">Position</p>
        <div className="mt-1 flex gap-2">
          {(['top', 'center', 'bottom'] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => onChange({ position: pos })}
              className={cn(
                'flex-1 rounded-lg border py-1.5 text-xs font-medium capitalize transition-colors',
                options.position === pos ? 'border-primary bg-primary/10 text-primary' : 'border-border text-fg-muted hover:text-fg',
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Uppercase */}
      <label className="flex cursor-pointer items-center gap-3">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={options.uppercase}
            onChange={(e) => onChange({ uppercase: e.target.checked })}
          />
          <div className={cn('h-5 w-9 rounded-full transition-colors', options.uppercase ? 'bg-primary' : 'bg-fg-subtle')} />
          <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', options.uppercase ? 'translate-x-4' : 'translate-x-0.5')} />
        </div>
        <span className="text-sm text-fg">UPPERCASE text</span>
      </label>
    </div>
  )
}
