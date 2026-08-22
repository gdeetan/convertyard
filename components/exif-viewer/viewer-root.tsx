'use client'
import { useEffect, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import type { AnalyzeResult } from '@/lib/converters/exif-viewer.types'
import type { ViewerExportAction } from '@/lib/types'
import { SingleFileView } from './single-file-view'
import { BatchTable } from './batch-table'
import { CompareView } from './compare-view'
import { ExportActions } from './export-actions'

export function ViewerRoot({ files, results, exportActions }: { files: File[]; results: AnalyzeResult[]; exportActions: ViewerExportAction[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [compareOn, setCompareOn] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [fullscreen])

  if (results.length === 0) return <div className="text-sm text-fg-subtle">Analyzing…</div>

  const toolbar = (
    <button
      type="button"
      onClick={() => setFullscreen(f => !f)}
      className="inline-flex items-center gap-1.5 rounded border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-fg-muted hover:bg-bg-muted"
      aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {fullscreen ? <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />}
      {fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
    </button>
  )

  const inner = (
    <>
      {results.length === 1 ? (
        (() => {
          const r = results[0]
          if (!r.ok) return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">{r.message}</div>
          return (
            <>
              <SingleFileView result={r} file={files[0]} />
              <div className="mt-4"><ExportActions results={results} actions={exportActions} /></div>
            </>
          )
        })()
      ) : (
        (() => {
          const toggleSelect = (i: number) => {
            const next = new Set(selected)
            if (next.has(i)) next.delete(i); else next.add(i)
            setSelected(next)
          }
          const selectedIdx = Array.from(selected).sort((a, b) => a - b)
          const canCompare = selectedIdx.length === 2
          return (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <ExportActions results={results} actions={exportActions} />
                <button
                  className="rounded border border-border bg-bg-elevated px-3 py-1.5 text-sm disabled:opacity-50"
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
        })()
      )}
    </>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">
            EXIF metadata · {results.length} file{results.length === 1 ? '' : 's'}
          </h2>
          {toolbar}
        </div>
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-6xl">{inner}</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">{toolbar}</div>
      {inner}
    </div>
  )
}
