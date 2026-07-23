'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Lock, RefreshCcw, Pen, Type, Trash2 } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { PDFDocument } from 'pdf-lib'
import { config } from '@/content/tools/digital-sign-pdf'

type Mode = 'draw' | 'type'
type Phase = 'idle' | 'signing' | 'applying' | 'done' | 'error'

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
  const [sigPos, setSigPos] = useState<SignaturePos>({ x: 0.1, y: 0.7 })
  const [dragging, setDragging] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [error, setError] = useState('')

  const drawCanvas = useRef<HTMLCanvasElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null)

  // Render page 0 preview when file is set
  useEffect(() => {
    if (!file) return
    let cancelled = false
    ;(async () => {
      const { renderPagePng } = await import('@/lib/converters/mupdf-client')
      const buf = await file.arrayBuffer()
      const pngBuf = await renderPagePng(buf, 0, 96)
      if (cancelled) return
      const url = URL.createObjectURL(new Blob([new Uint8Array(pngBuf)], { type: 'image/png' }))
      setPagePreviewUrl(url)
      setPhase('signing')
    })()
    return () => { cancelled = true }
  }, [file])

  // Drawing canvas handlers
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvas.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
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
      canvas.height = 120
      const ctx = canvas.getContext('2d')!
      ctx.font = 'italic 56px Georgia, serif'
      ctx.fillStyle = '#1a1a1a'
      ctx.fillText(typedName.trim(), 16, 80)
      setSigDataUrl(canvas.toDataURL('image/png'))
    }
  }, [mode, typedName])

  // Signature drag on preview
  const startDrag = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!previewRef.current) return
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, px: sigPos.x, py: sigPos.y }
    e.preventDefault()
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !dragStart.current || !previewRef.current) return
      const rect = previewRef.current.getBoundingClientRect()
      const dx = (e.clientX - dragStart.current.mx) / rect.width
      const dy = (e.clientY - dragStart.current.my) / rect.height
      setSigPos({
        x: Math.max(0, Math.min(0.85, dragStart.current.px + dx)),
        y: Math.max(0, Math.min(0.9, dragStart.current.py + dy)),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  const applySignature = useCallback(async () => {
    if (!file || !sigDataUrl || !pagePreviewUrl) return
    setPhase('applying')
    try {
      const previewEl = previewRef.current!
      const previewW = previewEl.offsetWidth
      const sigDisplayW = previewW * 0.15

      const buffer = await file.arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const page = doc.getPages()[0]
      const { width: pageW, height: pageH } = page.getSize()

      const pdfX = sigPos.x * pageW
      const pdfY = pageH - sigPos.y * pageH

      const sigPdfW = (sigDisplayW / previewW) * pageW
      const sigPdfH = sigPdfW * (120 / 400)

      const sigBlob = await fetch(sigDataUrl).then(r => r.blob())
      const sigBytes = new Uint8Array(await sigBlob.arrayBuffer())
      const embedded = await doc.embedPng(sigBytes)

      page.drawImage(embedded, { x: pdfX, y: pdfY - sigPdfH, width: sigPdfW, height: sigPdfH })

      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      const baseName = file.name.replace(/\.pdf$/i, '')
      const outName = `${baseName}-signed.pdf`
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
      if (resultUrl) URL.revokeObjectURL(resultUrl)
      setResultUrl(URL.createObjectURL(blob))
      setResultName(outName)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply signature')
      setPhase('error')
    }
  }, [file, sigDataUrl, pagePreviewUrl, sigPos, resultUrl])

  const handleReset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    if (pagePreviewUrl) URL.revokeObjectURL(pagePreviewUrl)
    setFile(null)
    setPhase('idle')
    setSigDataUrl(null)
    setPagePreviewUrl(null)
    setResultUrl(null)
    setResultName('')
    setError('')
    setTypedName('')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Breadcrumb items={[{ label: 'PDF Tools', href: '/pdf' }, { label: config.title }]} />

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
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <span className="text-lg font-semibold text-fg">Drop a PDF here</span>
          <span className="mt-1 text-sm text-fg-subtle">or click to select</span>
        </label>
      )}

      {(phase === 'signing' || phase === 'applying') && pagePreviewUrl && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Signature pad */}
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
                  height={160}
                  className="w-full rounded-xl border border-border bg-white cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
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
                className="w-full rounded-xl border border-border bg-white px-4 py-6 text-3xl italic text-fg-muted placeholder:text-fg-subtle focus:border-primary focus:outline-none"
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

          {/* PDF preview with draggable signature */}
          <div>
            <p className="mb-2 text-sm text-fg-muted">Drag signature to position</p>
            <div ref={previewRef} className="relative select-none overflow-hidden rounded-xl border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pagePreviewUrl} alt="PDF page 1 preview" className="w-full" draggable={false} />
              {sigDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sigDataUrl}
                  alt="Signature"
                  className="absolute cursor-move"
                  style={{ left: `${sigPos.x * 100}%`, top: `${sigPos.y * 100}%`, width: '15%' }}
                  onMouseDown={startDrag}
                  draggable={false}
                />
              )}
            </div>

            {sigDataUrl && (
              <button
                type="button"
                onClick={applySignature}
                disabled={phase === 'applying'}
                className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-fg hover:bg-primary-hover disabled:opacity-60"
              >
                {phase === 'applying' ? 'Applying…' : 'Apply Signature'}
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
