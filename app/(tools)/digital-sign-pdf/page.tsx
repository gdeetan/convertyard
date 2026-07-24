'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Lock, RefreshCcw, Pen, Type, Trash2, ChevronLeft, ChevronRight, Move } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { PDFDocument } from 'pdf-lib'
import { config } from '@/content/tools/digital-sign-pdf'

type Mode = 'draw' | 'type'
type Phase = 'idle' | 'signing' | 'positioning' | 'applying' | 'done' | 'error'

interface SignaturePos {
  x: number  // 0–1 fraction of preview width
  y: number  // 0–1 fraction of preview height
}

export default function Page() {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [mode, setMode] = useState<Mode>('draw')
  const [typedName, setTypedName] = useState('')
  const [sigDataUrl, setSigDataUrl] = useState<string | null>(null)
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(1)
  const [selectedPage, setSelectedPage] = useState(0)
  const [sigPos, setSigPos] = useState<SignaturePos>({ x: 0.1, y: 0.7 })
  const [dragging, setDragging] = useState(false)
  const [applyToPages, setApplyToPages] = useState<'current' | 'all' | 'custom'>('current')
  const [customPages, setCustomPages] = useState<Set<number>>(new Set())
  // Positioning wizard state
  const [positioningQueue, setPositioningQueue] = useState<number[]>([])
  const [positioningIdx, setPositioningIdx] = useState(0)
  const [pagePositions, setPagePositions] = useState<Map<number, SignaturePos>>(new Map())
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [error, setError] = useState('')

  const drawCanvas = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  // Render preview when file or selected page changes
  useEffect(() => {
    if (!file) return
    let cancelled = false
    ;(async () => {
      const buf = await file.arrayBuffer()

      // Get page count on first load
      if (selectedPage === 0) {
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
        setPageCount(doc.getPageCount())
      }

      const { renderPagePng } = await import('@/lib/converters/mupdf-client')
      const pngBuf = await renderPagePng(buf, selectedPage, 96)
      if (cancelled) return
      const url = URL.createObjectURL(new Blob([new Uint8Array(pngBuf)], { type: 'image/png' }))
      setPagePreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
      setPhase(p => p === 'idle' ? 'signing' : p)
    })()
    return () => { cancelled = true }
  }, [file, selectedPage])

  // Drawing canvas handlers
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvas.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvas.current!
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true
    const ctx = drawCanvas.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const ctx = drawCanvas.current!.getContext('2d')!
    const { x, y } = getPos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = () => { isDrawing.current = false }

  const startTouchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    isDrawing.current = true
    const ctx = drawCanvas.current!.getContext('2d')!
    const { x, y } = getTouchPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const touchDraw = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const ctx = drawCanvas.current!.getContext('2d')!
    const { x, y } = getTouchPos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const clearCanvas = () => {
    const canvas = drawCanvas.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    setSigDataUrl(null)
  }

  const captureSignature = useCallback(() => {
    if (mode === 'draw') {
      setSigDataUrl(drawCanvas.current!.toDataURL('image/png'))
    } else {
      if (!typedName.trim()) return
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 160
      const ctx = canvas.getContext('2d')!
      ctx.font = 'italic 56px Georgia, serif'
      ctx.fillStyle = '#1a1a1a'
      ctx.fillText(typedName.trim(), 16, 80)
      setSigDataUrl(canvas.toDataURL('image/png'))
    }
  }, [mode, typedName])

  // Unified drag start for mouse and touch
  const beginDrag = (clientX: number, clientY: number) => {
    if (!previewRef.current) return
    setDragging(true)
    dragStart.current = { mx: clientX, my: clientY, px: sigPos.x, py: sigPos.y }
  }

  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    beginDrag(e.clientX, e.clientY)
    e.preventDefault()
  }

  const startTouchDrag = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    beginDrag(touch.clientX, touch.clientY)
    e.preventDefault()
  }

  useEffect(() => {
    const onMove = (clientX: number, clientY: number) => {
      if (!dragging || !dragStart.current || !previewRef.current) return
      const rect = previewRef.current.getBoundingClientRect()
      const dx = (clientX - dragStart.current.mx) / rect.width
      const dy = (clientY - dragStart.current.my) / rect.height
      setSigPos({
        x: Math.max(0, Math.min(0.85, dragStart.current.px + dx)),
        y: Math.max(0, Math.min(0.9, dragStart.current.py + dy)),
      })
    }

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging) return
      onMove(e.touches[0].clientX, e.touches[0].clientY)
      e.preventDefault()
    }
    const onUp = () => setDragging(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging])

  const getPagesToSign = useCallback(() => {
    return applyToPages === 'all'
      ? Array.from({ length: pageCount }, (_, i) => i)
      : applyToPages === 'custom'
      ? Array.from(customPages).sort((a, b) => a - b)
      : [selectedPage]
  }, [applyToPages, pageCount, customPages, selectedPage])

  // positions: Map of pageIndex → SignaturePos recorded per page in the wizard
  const applySignature = useCallback(async (positions: Map<number, SignaturePos>) => {
    if (!file || !sigDataUrl || !pagePreviewUrl) return
    setPhase('applying')
    try {
      const previewEl = previewRef.current!
      const previewW = previewEl.offsetWidth
      const sigDisplayW = previewW * 0.15

      const buffer = await file.arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })

      const sigBlob = await fetch(sigDataUrl).then(r => r.blob())
      const sigBytes = new Uint8Array(await sigBlob.arrayBuffer())
      const embedded = await doc.embedPng(sigBytes)

      const pagesToSign = applyToPages === 'all'
        ? Array.from({ length: pageCount }, (_, i) => i)
        : applyToPages === 'custom'
        ? Array.from(customPages).sort((a, b) => a - b)
        : [selectedPage]

      for (const pageIndex of pagesToSign) {
        const pos = positions.get(pageIndex) ?? sigPos
        const page = doc.getPages()[pageIndex]
        const { width: pageW, height: pageH } = page.getSize()
        const pdfX = pos.x * pageW
        const pdfY = pageH - pos.y * pageH
        const sigPdfW = (sigDisplayW / previewW) * pageW
        const sigPdfH = sigPdfW * (160 / 400)
        page.drawImage(embedded, { x: pdfX, y: pdfY - sigPdfH, width: sigPdfW, height: sigPdfH })
      }

      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      const baseName = file.name.replace(/\.pdf$/i, '')
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultUrl(URL.createObjectURL(blob))
      setResultName(`${baseName}-signed.pdf`)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply signature')
      setPhase('error')
    }
  }, [file, sigDataUrl, pagePreviewUrl, applyToPages, customPages, pageCount, selectedPage, sigPos, resultUrl])

  // Called when user clicks the main action button in signing phase
  const handleActionButton = useCallback(() => {
    const pages = getPagesToSign()
    if (pages.length <= 1) {
      // Single page: apply directly with current position
      applySignature(new Map([[pages[0] ?? selectedPage, sigPos]]))
    } else {
      // Multi-page: enter per-page positioning wizard
      setPositioningQueue(pages)
      setPositioningIdx(0)
      setPagePositions(new Map([[pages[0], sigPos]]))
      setSelectedPage(pages[0])
      setPhase('positioning')
    }
  }, [getPagesToSign, applySignature, selectedPage, sigPos])

  // Called on "Next →" / "Apply" during positioning wizard
  const handlePositioningNext = useCallback(() => {
    const currentPage = positioningQueue[positioningIdx]
    const newPositions = new Map(pagePositions)
    newPositions.set(currentPage, sigPos)

    if (positioningIdx === positioningQueue.length - 1) {
      applySignature(newPositions)
    } else {
      setPagePositions(newPositions)
      const nextIdx = positioningIdx + 1
      setPositioningIdx(nextIdx)
      setSelectedPage(positioningQueue[nextIdx])
      // carry current sigPos as default for next page — user can drag to change
    }
  }, [positioningQueue, positioningIdx, pagePositions, sigPos, applySignature])

  const exitPositioning = () => {
    setPhase('signing')
    setPositioningQueue([])
    setPositioningIdx(0)
    setPagePositions(new Map())
    setSelectedPage(positioningQueue[0] ?? selectedPage)
  }

  const handleApplyToPagesChange = (val: 'current' | 'all' | 'custom') => {
    setApplyToPages(val)
    if (val === 'custom') setCustomPages(new Set([selectedPage]))
  }

  const toggleCustomPage = (p: number) => {
    setCustomPages(prev => {
      const next = new Set(prev)
      if (next.has(p)) next.delete(p)
      else next.add(p)
      return next
    })
  }

  const handleReset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (pagePreviewUrl) URL.revokeObjectURL(pagePreviewUrl)
    setFile(null)
    setPhase('idle')
    setSigDataUrl(null)
    setPagePreviewUrl(null)
    setPageCount(1)
    setSelectedPage(0)
    setResultUrl(null)
    setResultName('')
    setError('')
    setTypedName('')
    setApplyToPages('current')
    setCustomPages(new Set())
    setPositioningQueue([])
    setPositioningIdx(0)
    setPagePositions(new Map())
  }

  const isPositioning = phase === 'positioning'
  const isLastPositioningStep = positioningIdx === positioningQueue.length - 1

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: 'PDF Tools', href: '/pdf' },
        { label: config.title },
      ]} />

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg">{config.title}</h1>
      <p className="mt-2 text-fg-muted">{config.subtitle}</p>
      <div className="mt-2 flex items-center gap-1.5 text-xs text-fg-subtle">
        <Lock className="h-3 w-3" />
        <span>Files never leave your browser</span>
      </div>

      {phase === 'idle' && (
        <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 transition-colors hover:border-primary/50">
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              if (f) { setFile(f); setPhase('signing') }
            }}
          />
          <span className="text-lg font-semibold text-fg">Drop a PDF here</span>
          <span className="mt-1 text-sm text-fg-subtle">or click to select</span>
        </label>
      )}

      {(phase === 'signing' || phase === 'positioning' || phase === 'applying') && pagePreviewUrl && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* Left column: signature pad OR positioning step info */}
          {!isPositioning ? (
            <div>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setMode('draw')}
                  className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm',
                    mode === 'draw' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-fg-muted')}
                >
                  <Pen className="h-3.5 w-3.5" /> Draw
                </button>
                <button
                  type="button"
                  onClick={() => setMode('type')}
                  className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm',
                    mode === 'type' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-fg-muted')}
                >
                  <Type className="h-3.5 w-3.5" /> Type
                </button>
              </div>

              {mode === 'draw' ? (
                <div className="relative">
                  <canvas
                    ref={drawCanvas}
                    width={400}
                    height={220}
                    className="w-full rounded-xl border border-border bg-white cursor-crosshair touch-none"
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startTouchDraw}
                    onTouchMove={touchDraw}
                    onTouchEnd={endDraw}
                  />
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute top-2 right-2 rounded p-1 text-fg-subtle hover:text-fg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Type your name"
                  className="w-full rounded-xl border border-border bg-white px-4 py-10 text-3xl italic text-fg-muted placeholder:text-fg-subtle focus:border-primary focus:outline-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                />
              )}

              <button
                type="button"
                onClick={captureSignature}
                className="mt-3 w-full rounded-xl border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                Use this signature
              </button>
            </div>
          ) : (
            /* Positioning wizard — left panel */
            <div className="flex flex-col justify-center">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Step {positioningIdx + 1} of {positioningQueue.length}
              </p>
              <p className="mt-1 text-xl font-semibold text-fg">
                Page {positioningQueue[positioningIdx] + 1}
              </p>
              <p className="mt-2 text-sm text-fg-muted">
                Drag the signature to where you want it on this page, then click{' '}
                <span className="font-medium text-fg">
                  {isLastPositioningStep ? '"Apply Signature"' : `"Next: Page ${positioningQueue[positioningIdx + 1] + 1} →"`}
                </span>.
              </p>

              {/* Progress dots */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {positioningQueue.map((pageIdx, stepIdx) => (
                  <div
                    key={pageIdx}
                    className={cn(
                      'flex h-6 min-w-[1.5rem] items-center justify-center rounded px-1.5 text-[10px] font-medium',
                      stepIdx < positioningIdx
                        ? 'bg-primary/20 text-primary'
                        : stepIdx === positioningIdx
                        ? 'bg-primary text-primary-fg'
                        : 'bg-border text-fg-subtle'
                    )}
                  >
                    {pageIdx + 1}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={exitPositioning}
                className="mt-6 w-fit text-sm text-fg-subtle hover:text-fg-muted"
              >
                ← Change signature
              </button>
            </div>
          )}

          {/* Right column: PDF preview with draggable signature */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-fg-muted">
                {sigDataUrl
                  ? isPositioning ? 'Drag to reposition' : 'Drag signature to reposition'
                  : 'Sign, then drag to position'}
              </p>
              {/* Page nav only in signing phase (wizard drives it during positioning) */}
              {!isPositioning && pageCount > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={selectedPage === 0}
                    onClick={() => setSelectedPage(p => p - 1)}
                    className="rounded p-1 text-fg-muted hover:text-fg disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-fg-muted tabular-nums">
                    {selectedPage + 1} / {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={selectedPage === pageCount - 1}
                    onClick={() => setSelectedPage(p => p + 1)}
                    className="rounded p-1 text-fg-muted hover:text-fg disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              {isPositioning && (
                <span className="text-xs text-fg-subtle tabular-nums">
                  Page {positioningQueue[positioningIdx] + 1}
                </span>
              )}
            </div>

            <div ref={previewRef} className="relative select-none overflow-hidden rounded-xl border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pagePreviewUrl} alt={`PDF page ${selectedPage + 1} preview`} className="w-full" draggable={false} />
              {sigDataUrl && (
                <div
                  className={cn(
                    'absolute cursor-move rounded border-2 border-dashed border-primary/70 bg-white/10 p-0.5 touch-none',
                    dragging && 'opacity-80'
                  )}
                  style={{ left: `${sigPos.x * 100}%`, top: `${sigPos.y * 100}%`, width: '18%' }}
                  onMouseDown={startDrag}
                  onTouchStart={startTouchDrag}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sigDataUrl} alt="Signature" className="w-full" draggable={false} />
                  <div className="absolute -top-5 left-0 flex items-center gap-0.5 rounded bg-primary px-1 py-0.5 text-[10px] font-medium text-primary-fg">
                    <Move className="h-2.5 w-2.5" />
                    Drag
                  </div>
                </div>
              )}
            </div>

            {/* Page target selector — signing phase, multi-page only */}
            {!isPositioning && sigDataUrl && pageCount > 1 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-medium text-fg-muted">Apply signature to</p>
                <div className="flex gap-2">
                  {(['current', 'all', 'custom'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleApplyToPagesChange(opt)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm',
                        applyToPages === opt
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-fg-muted'
                      )}
                    >
                      {opt === 'current' ? 'This page' : opt === 'all' ? 'All pages' : 'Select pages'}
                    </button>
                  ))}
                </div>
                {applyToPages === 'custom' && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Array.from({ length: pageCount }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleCustomPage(i)}
                        className={cn(
                          'h-8 w-8 rounded-lg border text-xs font-medium',
                          customPages.has(i)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-fg-muted'
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action button */}
            {sigDataUrl && !isPositioning && (
              <button
                type="button"
                onClick={handleActionButton}
                disabled={phase === 'applying' || (applyToPages === 'custom' && customPages.size === 0)}
                className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-fg hover:bg-primary-hover disabled:opacity-60"
              >
                {phase === 'applying'
                  ? 'Applying…'
                  : getPagesToSign().length > 1
                  ? `Position on each page →`
                  : 'Apply Signature'}
              </button>
            )}

            {/* Positioning wizard next/apply button */}
            {isPositioning && sigDataUrl && (
              <button
                type="button"
                onClick={handlePositioningNext}
                className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-fg hover:bg-primary-hover"
              >
                {isLastPositioningStep
                  ? 'Apply Signature'
                  : `Next: Page ${positioningQueue[positioningIdx + 1] + 1} →`}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {phase === 'done' && resultUrl && (
        <div className="mt-8 rounded-xl border border-border bg-bg-elevated p-6">
          <p className="font-medium text-fg">Signature applied</p>
          <p className="mt-1 text-sm text-fg-muted">{resultName}</p>
          <div className="mt-4 flex gap-3">
            <a
              href={resultUrl}
              download={resultName}
              className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-fg hover:bg-primary-hover"
            >
              Download PDF
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm text-fg-muted hover:text-fg"
            >
              <RefreshCcw className="h-4 w-4" />
              Start over
            </button>
          </div>
        </div>
      )}

      <div className="mt-12">
        <FAQAccordion items={config.faq} />
      </div>
      <RelatedToolsStrip slugs={config.relatedTools} />
    </div>
  )
}
