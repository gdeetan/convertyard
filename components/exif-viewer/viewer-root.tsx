'use client'
import { useEffect, useState } from 'react'
import { Maximize2, Minimize2, Eraser, RotateCcw } from 'lucide-react'
import type { AnalyzeResult } from '@/lib/converters/exif-viewer.types'
import type { ViewerExportAction } from '@/lib/types'
import { SingleFileView } from './single-file-view'
import { BatchTable } from './batch-table'
import { CompareView } from './compare-view'
import { ExportActions } from './export-actions'
import { stripImageMetadata } from '@/lib/converters/exif-viewer-strip'

const STRIPPABLE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const STRIPPABLE_EXT = /\.(jpe?g|png|webp)$/i

function canStrip(f: File | undefined): boolean {
  if (!f) return false
  return STRIPPABLE_MIME.has(f.type) || STRIPPABLE_EXT.test(f.name)
}

async function stripAndDownload(files: File[]) {
  const eligible = files.filter(canStrip)
  if (eligible.length === 0) return
  if (eligible.length === 1) {
    const res = await stripImageMetadata(eligible[0])
    if ('unsupported' in res) return
    triggerDownload(res.blob, res.filename)
    return
  }
  const { zip } = await import('fflate')
  const entries: Record<string, Uint8Array> = {}
  for (const f of eligible) {
    const res = await stripImageMetadata(f)
    if ('unsupported' in res) continue
    entries[res.filename] = new Uint8Array(await res.blob.arrayBuffer())
  }
  const zipped = await new Promise<Uint8Array>((resolve, reject) => {
    zip(entries, (err, data) => (err ? reject(err) : resolve(data)))
  })
  triggerDownload(new Blob([zipped as BlobPart], { type: 'application/zip' }), 'images-no-exif.zip')
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ViewerRoot({ files, results, exportActions, onReset }: { files: File[]; results: AnalyzeResult[]; exportActions: ViewerExportAction[]; onReset?: () => void }) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [compareOn, setCompareOn] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [stripping, setStripping] = useState(false)

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

  const strippableFiles = files.filter(canStrip)
  const hasStrippable = strippableFiles.length > 0

  const handleStripAll = async () => {
    setStripping(true)
    try { await stripAndDownload(files) } finally { setStripping(false) }
  }

  const utilityBar = (
    <div className="flex flex-wrap items-center gap-2">
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-fg-muted hover:bg-bg-muted"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Analyze another file
        </button>
      )}
      <button
        type="button"
        onClick={() => setFullscreen(f => !f)}
        className="inline-flex items-center gap-1.5 rounded border border-border bg-bg-elevated px-2.5 py-1.5 text-xs text-fg-muted hover:bg-bg-muted"
        aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {fullscreen ? <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />}
        {fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
      </button>
    </div>
  )

  const stripButton = hasStrippable ? (
    <button
      type="button"
      onClick={handleStripAll}
      disabled={stripping}
      className="inline-flex items-center gap-1.5 rounded border border-border bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:opacity-90 disabled:opacity-50"
      title={strippableFiles.length < files.length ? `Only ${strippableFiles.length} of ${files.length} files (JPG/PNG/WebP) can be stripped here.` : undefined}
    >
      <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
      {stripping
        ? 'Removing…'
        : results.length === 1
          ? 'Remove EXIF & download'
          : `Remove EXIF from ${strippableFiles.length} file${strippableFiles.length === 1 ? '' : 's'}`}
    </button>
  ) : null

  const inner = (
    <>
      {results.length === 1 ? (
        (() => {
          const r = results[0]
          if (!r.ok) return <div className="rounded border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">{r.message}</div>
          return (
            <>
              <SingleFileView result={r} file={files[0]} />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {stripButton}
                <ExportActions results={results} actions={exportActions} />
              </div>
              {!hasStrippable && (
                <p className="mt-2 text-xs text-fg-subtle">
                  In-browser metadata removal is available for JPG, PNG, and WebP. For HEIC, RAW, PDF, or video, use the Edit Metadata tool.
                </p>
              )}
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
                {stripButton}
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
          {utilityBar}
        </div>
        <div className="flex-1 overflow-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-6xl">{inner}</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">{utilityBar}</div>
      {inner}
    </div>
  )
}
