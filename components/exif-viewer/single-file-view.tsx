'use client'
import { useEffect, useState } from 'react'
import type { AnalyzeSuccess } from '@/lib/converters/exif-viewer.types'
import { PrivacyPanel } from './privacy-panel'
import { TagSection } from './tag-section'
import { GpsMap } from './gps-map'
import { buildThumbnailDataUrl } from './thumbnail-fallback'

const DEFAULT_OPEN = new Set(['camera', 'exposure', 'gps'])

export function SingleFileView({ result, file }: { result: AnalyzeSuccess; file?: File }) {
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)
  const [fallbackStatus, setFallbackStatus] = useState<'idle' | 'loading' | 'failed'>('idle')

  useEffect(() => {
    if (result.thumbnailDataUrl) return
    if (!file) return
    const source = file
    let cancelled = false
    setFallbackStatus('loading')
    buildThumbnailDataUrl(source)
      .then(url => {
        if (cancelled) return
        if (url) { setFallbackUrl(url); setFallbackStatus('idle') }
        else setFallbackStatus('failed')
      })
      .catch(() => { if (!cancelled) setFallbackStatus('failed') })
    return () => { cancelled = true }
  }, [result, file])

  const src = result.thumbnailDataUrl ?? fallbackUrl

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <aside>
        {src ? (
          <img src={src} alt="" className="w-full rounded border border-gray-200" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded border border-dashed border-gray-300 text-xs text-gray-500">
            {fallbackStatus === 'loading' ? 'Loading preview…' : 'No preview available'}
          </div>
        )}
        <dl className="mt-3 space-y-1 text-xs">
          <div><dt className="text-gray-500">File</dt><dd className="font-mono break-all">{result.fileName}</dd></div>
          <div><dt className="text-gray-500">Type</dt><dd>{result.mimeType || 'unknown'}</dd></div>
          <div><dt className="text-gray-500">Size</dt><dd>{formatBytes(result.fileSize)}</dd></div>
          {result.width && result.height && (
            <div><dt className="text-gray-500">Dimensions</dt><dd>{result.width} × {result.height}</dd></div>
          )}
        </dl>
      </aside>
      <div className="min-w-0">
        <PrivacyPanel flags={result.privacyFlags} />

        {result.aiSignatures.length > 0 && (
          <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm">
            <strong>AI-generation metadata detected:</strong>{' '}
            {result.aiSignatures.map(s => s.generator).join(', ')}
            <div className="mt-1 text-xs text-blue-800">
              Metadata can be stripped — absence is not proof of human origin.
            </div>
          </div>
        )}

        {result.gps && <div className="mt-4"><GpsMap gps={result.gps} /></div>}

        <div className="mt-2">
          {result.groups.map(g => (
            <TagSection key={g.key} group={g} defaultOpen={DEFAULT_OPEN.has(g.key)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
