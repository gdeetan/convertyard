'use client'
import { useCallback, useState } from 'react'
import { Lock } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { PdfThumbnailGrid } from '@/components/pdf/PdfThumbnailGrid'
import { rotatePdf } from '@/lib/converters/pdf'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { config } from '@/content/tools/rotate-pdf'

type Phase = 'idle' | 'loading' | 'editing' | 'processing' | 'done'

export default function RotatePdfPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [rotations, setRotations] = useState<number[]>([])
  const [initialRotations, setInitialRotations] = useState<number[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setPhase('loading')
    setError(null)
    try {
      const buffer = await f.arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const rots = doc.getPages().map(p => p.getRotation().angle)
      setRotations(rots)
      setInitialRotations(rots)
      setSelected(new Set())
      setResultUrl(null)
      setPhase('editing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
      setPhase('idle')
    }
  }, [])

  const rotatePage = useCallback((idx: number, delta: number) => {
    setRotations(prev => {
      const next = [...prev]
      next[idx] = ((next[idx] + delta) + 360) % 360
      return next
    })
  }, [])

  const rotatePages = useCallback((indices: number[], delta: number) => {
    setRotations(prev => {
      const next = [...prev]
      for (const i of indices) next[i] = ((next[i] + delta) + 360) % 360
      return next
    })
  }, [])

  const toggleSelected = useCallback((idx: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }, [])

  const applyRotations = useCallback(async () => {
    if (!file) return
    setPhase('processing')
    setError(null)
    try {
      const rotMap: Record<number, number> = {}
      rotations.forEach((deg, i) => { rotMap[i] = deg })
      const result = await rotatePdf(file, rotMap)
      const url = URL.createObjectURL(result)
      setResultUrl(url)
      setResultName(result.name)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rotation failed')
      setPhase('editing')
    }
  }, [file, rotations])

  const hasChanges = rotations.some((r, i) => r !== initialRotations[i])
  const selectionList = Array.from(selected)
  const allIndices = rotations.map((_, i) => i)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'PDF Tools', href: '/pdf' },
          { label: config.title },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{config.title}</h1>
        <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
          Files never leave your browser. No uploads. No accounts.
        </div>
      </div>

      {/* Drop zone */}
      {phase === 'loading' && (
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm mb-6">
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-fg-muted">Loading PDF…</p>
          </div>
        </div>
      )}
      {phase === 'idle' && (
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm mb-6">
          <Dropzone
            accepts={config.accepts}
            acceptsExt={config.acceptsExt}
            onAdd={(files) => { if (files[0]) loadFile(files[0]) }}
          />
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Editor */}
      {(phase === 'editing' || phase === 'processing') && file && (
        <>
          {/* Trust badge */}
          <div className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 mb-4">
            <span>&#10003;</span> Rotation saved permanently to file
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button onClick={() => setSelected(new Set(allIndices))} className="text-sm px-3 py-1 border rounded hover:bg-gray-50">Select all</button>
            <button onClick={() => setSelected(new Set())} className="text-sm px-3 py-1 border rounded hover:bg-gray-50">Deselect all</button>
            <div className="w-px h-5 bg-gray-300" />
            <button
              onClick={() => rotatePages(selectionList, -90)}
              disabled={selected.size === 0}
              className="text-sm px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
            >&#8634; Rotate selection left</button>
            <button
              onClick={() => rotatePages(selectionList, 90)}
              disabled={selected.size === 0}
              className="text-sm px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-40"
            >&#8635; Rotate selection right</button>
            <div className="w-px h-5 bg-gray-300" />
            <button onClick={() => rotatePages(allIndices, -90)} className="text-sm px-3 py-1 border rounded hover:bg-gray-50">&#8634; All left</button>
            <button onClick={() => rotatePages(allIndices, 90)} className="text-sm px-3 py-1 border rounded hover:bg-gray-50">&#8635; All right</button>
          </div>

          <PdfThumbnailGrid
            file={file}
            thumbnailWidth={140}
            columns={4}
            getImgStyle={(i) => ({
              transform: `rotate(${rotations[i]}deg)`,
              transition: 'transform 0.2s',
              outline: selected.has(i) ? '2px solid #3b82f6' : undefined,
            })}
            onPageClick={toggleSelected}
            renderPageOverlay={(i) => (
              <>
                {rotations[i] !== initialRotations[i] && (
                  <span className="absolute top-1 right-1 text-xs bg-yellow-400 text-yellow-900 px-1 rounded font-medium">
                    {rotations[i]}&deg;
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="text-white text-xs px-1 hover:bg-white/20 rounded"
                    onClick={(e) => { e.stopPropagation(); rotatePage(i, -90) }}
                    title="Rotate left 90deg"
                  >&#8634;</button>
                  <button
                    className="text-white text-xs px-1 hover:bg-white/20 rounded"
                    onClick={(e) => { e.stopPropagation(); rotatePage(i, 90) }}
                    title="Rotate right 90deg"
                  >&#8635;</button>
                  <button
                    className="text-white text-xs px-1 hover:bg-white/20 rounded"
                    onClick={(e) => { e.stopPropagation(); rotatePage(i, 180) }}
                    title="Rotate 180deg"
                  >180&deg;</button>
                  <button
                    className="text-white text-xs px-1 hover:bg-white/20 rounded"
                    onClick={(e) => { e.stopPropagation(); setRotations(prev => { const n = [...prev]; n[i] = initialRotations[i]; return n }) }}
                    title="Reset to original"
                  >&#8617;</button>
                </div>
              </>
            )}
          />

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={applyRotations}
              disabled={!hasChanges || phase === 'processing'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {phase === 'processing' ? 'Applying…' : 'Apply Rotations'}
            </button>
            {!hasChanges && <span className="text-sm text-gray-400">No changes to apply</span>}
            <button onClick={() => { setPhase('idle'); setFile(null) }} className="text-sm text-gray-500 hover:underline">
              Load different file
            </button>
          </div>
        </>
      )}

      {/* Done */}
      {phase === 'done' && resultUrl && (
        <div className="border border-green-200 rounded-xl p-6 bg-green-50 mb-6">
          <p className="font-medium text-green-800 mb-3">&#10003; Rotation applied permanently</p>
          <a
            href={resultUrl}
            download={resultName}
            className="inline-block bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800 font-medium"
          >
            Download {resultName}
          </a>
          <button
            onClick={() => { setPhase('idle'); setFile(null); setResultUrl(null) }}
            className="ml-4 text-sm text-gray-600 hover:underline"
          >
            Rotate another file
          </button>
        </div>
      )}

      {/* How it works */}
      <section className="mt-12" aria-labelledby="how-it-works-heading">
        <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-fg">How it works</h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="list">
          {[
            { n: '1', label: 'Drop your PDF', desc: 'Drag and drop, click to browse, or paste from clipboard.' },
            { n: '2', label: 'Select & rotate pages', desc: 'Click pages to select them, then rotate left or right. Or rotate all pages at once from the toolbar.' },
            { n: '3', label: 'Apply rotations', desc: 'Rotation is baked permanently into the PDF — not just a view setting. Runs entirely in your browser.' },
            { n: '4', label: 'Download', desc: 'Save the rotated PDF directly to your device.' },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted text-sm font-bold text-primary" aria-hidden="true">{step.n}</span>
              <div>
                <p className="text-sm font-semibold text-fg">{step.label}</p>
                <p className="mt-0.5 text-sm text-fg-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      {config.faq.length > 0 && (
        <section className="mt-12">
          <FAQAccordion items={config.faq} />
        </section>
      )}

      {/* Related tools */}
      {config.relatedTools.length > 0 && (
        <section className="mt-12">
          <RelatedToolsStrip slugs={config.relatedTools} />
        </section>
      )}
    </div>
  )
}
