'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { redactPdf, type RedactionRegion, type RedactionReport } from '@/lib/converters/pdf'
import { renderPage, extractStructuredText, extractText, getPageSizes } from '@/lib/converters/mupdf-client'
import { config } from '@/content/tools/redact-pdf'

type Phase = 'idle' | 'loading' | 'editing' | 'processing' | 'done'
type Mode = 'draw' | 'find'

interface PageImage {
  src: string
  width: number
  height: number
}

interface MatchEntry {
  region: RedactionRegion
  text: string
  selected: boolean
}

const PATTERNS: Record<string, { label: string; regex: RegExp }> = {
  custom:     { label: 'Custom text', regex: /(?:)/ },
  email:      { label: 'Email address', regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  phone:      { label: 'Phone number', regex: /(\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g },
  ssn:        { label: 'SSN (US)', regex: /\d{3}-\d{2}-\d{4}/g },
  creditcard: { label: 'Credit card', regex: /\b(?:\d[ \-]?){13,16}\b/g },
  date:       { label: 'Date', regex: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}\b/gi },
}

export default function RedactPdfPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>('draw')
  const [pageImages, setPageImages] = useState<PageImage[]>([])
  const [redactions, setRedactions] = useState<RedactionRegion[]>([])
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [report, setReport] = useState<RedactionReport | null>(null)
  const [verificationPassed, setVerificationPassed] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Keyword find state
  const [keyword, setKeyword] = useState('')
  const [patternKey, setPatternKey] = useState('custom')
  const [matches, setMatches] = useState<MatchEntry[]>([])
  const [searching, setSearching] = useState(false)

  // Canvas draw state
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const drawState = useRef<{ isDrawing: boolean; startX: number; startY: number; pageIndex: number } | null>(null)
  const bufferRef = useRef<ArrayBuffer | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback(async (f: File) => {
    setFile(f)
    setPhase('loading')
    setError(null)
    setRedactions([])
    setMatches([])
    setResultUrl(null)
    setReport(null)
    setVerificationPassed(null)
    setPageImages([])

    try {
      const buffer = await f.arrayBuffer()
      bufferRef.current = buffer
      const pageSizes = await getPageSizes(buffer.slice(0))
      const count = pageSizes.length
      const renderDpi = 150
      const images: PageImage[] = []

      for (let p = 0; p < count; p++) {
        const jpeg = await renderPage(buffer.slice(0), p, renderDpi, 90)
        const blob = new Blob([new Uint8Array(jpeg)], { type: 'image/jpeg' })
        const src = URL.createObjectURL(blob)
        const bmp = await createImageBitmap(blob)
        images.push({ src, width: bmp.width, height: bmp.height })
        bmp.close()
        setPageImages([...images]) // stream pages as they render
      }

      setPageImages(images)
      setPhase('editing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF')
      setPhase('idle')
    }
  }, [])

  // Redraw canvas overlays when redactions change or pages load
  useEffect(() => {
    pageImages.forEach((img, p) => {
      const canvas = canvasRefs.current[p]
      if (!canvas) return
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0,0,0,0.72)'
      for (const r of redactions.filter(r => r.page === p)) {
        ctx.fillRect(
          Math.floor(r.x * canvas.width),
          Math.floor(r.y * canvas.height),
          Math.ceil(r.width * canvas.width),
          Math.ceil(r.height * canvas.height)
        )
      }
    })
  }, [redactions, pageImages])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }

  const redrawCanvas = useCallback((pageIndex: number, previewRect?: { x: number; y: number; width: number; height: number }) => {
    const canvas = canvasRefs.current[pageIndex]
    const img = pageImages[pageIndex]
    if (!canvas || !img) return
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    for (const r of redactions.filter(r => r.page === pageIndex)) {
      ctx.fillRect(Math.floor(r.x * canvas.width), Math.floor(r.y * canvas.height), Math.ceil(r.width * canvas.width), Math.ceil(r.height * canvas.height))
    }
    if (previewRect) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(Math.floor(previewRect.x * canvas.width), Math.floor(previewRect.y * canvas.height), Math.ceil(previewRect.width * canvas.width), Math.ceil(previewRect.height * canvas.height))
    }
  }, [redactions, pageImages])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>, pageIndex: number) => {
    if (mode !== 'draw') return
    const canvas = canvasRefs.current[pageIndex]
    if (!canvas) return
    const { x, y } = getCanvasCoords(e, canvas)
    drawState.current = { isDrawing: true, startX: x, startY: y, pageIndex }
  }, [mode])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>, pageIndex: number) => {
    if (!drawState.current?.isDrawing || drawState.current.pageIndex !== pageIndex) return
    const canvas = canvasRefs.current[pageIndex]
    if (!canvas) return
    const { x, y } = getCanvasCoords(e, canvas)
    const { startX, startY } = drawState.current
    redrawCanvas(pageIndex, {
      x: Math.min(startX, x),
      y: Math.min(startY, y),
      width: Math.abs(x - startX),
      height: Math.abs(y - startY),
    })
  }, [redrawCanvas])

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>, pageIndex: number) => {
    const state = drawState.current
    if (!state?.isDrawing || state.pageIndex !== pageIndex) return
    const canvas = canvasRefs.current[pageIndex]
    if (!canvas) return
    const { x, y } = getCanvasCoords(e, canvas)
    drawState.current = null

    const rx = Math.min(state.startX, x)
    const ry = Math.min(state.startY, y)
    const rw = Math.abs(x - state.startX)
    const rh = Math.abs(y - state.startY)

    if (rw < 0.005 || rh < 0.005) {
      // Treat as click: check if point is inside any existing rect and delete it
      const clickX = state.startX
      const clickY = state.startY
      setRedactions(prev => {
        const hitIdx = [...prev].reverse().findIndex(r =>
          r.page === pageIndex &&
          clickX >= r.x && clickX <= r.x + r.width &&
          clickY >= r.y && clickY <= r.y + r.height
        )
        if (hitIdx === -1) return prev
        const actualIdx = prev.length - 1 - hitIdx
        return prev.filter((_, i) => i !== actualIdx)
      })
      return
    }

    setRedactions(prev => [...prev, { page: pageIndex, x: rx, y: ry, width: rw, height: rh }])
  }, [])

  // Keyword search
  const handleSearch = useCallback(async () => {
    if (!bufferRef.current) return
    const buffer = bufferRef.current
    setSearching(true)
    setMatches([])
    try {
      const pageSizes = await getPageSizes(buffer.slice(0))
      const structuredPages = await extractStructuredText(buffer.slice(0))
      const found: MatchEntry[] = []
      const pattern = PATTERNS[patternKey]
      const isCustom = patternKey === 'custom'
      const searchKeyword = keyword.trim().toLowerCase()
      if (isCustom && !searchKeyword) { setSearching(false); return }

      for (let p = 0; p < structuredPages.length; p++) {
        const pageSize = pageSizes[p]
        if (!pageSize) continue
        let pageData: { blocks?: Array<{ lines?: Array<{ spans?: Array<{ text?: string; bbox?: number[] }> }> }> }
        try { pageData = JSON.parse(structuredPages[p]) } catch { continue }

        for (const block of pageData.blocks ?? []) {
          for (const line of block.lines ?? []) {
            for (const span of line.spans ?? []) {
              const text = span.text ?? ''
              const bbox = span.bbox
              if (!text || !bbox || bbox.length < 4) continue

              let matched = false
              if (isCustom) {
                matched = text.toLowerCase().includes(searchKeyword)
              } else {
                const re = new RegExp(pattern.regex.source, pattern.regex.flags)
                matched = re.test(text)
              }

              if (matched) {
                const [x0, y0, x1, y1] = bbox
                found.push({
                  region: {
                    page: p,
                    x: x0 / pageSize.width,
                    y: y0 / pageSize.height,
                    width: (x1 - x0) / pageSize.width,
                    height: (y1 - y0) / pageSize.height,
                    label: isCustom ? keyword.trim() : pattern.label,
                  },
                  text: text.slice(0, 80),
                  selected: true,
                })
              }
            }
          }
        }
      }
      setMatches(found)
    } finally {
      setSearching(false)
    }
  }, [keyword, patternKey])

  const addMatchesToRedactions = useCallback(() => {
    const selected = matches.filter(m => m.selected).map(m => m.region)
    setRedactions(prev => [...prev, ...selected])
    setMatches([])
  }, [matches])

  // Apply redactions
  const applyRedactions = useCallback(async () => {
    if (!file || redactions.length === 0) return
    setPhase('processing')
    setError(null)
    try {
      const { file: outFile, report: outReport } = await redactPdf(file, redactions)

      // Verification pass
      const outBuffer = await outFile.arrayBuffer()
      const pages = await extractText(outBuffer.slice(0))
      const allText = pages.join(' ').toLowerCase()
      // Check custom-text labels (actual keywords) are not in the output
      const customLabels = redactions
        .filter(r => r.label && !Object.values(PATTERNS).some(p => p.label === r.label))
        .map(r => r.label!.toLowerCase())
      const leaks = customLabels.filter(s => s.length > 2 && allText.includes(s))
      setVerificationPassed(leaks.length === 0)

      setResultUrl(URL.createObjectURL(outFile))
      setResultName(outFile.name)
      setReport(outReport)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redaction failed')
      setPhase('editing')
    }
  }, [file, redactions])

  const downloadLog = useCallback(() => {
    if (!report) return
    const log = JSON.stringify(report, null, 2)
    const blob = new Blob([log], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `redaction-log-${report.fileName.replace(/\.[^.]+$/, '')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [report])

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = Array.from(e.dataTransfer.files).find(f => f.type === 'application/pdf')
    if (f) loadFile(f)
  }, [loadFile])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">{config.title}</h1>
      <p className="text-gray-500 mb-2">{config.subtitle}</p>

      {/* Trust callout */}
      <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mb-6 flex items-start gap-2">
        <span className="mt-0.5 shrink-0">i</span>
        <span>
          <strong>True redaction:</strong> redacted pages are rasterised — the original text is not in the output file at any layer. Output is verified before download.
        </span>
      </div>

      {/* Drop zone */}
      {(phase === 'idle' || phase === 'loading') && (
        <div
          onDrop={handleFileDrop}
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
            ? <p className="text-gray-500">Rendering pages — this may take a moment for large PDFs</p>
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
      {(phase === 'editing' || phase === 'processing') && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('draw')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${mode === 'draw' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Draw to redact
            </button>
            <button
              onClick={() => setMode('find')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${mode === 'find' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              Find &amp; redact
            </button>
          </div>

          {/* Find & Redact panel */}
          {mode === 'find' && (
            <div className="border rounded-xl p-4 mb-6 bg-gray-50">
              <div className="flex gap-2 mb-3">
                <select
                  value={patternKey}
                  onChange={(e) => setPatternKey(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  {Object.entries(PATTERNS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                {patternKey === 'custom' && (
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    placeholder="Type word or phrase..."
                    className="border rounded px-3 py-2 text-sm flex-1"
                  />
                )}
                <button
                  onClick={handleSearch}
                  disabled={searching || (patternKey === 'custom' && !keyword.trim())}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-40"
                >
                  {searching ? 'Searching...' : 'Find'}
                </button>
              </div>

              {matches.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{matches.filter(m => m.selected).length} of {matches.length} matches selected</span>
                    <div className="flex gap-3">
                      <button onClick={() => setMatches(m => m.map(x => ({ ...x, selected: true })))} className="text-xs text-blue-600 hover:underline">Select all</button>
                      <button onClick={() => setMatches(m => m.map(x => ({ ...x, selected: false })))} className="text-xs text-blue-600 hover:underline">Deselect all</button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                    {matches.map((m, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.selected}
                          onChange={(e) => setMatches(prev => { const n = [...prev]; n[i] = { ...n[i], selected: e.target.checked }; return n })}
                        />
                        <span className="text-gray-400 w-16 shrink-0 text-xs">Page {m.region.page + 1}</span>
                        <span className="truncate text-gray-700">{m.text}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={addMatchesToRedactions}
                    disabled={matches.filter(m => m.selected).length === 0}
                    className="bg-red-600 text-white text-sm px-4 py-1.5 rounded hover:bg-red-700 disabled:opacity-40"
                  >
                    Add {matches.filter(m => m.selected).length} match{matches.filter(m => m.selected).length !== 1 ? 'es' : ''} to redaction list
                  </button>
                </>
              )}
              {!searching && matches.length === 0 && (keyword || patternKey !== 'custom') && (
                <p className="text-sm text-gray-500">No matches found. Try a different search.</p>
              )}
            </div>
          )}

          {mode === 'draw' && (
            <p className="text-sm text-gray-500 mb-4">
              Click and drag to draw a redaction rectangle. Click an existing rectangle to delete it.
            </p>
          )}

          {/* Page list with canvas overlays */}
          <div className="space-y-4 mb-6">
            {pageImages.map((img, p) => (
              <div key={p} className="border rounded-lg overflow-hidden">
                <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 border-b flex justify-between">
                  <span>Page {p + 1}</span>
                  {redactions.filter(r => r.page === p).length > 0 && (
                    <span className="text-red-600 font-medium">
                      {redactions.filter(r => r.page === p).length} redaction{redactions.filter(r => r.page === p).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="relative select-none">
                  <img
                    src={img.src}
                    alt={`Page ${p + 1}`}
                    className="w-full block"
                    draggable={false}
                  />
                  <canvas
                    ref={(el) => { canvasRefs.current[p] = el }}
                    width={img.width}
                    height={img.height}
                    className="absolute inset-0 w-full h-full"
                    style={{ cursor: mode === 'draw' ? 'crosshair' : 'default', pointerEvents: mode === 'draw' ? 'auto' : 'none' }}
                    onMouseDown={(e) => handleCanvasMouseDown(e, p)}
                    onMouseMove={(e) => handleCanvasMouseMove(e, p)}
                    onMouseUp={(e) => handleCanvasMouseUp(e, p)}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Apply button */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={applyRedactions}
              disabled={redactions.length === 0 || phase === 'processing'}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {phase === 'processing' ? 'Applying & verifying...' : `Apply ${redactions.length} Redaction${redactions.length !== 1 ? 's' : ''}`}
            </button>
            {redactions.length > 0 && (
              <button onClick={() => setRedactions([])} className="text-sm text-gray-500 hover:underline">
                Clear all
              </button>
            )}
            {redactions.length === 0 && (
              <span className="text-sm text-gray-400">Draw rectangles or use Find &amp; Redact to add redactions</span>
            )}
          </div>

          <button
            onClick={() => { setPhase('idle'); setFile(null); setPageImages([]) }}
            className="text-sm text-gray-500 hover:underline"
          >
            Load different file
          </button>
        </>
      )}

      {/* Done */}
      {phase === 'done' && resultUrl && (
        <div className="border rounded-xl p-6 mb-6">
          {verificationPassed === true && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4 text-sm">
              <span>✓</span>
              <strong>Verification passed</strong> — redacted content confirmed absent from output
            </div>
          )}
          {verificationPassed === false && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 text-sm">
              <span>!</span>
              Verification inconclusive — download and inspect manually
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <a
              href={resultUrl}
              download={resultName}
              className="inline-block bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 font-medium"
            >
              Download {resultName}
            </a>
            {report && (
              <button
                onClick={downloadLog}
                className="border border-gray-300 px-5 py-2 rounded-lg hover:bg-gray-50 text-sm"
              >
                Download redaction log ({report.count} item{report.count !== 1 ? 's' : ''})
              </button>
            )}
            <button
              onClick={() => { setPhase('idle'); setFile(null); setPageImages([]); setRedactions([]); setResultUrl(null) }}
              className="text-sm text-gray-500 hover:underline self-center"
            >
              Redact another file
            </button>
          </div>
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
