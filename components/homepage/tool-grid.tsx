'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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

  const setFilter = (id: Category) => {
    if (id === 'all') {
      history.pushState(null, '', window.location.pathname + window.location.search)
    } else {
      history.pushState(null, '', `#${id}`)
    }
    setActive(id)
  }

  const visible = active === 'all'
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

        {/* Filter pills */}
        <div
          role="tablist"
          aria-label="Filter tools by category"
          className="mb-8 flex flex-wrap gap-2"
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
            const Icon = CATEGORY_ICONS[tool.category] ?? FileText
            const catLabel = CATEGORY_LABELS[tool.category] ?? tool.category
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
                    {tool.badge && (
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
                <h3 className="mb-1 text-sm font-semibold text-fg group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="flex-1 text-xs leading-relaxed text-fg-muted">{tool.desc}</p>

                {/* Arrow */}
                <div className="mt-4 flex justify-end">
                  <ArrowRight
                    className="h-4 w-4 text-fg-subtle transition-all group-hover:text-primary group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            )
          })}
        </div>

        {/* View all */}
        <div className="mt-8 text-center">
          <Link
            href="/tools"
            className="text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
          >
            View all 40+ tools →
          </Link>
        </div>
      </div>
    </section>
  )
}
