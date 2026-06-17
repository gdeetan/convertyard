'use client'

import { useEffect, useRef, useState } from 'react'
import type { ToolOptions } from '@/lib/types'

interface Props {
  files: File[]
  results: (File | null)[]
  options: ToolOptions
}

export function WatermarkPreview({ files, options }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)

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
        img.onload = () => {
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

            const [px, py] = resolveCanvasPos(position, img.width, img.height, tw, fontSize)
            ctx.translate(px, py)
            ctx.rotate(rotation)
            ctx.fillText(text, 0, 0)
          }

          ctx.restore()
          setLoading(false)
        }
        img.src = dataUrl
      } catch {
        setLoading(false)
      }
    }

    render()
    return () => { cancelled = true }
  }, [files, options])

  if (!files[0]) return null

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-3">
      <p className="mb-2 text-xs text-fg-subtle">Live preview — first page</p>
      {loading && <p className="text-xs text-fg-muted">Rendering preview…</p>}
      <canvas
        ref={canvasRef}
        className="w-full rounded border border-border"
        style={{ maxHeight: 400, objectFit: 'contain' }}
        aria-label="Watermark preview"
      />
    </div>
  )
}

function resolveCanvasPos(
  pos: string,
  w: number,
  h: number,
  itemW: number,
  itemH: number
): [number, number] {
  const col = pos.includes('left') ? 0 : pos.includes('right') ? 2 : 1
  const row = pos.includes('top') ? 0 : pos.includes('bottom') ? 2 : 1
  const x = col === 0 ? w * 0.1 : col === 2 ? w * 0.9 - itemW : w / 2
  const y = row === 0 ? h * 0.1 + itemH : row === 2 ? h * 0.9 : h / 2
  return [x, y]
}
