import Link from 'next/link'
import { ALL_TOOLS } from '@/content/tool-catalog'
import { CATEGORY_META } from '@/content/category-meta'
import { ToolsSearch } from '@/components/tools-page/tools-search'

const CATEGORIES = [
  { slug: 'images',        label: 'Images',         href: '/images' },
  { slug: 'image-to-text', label: 'Image to Text',  href: '/image-to-text-converter' },
  { slug: 'image-editing', label: 'Image Editing',  href: '/image-editing' },
  { slug: 'pdf',           label: 'PDF',             href: '/pdf' },
  { slug: 'video-audio',   label: 'Video & Audio',   href: '/video-audio' },
  { slug: 'developer',     label: 'Developer',       href: '/developer' },
  { slug: 'web-tools',     label: 'Web Tools',       href: '/web-tools' },
  { slug: 'ai-tools',      label: 'AI Tools',        href: '/ai-tools' },
] as const

type CategorySlug = typeof CATEGORIES[number]['slug']

export default function ToolsPage() {
  const liveTotal = ALL_TOOLS.filter((t) => t.status === 'live').length
  const comingTotal = ALL_TOOLS.filter((t) => t.status === 'coming-soon').length

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          All Tools
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          {liveTotal} live · {comingTotal} coming soon
        </p>
      </header>

      <ToolsSearch />

      <div className="space-y-12">
        {CATEGORIES.map((cat) => {
          const meta = CATEGORY_META[cat.slug as CategorySlug]
          const tools = ALL_TOOLS.filter((t) => t.category === cat.slug)
          const liveCount = tools.filter((t) => t.status === 'live').length

          return (
            <section key={cat.slug} id={cat.slug} aria-labelledby={`${cat.slug}-heading`}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2
                  id={`${cat.slug}-heading`}
                  className="text-lg font-semibold text-fg"
                >
                  {cat.label}
                </h2>
                <Link
                  href={cat.href}
                  className="text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-sm"
                >
                  See all {tools.length} →
                </Link>
              </div>
              {meta && (
                <p className="mb-4 text-xs text-fg-muted">{meta.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                {tools.slice(0, 8).map((tool) => {
                  const isLive = tool.status === 'live'
                  const card = (
                    <div
                      className={
                        isLive
                          ? 'rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm transition-all hover:border-primary hover:shadow-sm cursor-pointer'
                          : 'rounded-lg border border-border bg-bg-elevated px-3 py-2.5 text-sm opacity-50 cursor-default'
                      }
                    >
                      <span className="font-medium text-fg">{tool.title}</span>
                      {!isLive && (
                        <span className="ml-1.5 text-[10px] text-fg-subtle">Soon</span>
                      )}
                    </div>
                  )
                  return isLive ? (
                    <Link key={tool.slug} href={`/${tool.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-lg">
                      {card}
                    </Link>
                  ) : (
                    <div key={tool.slug}>{card}</div>
                  )
                })}
              </div>
              {liveCount === 0 && (
                <p className="mt-2 text-xs text-fg-subtle italic">
                  Tools in this category are in development.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}
