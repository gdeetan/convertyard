'use client'
import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { AnalyzeSuccess, TagGroup } from '@/lib/converters/exif-viewer.types'
import { PrivacyPanel } from './privacy-panel'
import { TagSection } from './tag-section'
import { GpsMap } from './gps-map'
import { buildThumbnailDataUrl } from './thumbnail-fallback'

const DEFAULT_OPEN = new Set(['camera', 'exposure', 'gps'])

export function SingleFileView({ result, file }: { result: AnalyzeSuccess; file?: File }) {
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null)
  const [fallbackStatus, setFallbackStatus] = useState<'idle' | 'loading' | 'failed'>('idle')
  const [query, setQuery] = useState('')
  const [forceOpen, setForceOpen] = useState<boolean | null>(null)

  useEffect(() => {
    if (result.thumbnailDataUrl) return
    if (!file) return
    let cancelled = false
    setFallbackStatus('loading')
    buildThumbnailDataUrl(file)
      .then(url => {
        if (cancelled) return
        if (url) { setFallbackUrl(url); setFallbackStatus('idle') }
        else setFallbackStatus('failed')
      })
      .catch(() => { if (!cancelled) setFallbackStatus('failed') })
    return () => { cancelled = true }
  }, [result, file])

  const src = result.thumbnailDataUrl ?? fallbackUrl
  const totalTags = useMemo(() => result.groups.reduce((s, g) => s + g.rows.length, 0), [result.groups])

  const filteredGroups: TagGroup[] = useMemo(() => {
    if (!query.trim()) return result.groups
    const q = query.toLowerCase()
    return result.groups
      .map(g => ({
        ...g,
        rows: g.rows.filter(r => r.label.toLowerCase().includes(q) || r.value.toLowerCase().includes(q)),
      }))
      .filter(g => g.rows.length > 0)
  }, [query, result.groups])

  const searching = query.trim().length > 0
  const matchCount = filteredGroups.reduce((s, g) => s + g.rows.length, 0)

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <aside>
        {src ? (
          <img src={src} alt="" className="w-full rounded border border-border" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded border border-dashed border-border text-xs text-fg-subtle">
            {fallbackStatus === 'loading' ? 'Loading preview…' : 'No preview available'}
          </div>
        )}
        <dl className="mt-3 space-y-1 text-xs">
          <div><dt className="text-fg-subtle">File</dt><dd className="font-mono break-all text-fg">{result.fileName}</dd></div>
          <div><dt className="text-fg-subtle">Type</dt><dd className="text-fg">{result.mimeType || 'unknown'}</dd></div>
          <div><dt className="text-fg-subtle">Size</dt><dd className="text-fg">{formatBytes(result.fileSize)}</dd></div>
          {result.width && result.height && (
            <div><dt className="text-fg-subtle">Dimensions</dt><dd className="text-fg">{result.width} × {result.height}</dd></div>
          )}
          <div><dt className="text-fg-subtle">Tags</dt><dd className="text-fg">{totalTags}</dd></div>
        </dl>
      </aside>
      <div className="min-w-0">
        <PrivacyPanel flags={result.privacyFlags} />

        {result.aiSignatures.length > 0 && (
          <div className="mt-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/40">
            <strong>AI-generation metadata detected:</strong>{' '}
            {result.aiSignatures.map(s => s.generator).join(', ')}
            <div className="mt-1 text-xs text-blue-800 dark:text-blue-200">
              Metadata can be stripped — absence is not proof of human origin.
            </div>
          </div>
        )}

        {result.gps && <div className="mt-4"><GpsMap gps={result.gps} /></div>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tags (Make, GPS, ISO…)"
              className="w-full rounded border border-border bg-bg-elevated py-1.5 pl-7 pr-2 text-sm text-fg placeholder:text-fg-subtle focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setForceOpen(true)}
            className="rounded border border-border px-2.5 py-1.5 text-xs text-fg-muted hover:bg-bg-muted"
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={() => setForceOpen(false)}
            className="rounded border border-border px-2.5 py-1.5 text-xs text-fg-muted hover:bg-bg-muted"
          >
            Collapse all
          </button>
          {searching && (
            <span className="text-xs text-fg-subtle">
              {matchCount} match{matchCount === 1 ? '' : 'es'}
            </span>
          )}
        </div>

        <div className="mt-2">
          {filteredGroups.length === 0 && (
            <div className="rounded border border-dashed border-border p-4 text-sm text-fg-subtle">
              No tags match “{query}”.
            </div>
          )}
          {filteredGroups.map(g => (
            <TagSection
              key={g.key}
              group={g}
              defaultOpen={DEFAULT_OPEN.has(g.key) || searching}
              forceOpen={searching ? true : forceOpen}
            />
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
