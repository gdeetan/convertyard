'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Lock } from 'lucide-react'
import { reorderPdf } from '@/lib/converters/pdf'
import { getPageCount, renderPage } from '@/lib/converters/mupdf-client'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { config } from '@/content/tools/reorder-pdf-pages'

type Phase = 'idle' | 'loading' | 'editing' | 'processing' | 'done'

interface PageEntry {
  originalIndex: number
  instanceId: string
}

const MAX_HISTORY = 50

export default function ReorderPdfPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageEntry[]>([])
  const [history, setHistory] = useState<PageEntry[][]>([])
  const [future, setFuture] = useState<PageEntry[][]>([])
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({})
  const [originalCount, setOriginalCount] = useState(0)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const bufferRef = useRef<ArrayBuffer | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setPhase('loading')
    setError(null)
    setThumbnails({})
    setHistory([])
    setFuture([])
    setResultUrl(null)
    try {
      const buffer = await f.arrayBuffer()
      bufferRef.current = buffer
      const count = await getPageCount(buffer.slice(0))
      setOriginalCount(count)
      const initial: PageEntry[] = Array.from({ length: count }, (_, i) => ({
        originalIndex: i,
        instanceId: `orig-${i}`,
      }))
      setPages(initial)
      setPhase('editing')

      // Render thumbnails in parallel
      for (let i = 0; i < count; i++) {
        const idx = i
        ;(async () => {
          try {
            const jpeg = await renderPage(buffer.slice(0), idx, 72, 80)
            const src = URL.createObjectURL(new Blob([jpeg], { type: 'image/jpeg' }))
            setThumbnails(prev => ({ ...prev, [idx]: src }))
          } catch { /* skip */ }
        })()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
      setPhase('idle')
    }
  }, [])

  // Keyboard undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        setHistory(prev => {
          if (prev.length === 0) return prev
          const last = prev[prev.length - 1]
          setFuture(f => [pages, ...f].slice(0, MAX_HISTORY))
          setPages(last)
          return prev.slice(0, -1)
        })
      }
      if (ctrl && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        setFuture(prev => {
          if (prev.length === 0) return prev
          const next = prev[0]
          setHistory(h => [...h, pages].slice(-MAX_HISTORY))
          setPages(next)
          return prev.slice(1)
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // pages in dep array is load-bearing: keyboard handler closes over current pages
  // for the setFuture/setHistory calls that reference it directly (not via updater)
  }, [pages])

  const pushHistory = useCallback((current: PageEntry[]) => {
    setHistory(prev => [...prev, current].slice(-MAX_HISTORY))
    setFuture([])
  }, [])

  const deletePage = useCallback((listIdx: number) => {
    pushHistory(pages)
    setPages(prev => prev.filter((_, i) => i !== listIdx))
  }, [pushHistory, pages])

  const duplicatePage = useCallback((listIdx: number) => {
    pushHistory(pages)
    setPages(prev => {
      const entry = prev[listIdx]
      const copy: PageEntry = {
        originalIndex: entry.originalIndex,
        instanceId: `dup-${entry.originalIndex}-${Date.now()}`,
      }
      const next = [...prev]
      next.splice(listIdx + 1, 0, copy)
      return next
    })
  }, [pushHistory, pages])

  const handleDragStart = useCallback((listIdx: number) => {
    dragIndexRef.current = listIdx
  }, [])

  const handleDrop = useCallback((targetIdx: number) => {
    const from = dragIndexRef.current
    if (from === null || from === targetIdx) {
      dragIndexRef.current = null
      setDragOver(null)
      return
    }
    pushHistory(pages)
    setPages(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
    dragIndexRef.current = null
    setDragOver(null)
  }, [pushHistory, pages])

  const applyChanges = useCallback(async () => {
    if (!file) return
    setPhase('processing')
    setError(null)
    try {
      const pageOrder = pages.map(p => p.originalIndex)
      const result = await reorderPdf(file, pageOrder)
      const url = URL.createObjectURL(result)
      setResultUrl(url)
      setResultName(result.name)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reorder failed')
      setPhase('editing')
    }
  }, [file, pages])

  const hasChanges = pages.length !== originalCount || pages.some((p, i) => p.originalIndex !== i)

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf')
    if (f) loadFile(f)
  }, [loadFile])

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
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
      {(phase === 'idle' || phase === 'loading') && (
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-16 text-center cursor-pointer hover:border-primary transition-colors mb-6"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
          />
          {phase === 'loading'
            ? <p className="text-fg-muted">Loading PDF&hellip;</p>
            : (
              <>
                <p className="text-lg font-medium mb-1 text-fg">Drop a PDF here</p>
                <p className="text-sm text-fg-subtle">or click to browse</p>
              </>
            )
          }
        </div>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Editor */}
      {(phase === 'editing' || phase === 'processing') && (
        <>
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-500">
            <span className="font-medium text-gray-800">{pages.length} page{pages.length !== 1 ? 's' : ''}</span>
            <span>&middot;</span>
            <button
              onClick={() => {
                if (history.length === 0) return
                const last = history[history.length - 1]
                setFuture(f => [pages, ...f].slice(0, MAX_HISTORY))
                setPages(last)
                setHistory(prev => prev.slice(0, -1))
              }}
              disabled={history.length === 0}
              className="disabled:opacity-40 hover:text-gray-800"
            >&#8634; Undo</button>
            <button
              onClick={() => {
                if (future.length === 0) return
                const next = future[0]
                setHistory(h => [...h, pages].slice(-MAX_HISTORY))
                setPages(next)
                setFuture(prev => prev.slice(1))
              }}
              disabled={future.length === 0}
              className="disabled:opacity-40 hover:text-gray-800"
            >&#8635; Redo</button>
            <span className="text-gray-400">&middot; Ctrl+Z / Ctrl+Y</span>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {pages.map((entry, listIdx) => (
              <div
                key={entry.instanceId}
                draggable
                onDragStart={() => handleDragStart(listIdx)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(listIdx) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(listIdx)}
                className={`relative group border-2 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                  dragOver === listIdx ? 'border-blue-400 scale-105' : 'border-gray-200'
                }`}
              >
                {thumbnails[entry.originalIndex] ? (
                  <img
                    src={thumbnails[entry.originalIndex]}
                    alt={`Page ${listIdx + 1}`}
                    className="w-full"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full bg-gray-50 flex items-center justify-center text-xs text-gray-400"
                    style={{ aspectRatio: '0.707' }}
                  >
                    Loading&hellip;
                  </div>
                )}
                <div className="absolute top-1 left-1 text-xs bg-black/50 text-white px-1 rounded" aria-hidden="true">
                  {listIdx + 1}
                </div>
                {entry.originalIndex !== listIdx && (
                  <div className="absolute top-1 right-1 text-xs bg-yellow-400 text-yellow-900 px-1 rounded" aria-hidden="true">
                    orig {entry.originalIndex + 1}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicatePage(listIdx) }}
                    className="text-white text-xs px-2 py-0.5 hover:bg-white/20 rounded"
                    title="Duplicate page"
                    aria-label={`Duplicate page ${listIdx + 1}`}
                  >&#10697;</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePage(listIdx) }}
                    className="text-white text-xs px-2 py-0.5 hover:bg-white/20 rounded"
                    title="Delete page"
                    aria-label={`Delete page ${listIdx + 1}`}
                  >&times;</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={applyChanges}
              disabled={!hasChanges || phase === 'processing'}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {phase === 'processing' ? 'Applying…' : 'Apply Changes'}
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
          <p className="font-medium text-green-800 mb-3">&#10003; Pages reordered</p>
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
            Reorder another file
          </button>
        </div>
      )}

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
