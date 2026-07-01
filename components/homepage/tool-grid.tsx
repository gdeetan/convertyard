'use client'

import { useState, useEffect } from 'react'
import { useRecentTools } from '@/lib/hooks/use-recent-tools'
import Link from 'next/link'
import {
  Image,
  FileText,
  Film,
  Code2,
  Globe,
  Sparkles,
  Wand2,
  ArrowRight,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ALL_TOOLS } from '@/content/tool-catalog'
import type { CatalogTool } from '@/content/tool-catalog'

const POPULAR_SLUGS = new Set([
  'heic-to-jpg',
  'jpg-to-webp',
  'png-to-webp',
  'webp-to-jpg',
  'background-remover',
  'compress-image',
  'merge-pdf',
  'compress-pdf',
  'pdf-to-jpg',
  'mp4-to-mp3',
  'json-formatter',
  'image-resizer',
  'alt-text-generator',
  'heic-to-png',
  'word-to-pdf',
  'unlock-pdf',
  'protect-pdf',
  'watermark-pdf',
  'pdf-to-powerpoint',
])

type Category = 'all' | 'images' | 'image-editing' | 'pdf' | 'video-audio' | 'dev' | 'web-tools' | 'ai'

const FILTERS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'images', label: 'Images' },
  { id: 'image-editing', label: 'Editing' },
  { id: 'pdf', label: 'PDF' },
  { id: 'video-audio', label: 'Video & Audio' },
  { id: 'dev', label: 'Developer' },
  { id: 'web-tools', label: 'Web Tools' },
  { id: 'ai', label: 'AI Tools' },
]

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  images: Image,
  'image-editing': Wand2,
  pdf: FileText,
  'video-audio': Film,
  dev: Code2,
  'web-tools': Globe,
  ai: Sparkles,
}

const CATEGORY_LABELS: Record<string, string> = {
  images: 'Images',
  'image-editing': 'Editing',
  pdf: 'PDF',
  'video-audio': 'Video & Audio',
  dev: 'Developer',
  'web-tools': 'Web Tools',
  ai: 'AI',
}

