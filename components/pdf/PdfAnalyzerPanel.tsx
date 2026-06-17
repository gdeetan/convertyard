'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { analyzePdf, type PdfAnalysis } from '@/lib/pdf/analyzer'
import { estimateSavings } from '@/lib/pdf/savings-estimator'
import { formatBytes } from '@/lib/utils/download'
import type { ToolOptions } from '@/lib/types'

interface PdfAnalyzerPanelProps {
  file: File
  options: ToolOptions
}

export function PdfAnalyzerPanel({ file, options }: PdfAnalyzerPanelProps) {
  const [analysis, setAnalysis] = useState<PdfAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setAnalysis(null)
    analyzePdf(file)
      .then(result => { if (!cancelled) setAnalysis(result) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [file])

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-bg-elevated p-4 text-sm text-fg-muted">
        Analysing file…
      </div>
    )
  }

  if (!analysis) return null

  const savings = estimateSavings(analysis, options)
  const techniques = Object.entries(savings.perTechnique)
  const topSavings = techniques
    .filter(([, t]) => t.savingsBytes > 0)
    .sort(([, a], [, b]) => b.savingsBytes - a.savingsBytes)
    .slice(0, 3)

  const { color, grayscale, monochrome } = analysis.images.byColorSpace

  const tags = [
    analysis.hasMetadata && 'metadata',
    analysis.hasAnnotations &&
      `${analysis.annotationCount > 0 ? analysis.annotationCount + ' ' : ''}annotation${analysis.annotationCount !== 1 ? 's' : ''}`,
    analysis.hasBookmarks && 'bookmarks',
    analysis.hasJS && 'JavaScript',
    analysis.hasEmbeddedFiles && 'embedded files',
    analysis.formFieldCount > 0 &&
      `${analysis.formFieldCount} form field${analysis.formFieldCount !== 1 ? 's' : ''}`,
  ].filter(Boolean) as string[]

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-fg">
        <Search className="h-4 w-4 text-primary" aria-hidden="true" />
        File analysis
        {analysis.pdfVersion && (
          <span className="ml-auto text-xs font-normal text-fg-muted">PDF {analysis.pdfVersion}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-fg-muted sm:grid-cols-4">
        <div>
          <span className="font-medium text-fg">{analysis.images.count}</span> images
          {(color > 0 || grayscale > 0 || monochrome > 0) && (
            <span className="block text-fg-subtle">
              {[
                color > 0 && `${color} color`,
                grayscale > 0 && `${grayscale} gray`,
                monochrome > 0 && `${monochrome} mono`,
              ].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
        <div>
          <span className="font-medium text-fg">{formatBytes(analysis.images.totalEstimatedBytes)}</span>{' '}
          image data
        </div>
        <div>
          <span className="font-medium text-fg">{analysis.images.avgDpi || '—'}</span> avg DPI
        </div>
        <div>
          <span className="font-medium text-fg">{analysis.fonts.count}</span>{' '}
          font{analysis.fonts.count !== 1 ? 's' : ''}
          {analysis.fonts.unsubsettedCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {' '}({analysis.fonts.unsubsettedCount} not subsetted)
            </span>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-bg-muted px-2 py-0.5 text-xs text-fg-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {topSavings.length > 0 && (
        <div className="border-t border-border pt-3 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
            Biggest opportunities{' '}
            <span className="font-normal normal-case text-fg">
              ~{formatBytes(savings.estimatedSavingsBytes)} potential ({savings.estimatedSavingsPercent}%)
            </span>
          </p>
          {topSavings.map(([key, t]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-fg">{t.explanation}</span>
              <span className="tabular-nums text-fg-muted ml-4 shrink-0">
                ~{formatBytes(t.savingsBytes)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
