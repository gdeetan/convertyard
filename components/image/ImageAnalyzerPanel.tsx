'use client'
import { useEffect, useRef, useState } from 'react'
import { analyzeImage, type ImageAnalysis } from '@/lib/image/analyzer'
import { estimateImageSavings } from '@/lib/image/savings-estimator'
import type { ToolOptions } from '@/lib/types'

interface Props {
  files: File[]
  options: ToolOptions
  onChange: (name: string, value: unknown) => void
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function AnalysisRow({ file, options }: { file: File; options: ToolOptions }) {
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const fileRef = useRef(file)

  useEffect(() => {
    fileRef.current = file
    setLoading(true)
    setAnalysis(null)
    let cancelled = false
    analyzeImage(file).then((result) => {
      if (!cancelled) {
        setAnalysis(result)
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [file])

  const savings = analysis ? estimateImageSavings(analysis, options) : null
  const realOpportunities = savings?.perTechnique.filter(t => t.bytes > 0) ?? []
  const suggestions = savings?.perTechnique.filter(t => t.bytes === 0) ?? []

  const dim = analysis ? `${analysis.width}×${analysis.height}` : ''
  const mp = analysis && analysis.megapixels > 0 ? `${analysis.megapixels} MP` : ''
  const size = formatBytes(file.size)
  const fmt = analysis ? analysis.format.toUpperCase() : ''
  const quality = analysis?.estimatedExistingQuality != null ? ` · quality ~${analysis.estimatedExistingQuality}` : ''
  const summary = analysis ? `${dim} ${mp ? `(${mp})` : ''} · ${size} · ${fmt}${quality}` : size

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-bg-elevated"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs text-fg-subtle">{open ? '▾' : '▸'}</span>
          <span className="truncate text-sm font-medium text-fg">{file.name}</span>
        </div>
        <div className="shrink-0 text-right">
          {loading ? (
            <span className="text-xs text-fg-subtle">Analysing…</span>
          ) : analysis ? (
            <span className="text-xs text-fg-subtle">{summary}</span>
          ) : (
            <span className="text-xs text-fg-subtle">{size}</span>
          )}
        </div>
      </button>

      {open && analysis && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* File info */}
          <div className="mb-3 text-xs text-fg-subtle">
            {dim && <span>{dim} {mp && `(${mp})`} · </span>}
            <span>{fmt}</span>
            {analysis.isAnimated && <span> · animated</span>}
            {analysis.hasAlpha && <span> · alpha</span>}
            {analysis.estimatedExistingQuality != null && (
              <span> · quality ~{analysis.estimatedExistingQuality}</span>
            )}
          </div>

          {/* What's inside */}
          {(analysis.exifBytes > 0 || analysis.iccProfileBytes > 0) && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-fg">What&apos;s inside:</div>
              <div className="space-y-0.5 text-xs text-fg-subtle">
                <div>
                  Image data: {formatBytes(Math.max(0, file.size - analysis.exifBytes - analysis.iccProfileBytes))}
                </div>
                {analysis.exifBytes > 0 && (
                  <div className={analysis.hasGpsData ? 'text-amber-600 dark:text-amber-400' : ''}>
                    EXIF/XMP: {formatBytes(analysis.exifBytes)}
                    {analysis.hasGpsData && ' (includes GPS location)'}
                  </div>
                )}
                {analysis.iccProfileBytes > 0 && (
                  <div>ICC profile: {formatBytes(analysis.iccProfileBytes)}</div>
                )}
              </div>
            </div>
          )}

          {/* Biggest opportunities */}
          {(realOpportunities.length > 0 || suggestions.length > 0) && (
            <div>
              <div className="mb-1 text-xs font-medium text-fg">Biggest opportunities:</div>
              <div className="space-y-0.5 text-xs text-fg-subtle">
                {realOpportunities.slice(0, 3).map((t, i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <span>✓ {t.label}</span>
                    <span className="shrink-0 text-green-600 dark:text-green-400">
                      save ~{formatBytes(t.bytes)}
                    </span>
                  </div>
                ))}
                {suggestions.map((t, i) => (
                  <div key={i} className="text-fg-subtle">{t.label}</div>
                ))}
              </div>
            </div>
          )}

          {/* Color count hint */}
          {analysis.uniqueColorEstimate !== null && analysis.uniqueColorEstimate <= 256 && (
            <div className="mt-2 rounded bg-bg-elevated px-2 py-1 text-xs text-fg-subtle">
              {analysis.uniqueColorEstimate} unique colors detected — palette reduction in Advanced settings could save 60–75%
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ImageAnalyzerPanel({ files, options }: Props) {
  if (files.length === 0) return null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg-subtle">File analysis</span>
        {files.length > 1 && (
          <span className="text-xs text-fg-subtle">{files.length} files — click to expand</span>
        )}
      </div>
      {files.map((file) => (
        <AnalysisRow key={`${file.name}-${file.size}`} file={file} options={options} />
      ))}
    </div>
  )
}
