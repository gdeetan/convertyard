'use client'
import { useState } from 'react'
import type { AnalyzeResult } from '@/lib/converters/exif-viewer.types'
import type { ViewerExportAction } from '@/lib/types'
import { SingleFileView } from './single-file-view'
import { BatchTable } from './batch-table'
import { CompareView } from './compare-view'
import { ExportActions } from './export-actions'

export function ViewerRoot({ results, exportActions }: { files: File[]; results: AnalyzeResult[]; exportActions: ViewerExportAction[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [compareOn, setCompareOn] = useState(false)

  if (results.length === 0) return <div className="text-sm text-gray-500">Analyzing…</div>

  if (results.length === 1) {
    const r = results[0]
    if (!r.ok) return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm">{r.message}</div>
    return (
      <>
        <SingleFileView result={r} />
        <div className="mt-4"><ExportActions results={results} actions={exportActions} /></div>
      </>
    )
  }

  const toggleSelect = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i); else next.add(i)
    setSelected(next)
  }

  const selectedIdx = Array.from(selected).sort((a, b) => a - b)
  const canCompare = selectedIdx.length === 2

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <ExportActions results={results} actions={exportActions} />
        <button
          className="rounded border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
          disabled={!canCompare}
          onClick={() => setCompareOn(true)}
        >
          Compare selected {canCompare ? '' : '(pick 2)'}
        </button>
      </div>
      {compareOn && canCompare && (
        <div className="mb-4"><CompareView a={results[selectedIdx[0]]} b={results[selectedIdx[1]]} onClose={() => setCompareOn(false)} /></div>
      )}
      <BatchTable results={results} selected={selected} onToggleSelect={toggleSelect} />
    </div>
  )
}
