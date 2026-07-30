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
  ScanText,
  ArrowRight,
} from 'lucide-react'
import { ToolSearchCombobox } from '@/components/ui/tool-search-combobox'
import { cn } from '@/lib/utils/cn'
import { highlight } from '@/lib/utils/highlight'
import { ALL_TOOLS } from '@/content/tool-catalog'
import type { CatalogTool } from '@/content/tool-catalog'

const LIVE_TOOL_COUNT = ALL_TOOLS.filter(t => t.status === 'live').length

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

type Category = 'all' | 'images' | 'ocr' | 'image-editing' | 'pdf' | 'video-audio' | 'dev' | 'web-tools' | 'ai'

const FILTERS: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'images', label: 'Images' },
  { id: 'ocr', label: 'Image to Text' },
  { id: 'image-editing', label: 'Editing' },
  { id: 'pdf', label: 'PDF' },
  { id: 'video-audio', label: 'Video & Audio' },
  { id: 'dev', label: 'Developer' },
  { id: 'web-tools', label: 'Web Tools' },
  { id: 'ai', label: 'AI Tools' },
]

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  images: Image,
  ocr: ScanText,
  'image-editing': Wand2,
  pdf: FileText,
  'video-audio': Film,
  dev: Code2,
  'web-tools': Globe,
  ai: Sparkles,
}

const CATEGORY_LABELS: Record<string, string> = {
  images: 'Images',
  ocr: 'Image to Text',
  'image-editing': 'Editing',
  pdf: 'PDF',
  'video-audio': 'Video & Audio',
  dev: 'Developer',
  'web-tools': 'Web Tools',
  ai: 'AI',
}

const CATALOG_TO_GRID: Record<string, Category> = {
  images: 'images',
  'image-to-text': 'ocr',
  'image-editing': 'image-editing',
  pdf: 'pdf',
  'video-audio': 'video-audio',
  developer: 'dev',
  'web-tools': 'web-tools',
  'ai-tools': 'ai',
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
  { slug: 'screenshot-to-text',    name: 'Screenshot to Text',    category: 'ocr',         desc: 'Pull text out of screenshots. Batch up to 500.' },
  { slug: 'jpg-to-text',           name: 'JPG to Text',           category: 'ocr',         desc: 'Extract text from JPG images. No uploads.' },
  { slug: 'photo-to-text',         name: 'Photo to Text',         category: 'ocr',         desc: 'Deskew and OCR photos of documents.' },
  { slug: 'png-to-text',           name: 'PNG to Text',           category: 'ocr',         desc: 'Extract text from PNGs, including transparent backgrounds.' },
  { slug: 'scan-to-text',          name: 'Scan to Text',          category: 'ocr',         desc: 'Convert scanned documents into editable text.' },
  { slug: 'handwriting-to-text',   name: 'Handwriting to Text',   category: 'ocr',         desc: 'Transcribe handwritten notes with a dedicated model.' },
  { slug: 'image-to-excel',        name: 'Image to Excel',        category: 'ocr',         desc: 'Extract tables from images into .xlsx spreadsheets.' },
  { slug: 'receipt-to-text',       name: 'Receipt to Text',       category: 'ocr',         desc: 'Extract receipt data into CSV. Batch up to 500.' },
  { slug: 'business-card-to-text', name: 'Business Card to Text', category: 'ocr',         desc: 'Scan business cards and extract contacts as CSV.' },
  { slug: 'heic-to-text',          name: 'HEIC to Text',          category: 'ocr',         desc: 'Extract text from iPhone HEIC photos directly.' },
  { slug: 'jpeg-to-text',          name: 'JPEG to Text',          category: 'ocr',         desc: 'Extract text from JPEG files.' },
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
    : ALL_TOOLS.filter((t) => t.status === 'live' && CATALOG_TO_GRID[t.category] === active).slice(0, 12)

  return (
    <section
      id="tools"
      aria-labelledby="tools-heading"
      className="py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2
          id="tools-heading"
          className="mb-8 text-2xl font-bold tracking-tight text-fg sm:text-3xl"
        >
          {LIVE_TOOL_COUNT} tools. All local, all free.
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
        <div className="mb-6">
          <ToolSearchCombobox
            placeholder={`Search ${LIVE_TOOL_COUNT} tools…`}
            value={query}
            onChange={(val) => {
              setQuery(val)
              const url = new URL(window.location.href)
              if (val) {
                url.searchParams.set('q', val)
              } else {
                url.searchParams.delete('q')
              }
              history.replaceState(null, '', url.toString())
            }}
          />
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
              View all {LIVE_TOOL_COUNT} tools →
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
