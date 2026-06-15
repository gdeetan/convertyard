'use client'
import { useCallback, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib'
import { PdfThumbnailGrid } from '@/components/pdf/PdfThumbnailGrid'
import { rotatePdf } from '@/lib/converters/pdf'
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
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf')
    if (f) loadFile(f)
  }, [loadFile])

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
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">{config.title}</h1>
      <p className="text-gray-500 mb-6">{config.subtitle}</p>

      {/* Drop zone */}
      {(phase === 'idle' || phase === 'loading') && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-400 transition-colors mb-6"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
          />
          {phase === 'loading'
            ? <p className="text-gray-500">Loading PDF&hellip;</p>
            : (
              <>
                <p className="text-lg font-medium mb-1">Drop a PDF here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </>
            )
          }
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
            columns={5}
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

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Frequently asked questions</h2>
        <div className="space-y-4">
          {config.faq.map((item, i) => (
            <details key={i} className="border rounded-lg">
              <summary className="px-4 py-3 cursor-pointer font-medium">{item.q}</summary>
              <p className="px-4 pb-4 text-gray-600 text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}
