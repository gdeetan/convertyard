'use client'

import { useEffect, useRef, useState } from 'react'
import type { ToolOptions } from '@/lib/types'

interface Props {
  files: File[]
  results: (File | null)[]
  options: ToolOptions
}

const ZOOM_MIN = 100
const ZOOM_MAX = 400
const ZOOM_STEP = 50

export function WatermarkPreview({ files, options }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(100) // % of container width

  useEffect(() => {
    const file = files[0]
    if (!file) return

    let cancelled = false
    setLoading(true)

    async function render() {
      try {
        const { renderPage } = await import('@/lib/converters/mupdf-client')
        const buffer = await file.arrayBuffer()
        const jpegBuffer = await renderPage(buffer, 0, 96, 85)
        if (cancelled) return

        const blob = new Blob([jpegBuffer], { type: 'image/jpeg' })
        const dataUrl = URL.createObjectURL(blob)

        const img = new Image()
        img.onload = async () => {
          URL.revokeObjectURL(dataUrl)
          if (cancelled) return
          const canvas = canvasRef.current
          if (!canvas) return
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) return
          ctx.drawImage(img, 0, 0)

          const wmType = (options.watermarkType as string) ?? 'text'
          const opacityPct = (options.opacity as number) ?? 30
          const opacity = Math.min(1, Math.max(0, opacityPct / 100))
          const rotationDeg = (options.rotation as number) ?? 45
          const rotation = rotationDeg * (Math.PI / 180)
          const position = (options.position as string) ?? 'center'

          ctx.save()
          ctx.globalAlpha = opacity

          if (wmType === 'text') {
            const text = (options.watermarkText as string) ?? 'CONFIDENTIAL'
            const sizeKey = (options.fontSize as string) ?? 'medium'
            const fontSize = sizeKey === 'small' ? 24 : sizeKey === 'large' ? 72 : 48
            const color = (options.textColor as string) ?? '#cc0000'

            ctx.font = `bold ${fontSize}px Helvetica, Arial, sans-serif`
            ctx.fillStyle = color
            const tw = ctx.measureText(text).width

            const [cx, cy] = resolveCanvasPos(position, img.width, img.height, tw, fontSize)
            ctx.translate(cx, cy)
            ctx.rotate(rotation)
            ctx.fillText(text, -tw / 2, 0)
          } else if (wmType === 'image') {
            const wmFile = options.watermarkImage as File | null
            if (wmFile) {
              const imgSizePct = Math.min(100, Math.max(5, (options.imageSizePct as number) ?? 30)) / 100
              const wmW = img.width * imgSizePct
              await new Promise<void>((resolve) => {
                const url = URL.createObjectURL(wmFile)
                const wm = new Image()
                wm.onload = () => {
                  URL.revokeObjectURL(url)
                  if (cancelled) { resolve(); return }
                  const wmH = (wm.height / wm.width) * wmW
                  const [cx, cy] = resolveCanvasPos(position, img.width, img.height, wmW, wmH)
                  ctx.translate(cx, cy)
                  ctx.rotate(rotation)
                  ctx.drawImage(wm, -wmW / 2, -wmH / 2, wmW, wmH)
                  resolve()
                }
                wm.onerror = () => { URL.revokeObjectURL(url); resolve() }
                wm.src = url
              })
            }
          }

          ctx.restore()
          if (!cancelled) setLoading(false)
        }
        img.src = dataUrl
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    render()
    return () => { cancelled = true }
  }, [files, options])

  if (!files[0]) return null

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3">
      <div className="mb-2 flex items-center gap-2">
        <p className="flex-1 text-xs text-fg-subtle">Live preview — first page</p>
        {loading && <span className="text-xs text-fg-muted">Rendering…</span>}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-bg text-sm text-fg-muted transition-colors hover:bg-bg-elevated hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-fg-muted">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-bg text-sm text-fg-muted transition-colors hover:bg-bg-elevated hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      </div>
      <div
        className="overflow-auto rounded border border-border"
        style={{ maxHeight: zoom === 100 ? 640 : undefined }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: `${zoom}%`, height: 'auto' }}
          aria-label="Watermark preview"
        />
      </div>
    </div>
  )
}

// Returns the visual CENTER point of the watermark's target position.
// The caller translates to this point, rotates, then draws centered around origin.
function resolveCanvasPos(
  pos: string,
  w: number,
  h: number,
  itemW: number,
  itemH: number
): [number, number] {
  const col = pos.includes('left') ? 0 : pos.includes('right') ? 2 : 1
  // Canvas: Y=0 at top, so 'top' → small y, 'bottom' → large y
  const row = pos.includes('top') ? 0 : pos.includes('bottom') ? 2 : 1
  const cx = col === 0 ? w * 0.1 + itemW / 2 : col === 2 ? w * 0.9 - itemW / 2 : w / 2
  const cy = row === 0 ? h * 0.1 + itemH / 2 : row === 2 ? h * 0.9 - itemH / 2 : h / 2
  return [cx, cy]
}
