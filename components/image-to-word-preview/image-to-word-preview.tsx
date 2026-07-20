'use client'

import { useState, useEffect } from 'react'
import type { ConversionResult, OcrResultMeta } from '@/lib/types'

function getOcrMeta(result: ConversionResult): OcrResultMeta | null {
  if (result instanceof File || result instanceof Error) return null
  if ('ocrMeta' in result) return result.ocrMeta
  return null
}

function SourceImage({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return src
    ? <img src={src} alt="Source" className="max-w-full rounded border border-border object-contain" />
    : <div className="h-48 w-full rounded bg-bg-muted animate-pulse" />
}

interface Props {
  files: File[]
  results: ConversionResult[]
  onResultEdit: (index: number, newFile: File) => void
}

export function ImageToWordPreviewPanel({ files, results }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  const clampedIndex = Math.min(activeIndex, results.length - 1)
  const meta = getOcrMeta(results[clampedIndex])
  const sourceFile = files[clampedIndex]

  return (
    <div className="space-y-4">
      {files.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => {
            const m = getOcrMeta(results[i])
            const hasText = m && m.lines.length > 0
            return (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={[
                  'rounded px-3 py-1 text-sm border transition-colors',
                  i === clampedIndex
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-bg-subtle border-border hover:border-primary/50',
                ].join(' ')}
              >
                {f.name.length > 20 ? f.name.slice(0, 18) + '…' : f.name}
                {!hasText && <span className="ml-1 text-text-muted">(empty)</span>}
              </button>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Source image</p>
          <div className="overflow-auto max-h-[480px] rounded border border-border bg-bg-subtle p-2">
            {sourceFile && <SourceImage file={sourceFile} />}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            Extracted text
            {meta && <span className="ml-2 font-normal normal-case">{meta.lines.length} line{meta.lines.length !== 1 ? 's' : ''}</span>}
          </p>
          <div className="overflow-auto max-h-[480px] rounded border border-border bg-bg-subtle p-3 font-mono text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
            {meta && meta.lines.length > 0
              ? meta.lines.join('\n')
              : <span className="text-text-muted italic">No text detected in this image.</span>
            }
          </div>
        </div>
      </div>

      {meta && meta.words.length > 0 && (() => {
        const lowConf = meta.words.filter(w => w.confidence >= 0 && w.confidence < 60).length
        const avg = Math.round(meta.words.reduce((s, w) => s + (w.confidence >= 0 ? w.confidence : 0), 0) / meta.words.filter(w => w.confidence >= 0).length)
        return (
          <p className="text-xs text-text-muted">
            Avg. confidence: {avg}%
            {lowConf > 0 && <span className="ml-2 text-amber-600 dark:text-amber-400">· {lowConf} low-confidence word{lowConf !== 1 ? 's' : ''}</span>}
          </p>
        )
      })()}
    </div>
  )
}
