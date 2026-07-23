'use client'

import { useState, useCallback, useRef } from 'react'
import { Lock, RefreshCcw, Download } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { config } from '@/content/tools/compare-pdfs'

type Phase = 'idle' | 'processing' | 'done' | 'error'

interface DiffPage {
  pageNum: number
  aUrl: string
  bUrl: string
  diffUrl: string
  changed: boolean
}

async function diffPages(aBuffer: ArrayBuffer, bBuffer: ArrayBuffer, dpi: number): Promise<DiffPage[]> {
  const { renderPagePng, getPageCount } = await import('@/lib/converters/mupdf-client')
  const aCount = await getPageCount(aBuffer)
  const bCount = await getPageCount(bBuffer)
  const count = Math.min(aCount, bCount)
  const results: DiffPage[] = []

  for (let p = 0; p < count; p++) {
    const [aPng, bPng] = await Promise.all([
      renderPagePng(aBuffer, p, dpi),
      renderPagePng(bBuffer, p, dpi),
    ])

    const aBitmap = await createImageBitmap(new Blob([new Uint8Array(aPng)], { type: 'image/png' }))
    const bBitmap = await createImageBitmap(new Blob([new Uint8Array(bPng)], { type: 'image/png' }))

    const w = Math.max(aBitmap.width, bBitmap.width)
    const h = Math.max(aBitmap.height, bBitmap.height)

    const diffCanvas = new OffscreenCanvas(w, h)
    const ctx = diffCanvas.getContext('2d')!

    ctx.drawImage(aBitmap, 0, 0)
    const aData = ctx.getImageData(0, 0, w, h)

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(bBitmap, 0, 0)
    const bData = ctx.getImageData(0, 0, w, h)

    aBitmap.close()
    bBitmap.close()

    const diffData = ctx.createImageData(w, h)
    let changed = false
    for (let px = 0; px < w * h * 4; px += 4) {
      const dr = Math.abs(aData.data[px]     - bData.data[px])
      const dg = Math.abs(aData.data[px + 1] - bData.data[px + 1])
      const db = Math.abs(aData.data[px + 2] - bData.data[px + 2])
      if (dr + dg + db > 15) {
        diffData.data[px]     = 220
        diffData.data[px + 1] = 30
        diffData.data[px + 2] = 30
        diffData.data[px + 3] = 255
        changed = true
      } else {
        diffData.data[px]     = aData.data[px]
        diffData.data[px + 1] = aData.data[px + 1]
        diffData.data[px + 2] = aData.data[px + 2]
        diffData.data[px + 3] = 200
      }
    }
    ctx.putImageData(diffData, 0, 0)
    const diffBlob = await diffCanvas.convertToBlob({ type: 'image/png' })

    const aUrl = URL.createObjectURL(new Blob([new Uint8Array(aPng)], { type: 'image/png' }))
    const bUrl = URL.createObjectURL(new Blob([new Uint8Array(bPng)], { type: 'image/png' }))
    const diffUrl = URL.createObjectURL(diffBlob)

    results.push({ pageNum: p + 1, aUrl, bUrl, diffUrl, changed })
  }

  return results
}

