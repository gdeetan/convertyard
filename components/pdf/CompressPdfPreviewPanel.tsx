'use client'

import { useState } from 'react'
import { CompressionPreview } from './CompressionPreview'
import { PdfAnalyzerPanel } from './PdfAnalyzerPanel'
import type { ToolOptions } from '@/lib/types'

interface CompressPdfPreviewPanelProps {
  files: File[]
  results: (File | null)[]
  options: ToolOptions
}

export function CompressPdfPreviewPanel({
  files,
  results,
  options,
}: CompressPdfPreviewPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Clamp selectedIndex in case files array shrinks (e.g. after reset)
  const safeIndex = Math.min(selectedIndex, files.length - 1)

  if (files.length === 0) return null

  return (
    <div className="space-y-3">
      <CompressionPreview
        files={files}
        results={results}
        options={options}
        selectedIndex={safeIndex}
        onSelectIndex={setSelectedIndex}
      />
      <PdfAnalyzerPanel
        file={files[safeIndex]}
        options={options}
      />
    </div>
  )
}
