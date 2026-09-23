'use client'

import { useState } from 'react'
import { CompressionPreview } from './CompressionPreview'
import { PdfAnalyzerPanel } from './PdfAnalyzerPanel'
import type { ToolOptions } from '@/lib/types'
import { isIos } from '@/lib/utils/platform'
import { formatBytes } from '@/lib/utils/download'

// Preview + analyzer both call file.arrayBuffer() and hand a cloned
// buffer to the mupdf worker to render page 1. On iOS Safari this
// blows past the tab memory cap on large PDFs and hard-refreshes the
// page before the user ever clicks Convert. Set a preview budget well
// below the compress budget (150MB on iOS) so there's still headroom
// for compression to run afterward.
const IOS_PREVIEW_MAX_BYTES = 80 * 1024 * 1024

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

  const currentFile = files[safeIndex]
  const skipHeavyPreview =
    isIos() && currentFile != null && currentFile.size > IOS_PREVIEW_MAX_BYTES

  if (skipHeavyPreview) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-medium">Preview disabled for large files on iOS</p>
        <p className="mt-1">
          This PDF is {formatBytes(currentFile.size)}. Loading a preview of a file
          over {formatBytes(IOS_PREVIEW_MAX_BYTES)} would refresh the tab on iOS
          Safari. Compression still runs — pick your settings and tap Convert.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <CompressionPreview
        files={files}
        results={results}
        selectedIndex={safeIndex}
        onSelectIndex={setSelectedIndex}
      />
      <PdfAnalyzerPanel
        file={currentFile}
        options={options}
      />
    </div>
  )
}