export default function Page() {
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [pages, setPages] = useState<DiffPage[]>([])
  const [dpi] = useState(96)
  const [error, setError] = useState('')
  const blobUrls = useRef<string[]>([])

  const revokePrev = () => {
    blobUrls.current.forEach(URL.revokeObjectURL)
    blobUrls.current = []
  }

  const handleCompare = useCallback(async () => {
    if (!fileA || !fileB) return
    revokePrev()
    setPhase('processing')
    setError('')
    try {
      const [aBuffer, bBuffer] = await Promise.all([
        fileA.arrayBuffer(),
        fileB.arrayBuffer(),
      ])
      const result = await diffPages(aBuffer, bBuffer, dpi)
      result.forEach(p => blobUrls.current.push(p.aUrl, p.bUrl, p.diffUrl))
      setPages(result)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed')
      setPhase('error')
    }
  }, [fileA, fileB, dpi])

  const handleDownload = useCallback(async () => {
    if (!pages.length) return
    const entries: Record<string, Uint8Array> = {}
    for (const p of pages) {
      const [aArr, bArr, diffArr] = await Promise.all([
        fetch(p.aUrl).then(r => r.arrayBuffer()).then(b => new Uint8Array(b)),
        fetch(p.bUrl).then(r => r.arrayBuffer()).then(b => new Uint8Array(b)),
        fetch(p.diffUrl).then(r => r.arrayBuffer()).then(b => new Uint8Array(b)),
      ])
      entries[`a/page-${p.pageNum}.png`] = aArr
      entries[`b/page-${p.pageNum}.png`] = bArr
      entries[`diff/page-${p.pageNum}.png`] = diffArr
    }
    const { zipSync } = await import('fflate')
    const zip = zipSync(entries)
    const blob = new Blob([zip], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pdf-comparison.zip'
    a.click()
    URL.revokeObjectURL(url)
  }, [pages])

  const handleReset = () => {
    revokePrev()
    setFileA(null)
    setFileB(null)
    setPhase('idle')
    setPages([])
    setError('')
  }

  const changedCount = pages.filter(p => p.changed).length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumb category={{ label: 'PDF Tools', href: '/pdf' }} current={config.title} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg">{config.title}</h1>
      <p className="mt-2 text-fg-muted">{config.subtitle}</p>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
        <Lock className="h-3 w-3" />
        <span>Files never leave your browser</span>
      </div>

      {phase !== 'done' && (
        <div className="mt-8 grid grid-cols-2 gap-4">
          {(['A', 'B'] as const).map((label) => {
            const file = label === 'A' ? fileA : fileB
            const setFile = label === 'A' ? setFileA : setFileB
            return (
              <label
                key={label}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
                  file ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
              >
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <span className="text-lg font-semibold text-fg">PDF {label}</span>
                {file
                  ? <span className="mt-1 text-sm text-fg-muted">{file.name}</span>
                  : <span className="mt-1 text-sm text-fg-subtle">Click to select</span>
                }
              </label>
            )
          })}
        </div>
      )}

      {phase === 'idle' && fileA && fileB && (
        <button
          type="button"
          onClick={handleCompare}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-fg hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Compare PDFs
        </button>
      )}

      {phase === 'processing' && (
        <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-6 text-center text-fg-muted">
          Comparing pages…
        </div>
      )}

      {phase === 'error' && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {phase === 'done' && (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-fg-muted">
              {changedCount === 0
                ? 'No differences found.'
                : `${changedCount} of ${pages.length} page${pages.length !== 1 ? 's' : ''} differ.`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:bg-primary-hover"
              >
                <Download className="h-4 w-4" />
                Download ZIP
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-fg-muted hover:text-fg"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {pages.map((p) => (
              <div key={p.pageNum} className="overflow-hidden rounded-xl border border-border">
                <div className={cn(
                  'flex items-center justify-between px-4 py-2 text-xs font-medium',
                  p.changed ? 'bg-red-50 text-red-700' : 'bg-bg-muted text-fg-muted'
                )}>
                  <span>Page {p.pageNum}</span>
                  <span>{p.changed ? 'Changed' : 'Identical'}</span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border">
                  {[
                    { label: 'PDF A', url: p.aUrl },
                    { label: 'PDF B', url: p.bUrl },
                    { label: 'Diff',  url: p.diffUrl },
                  ].map(({ label, url }) => (
                    <div key={label} className="p-2">
                      <p className="mb-1 text-center text-xs text-fg-subtle">{label}</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`${label} page ${p.pageNum}`} className="w-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-12">
        <FAQAccordion items={config.faq} />
      </div>
      <RelatedToolsStrip slugs={config.relatedTools} />
    </div>
  )
}
