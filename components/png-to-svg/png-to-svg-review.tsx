'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { pngToSvgConvert } from '@/lib/converters/png-to-svg-convert'
import { extractSvgPalette, knockoutSvg, recolorSvg } from '@/lib/converters/svg-palette'
import type { ConversionResult, ToolOptions } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

const COLOR_COUNTS = [2, 4, 8, 16, 32] as const

function resultFile(result: ConversionResult | undefined): File | null {
  if (!result || result instanceof Error) return null
  if (result instanceof File) return result
  return result.file
}

interface Props {
  files: File[]
  results: ConversionResult[]
  onResultEdit: (index: number, newFile: File) => void
  options?: ToolOptions
}

export function PngToSvgReviewPanel({ files, results, onResultEdit, options = {} }: Props) {
  const [selected, setSelected] = useState(0)
  const [svgText, setSvgText] = useState('')
  const [retracing, setRetracing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [colorCount, setColorCount] = useState<number | null>(null)

  const safeIndex = Math.min(selected, Math.max(0, files.length - 1))
  const source = files[safeIndex]
  const result = resultFile(results[safeIndex])

  useEffect(() => {
    setColorCount(null)
  }, [safeIndex])

  useEffect(() => {
    if (!result) {
      setSvgText('')
      return
    }
    let cancelled = false
    result.text().then((text) => {
      if (!cancelled) setSvgText(text)
    })
    return () => {
      cancelled = true
    }
  }, [result])

  const palette = extractSvgPalette(svgText)
  const activeCount =
    colorCount ??
    (typeof options.numberofcolors === 'number' ? options.numberofcolors : palette.length)

  const commit = useCallback(
    (nextSvg: string) => {
      if (!result) return
      setSvgText(nextSvg)
      onResultEdit(
        safeIndex,
        new File([nextSvg], result.name, { type: 'image/svg+xml' }),
      )
    },
    [onResultEdit, result, safeIndex],
  )

  const handleRecolor = (from: string, to: string) => {
    if (!svgText || from === to) return
    commit(recolorSvg(svgText, from, to))
  }

  const handleKnockout = (color: string) => {
    if (!svgText) return
    commit(knockoutSvg(svgText, color))
  }

  const handleRetrace = async (count: number) => {
    if (!source || retracing) return
    setRetracing(true)
    setError(null)
    try {
      const next = await pngToSvgConvert([source], { ...options, numberofcolors: count })
      const out = next[0]
      if (out instanceof File) {
        setColorCount(count)
        onResultEdit(safeIndex, out)
      }
      else if (out instanceof Error) setError(out.message)
      else setError('Retrace failed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retrace failed')
    } finally {
      setRetracing(false)
    }
  }

  if (!source || !result) return null

  return (
    <div className="space-y-4 rounded-xl border border-border bg-bg p-4">
      <p className="text-sm font-medium text-fg">Edit traced colours</p>
      {files.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {files.map((file, i) => (
            <button
              key={`${file.name}-${i}`}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                i === safeIndex
                  ? 'border-primary bg-primary/10 text-fg'
                  : 'border-border text-fg-muted hover:text-fg',
              )}
            >
              {file.name}
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-fg-muted">Number of colours</p>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              disabled={retracing}
              onClick={() => handleRetrace(count)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
                activeCount === count
                  ? 'border-primary bg-primary text-primary-fg'
                  : 'border-border text-fg hover:bg-bg-muted',
              )}
            >
              {count}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-fg-subtle">
          Retraces this file. Fewer colours = simpler SVG.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-fg-muted">
          Palette{palette.length ? ` · ${palette.length} colour${palette.length === 1 ? '' : 's'}` : ''}
        </p>
        {!svgText ? (
          <p className="text-sm text-fg-muted">Reading SVG…</p>
        ) : palette.length === 0 ? (
          <p className="text-sm text-fg-muted">No fills in this SVG.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {palette.map((hex) => (
              <div key={hex} className="relative">
                <label
                  className="block h-10 w-10 cursor-pointer overflow-hidden rounded-lg border border-border shadow-sm"
                  title={`Recolor ${hex}`}
                >
                  <span className="sr-only">Recolor {hex}</span>
                  <span className="block h-full w-full" style={{ backgroundColor: hex }} />
                  <input
                    type="color"
                    value={hex}
                    aria-label={`Recolor ${hex}`}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => handleRecolor(hex, e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  aria-label={`Remove ${hex} from SVG`}
                  onClick={() => handleKnockout(hex)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-bg-elevated text-fg-muted shadow-sm hover:bg-bg-muted hover:text-fg"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-xs text-fg-subtle">
          Click a swatch to recolor. × knocks that colour out of the SVG.
        </p>
      </div>

      {retracing && <p className="text-sm text-fg-muted">Retracing…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