const CATALOG_TO_GRID: Record<string, Category> = {
  images: 'images',
  'image-editing': 'image-editing',
  pdf: 'pdf',
  'video-audio': 'video-audio',
  developer: 'dev',
  'web-tools': 'web-tools',
  'ai-tools': 'ai',
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-amber-100 px-px dark:bg-amber-900/40">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

interface Tool {
  slug: string
  name: string
  category: Category
  desc: string
  badge?: string
}

const TOOLS: Tool[] = [
  { slug: 'heic-to-jpg',           name: 'HEIC to JPG',           category: 'images',      desc: 'Convert iPhone photos to universal JPEG.' },
  { slug: 'jpg-to-webp',           name: 'JPG to WebP',           category: 'images',      desc: 'Compress JPGs to WebP without quality loss.' },
  { slug: 'png-to-webp',           name: 'PNG to WebP',           category: 'images',      desc: 'Convert PNGs to smaller WebP files.' },
  { slug: 'webp-to-jpg',           name: 'WebP to JPG',           category: 'images',      desc: 'Convert WebP back to universal JPEG.' },
  { slug: 'webp-to-png',           name: 'WebP to PNG',           category: 'images',      desc: 'Lossless quality. Transparency preserved.' },
  { slug: 'heic-to-png',           name: 'HEIC to PNG',           category: 'images',      desc: 'iPhone photos to lossless PNG.' },
  { slug: 'jpg-to-avif',  name: 'JPG to AVIF',  category: 'images',        desc: 'Next-gen compression, up to 50% smaller than WebP.' },
  { slug: 'avif-to-jpg',  name: 'AVIF to JPG',  category: 'images',        desc: 'Convert AVIF back to universal JPEG.' },
  { slug: 'png-to-avif',  name: 'PNG to AVIF',  category: 'images',        desc: 'Best-in-class compression for PNG files.' },
  { slug: 'avif-to-png',  name: 'AVIF to PNG',  category: 'images',        desc: 'AVIF decoded to lossless PNG with transparency.' },
  { slug: 'background-remover',    name: 'Background remover',    category: 'image-editing', desc: 'Remove backgrounds locally. No uploads.',     badge: 'AI' },
  { slug: 'compress-image',         name: 'Image compressor',      category: 'image-editing', desc: 'Compress hundreds of images at once.' },
  { slug: 'image-resizer',         name: 'Batch image resizer',   category: 'image-editing', desc: 'Resize hundreds of images in one go.' },
  { slug: 'merge-pdf',             name: 'Merge PDF',             category: 'pdf',         desc: 'Combine multiple PDFs into one file.' },
  { slug: 'compress-pdf',          name: 'Compress PDF',          category: 'pdf',         desc: 'Reduce PDF size without losing quality.' },
  { slug: 'pdf-to-jpg',            name: 'PDF to JPG',            category: 'pdf',         desc: 'Export every page as a separate JPG.' },
  { slug: 'mp4-to-mp3',            name: 'MP4 to MP3',            category: 'video-audio', desc: 'Extract audio from video files.' },
  { slug: 'mp3-to-mp4',            name: 'MP3 to MP4',            category: 'video-audio', desc: 'Add a static image or waveform to any audio file.' },
  { slug: 'json-formatter',        name: 'JSON formatter',        category: 'dev',         desc: 'Format, validate, and minify JSON.' },
  { slug: 'base64',                name: 'Base64 encoder/decoder',category: 'dev',         desc: 'Encode and decode Base64 strings and files.' },
  { slug: 'json-to-csv',           name: 'JSON to CSV',           category: 'dev',         desc: 'Flatten JSON arrays into CSV spreadsheets.' },
  { slug: 'alt-text-generator',    name: 'Alt text generator',    category: 'ai',          desc: 'Generate accessible alt text from images.',   badge: 'AI' },
]

export function ToolGrid() {
  const [active, setActive] = useState<Category>('all')
  const [query, setQuery] = useState('')

  // Sync with URL hash
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1) as Category
      setActive(FILTERS.some((f) => f.id === hash) ? hash : 'all')
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') ?? ''
    if (q) setQuery(q)
  }, [])

  const setFilter = (id: Category) => {
    if (id === 'all') {
      history.pushState(null, '', window.location.pathname + window.location.search)
    } else {
      history.pushState(null, '', `#${id}`)
    }
    setActive(id)
  }

  const { tools: recentTools } = useRecentTools()

  const trimmed = query.trim().toLowerCase()
  const isSearching = trimmed.length > 0

  const searchResults = isSearching
    ? ALL_TOOLS.filter(
        (t) =>
          t.status === 'live' &&
          (t.title.toLowerCase().includes(trimmed) ||
            t.description.toLowerCase().includes(trimmed))
      )
    : null

  const visible: any[] = searchResults !== null
    ? searchResults
    : active === 'all'
    ? TOOLS.filter((t) => POPULAR_SLUGS.has(t.slug))
    : TOOLS.filter((t) => t.category === active)

  return (
    <section
      id="tools"
      aria-labelledby="tools-heading"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="tools-heading"
          className="mb-8 text-2xl font-bold tracking-tight text-fg sm:text-3xl"
        >
          40+ tools. All local, all free.
        </h2>

        {/* Recently used */}
        {recentTools.length > 0 && !isSearching && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-fg-subtle">Recently used:</span>
            {recentTools.map((t) => (
              <a
                key={t.slug}
                href={`/${t.slug}`}
                className="rounded-full border border-border bg-bg-elevated px-3 py-1 text-xs font-medium text-fg hover:border-primary hover:text-primary transition-colors"
              >
                {t.title}
              </a>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              const val = e.target.value
              setQuery(val)
              const url = new URL(window.location.href)
              if (val) {
                url.searchParams.set('q', val)
              } else {
                url.searchParams.delete('q')
              }
              history.replaceState(null, '', url.toString())
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setQuery('')
                const url = new URL(window.location.href)
                url.searchParams.delete('q')
                history.replaceState(null, '', url.toString())
                ;(e.target as HTMLInputElement).focus()
              }
            }}
            placeholder="Search 60+ tools…"
            aria-label="Search tools"
            className={cn(
              'w-full rounded-xl border bg-bg-muted py-3 pl-10 pr-10',
              'text-sm text-fg placeholder:text-fg-subtle',
              'transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary',
              query
                ? 'border-primary bg-bg'
                : 'border-border focus-visible:border-primary'
            )}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('')
                const url = new URL(window.location.href)
                url.searchParams.delete('q')
                history.replaceState(null, '', url.toString())
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-fg-subtle hover:text-fg focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div
          role="tablist"
          aria-label="Filter tools by category"
          className={cn('mb-8 flex flex-wrap gap-2 transition-opacity', isSearching && 'pointer-events-none opacity-40')}
        >
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={active === id}
              aria-controls="tool-grid-results"
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                'min-h-[44px]',
                active === id
                  ? 'bg-primary text-primary-fg'
                  : 'border border-border text-fg-muted hover:border-border-strong hover:text-fg'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div
          id="tool-grid-results"
          role="tabpanel"
          aria-label={`${active === 'all' ? 'All' : CATEGORY_LABELS[active] ?? active} tools`}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ gridAutoRows: '1fr' }}
        >
          {visible.map((tool) => {
            // CatalogTool has `title`+`description`; local Tool has `name`+`desc`
            const isCatalog = 'title' in tool
            const displayName = isCatalog
              ? (tool as CatalogTool).title
              : (tool as Tool).name
            const displayDesc = isCatalog
              ? (tool as CatalogTool).description
              : (tool as Tool).desc
            const gridCategory = isCatalog
              ? (CATALOG_TO_GRID[(tool as CatalogTool).category] ?? 'images')
              : (tool as Tool).category
            const Icon = CATEGORY_ICONS[gridCategory] ?? FileText
            const catLabel = CATEGORY_LABELS[gridCategory] ?? gridCategory
            return (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className={cn(
                  'group flex flex-col rounded-2xl border border-border bg-bg-elevated p-5',
                  'transition-all duration-150',
                  'hover:-translate-y-0.5 hover:border-primary hover:shadow-md',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                )}
              >
                {/* Top row: icon + category badge */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-muted">
                    <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex gap-1.5">
                    {'badge' in tool && tool.badge && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {tool.badge}
                      </span>
                    )}
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-fg-subtle">
                      {catLabel}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="mb-1 text-sm font-semibold text-fg transition-colors group-hover:text-primary">
                  {isSearching ? highlight(displayName, trimmed) : displayName}
                </h3>
                <p className="flex-1 text-xs leading-relaxed text-fg-muted">
                  {isSearching ? highlight(displayDesc, trimmed) : displayDesc}
                </p>

                {/* Arrow */}
                <div className="mt-4 flex justify-end">
                  <ArrowRight
                    className="h-4 w-4 text-fg-subtle transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer: result count when searching, view-all link otherwise */}
        <div className="mt-8 text-center text-sm">
          {isSearching ? (
            searchResults!.length === 0 ? (
              <p className="text-fg-muted">
                No tools match <strong className="text-fg">&ldquo;{query.trim()}&rdquo;</strong> — try a shorter search.
              </p>
            ) : (
              <p className="text-fg-subtle">
                {searchResults!.length} tool{searchResults!.length !== 1 ? 's' : ''}{' '}
                {searchResults!.length === 1 ? 'matches' : 'match'}{' '}
                <strong className="text-fg">&ldquo;{query.trim()}&rdquo;</strong>
              </p>
            )
          ) : (
            <Link
              href="/tools"
              className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
            >
              View all 60+ tools →
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
