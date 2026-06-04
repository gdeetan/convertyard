import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface RelatedToolsStripProps {
  slugs: string[]
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => {
      // Keep short uppercase acronyms as-is: jpg, pdf, mp3, heic, etc.
      if (w.length <= 4 && /^[a-z0-9]+$/.test(w)) return w.toUpperCase()
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

export function RelatedToolsStrip({ slugs }: RelatedToolsStripProps) {
  if (slugs.length === 0) return null

  return (
    <section aria-labelledby="related-tools-heading">
      <h2
        id="related-tools-heading"
        className="mb-4 text-xl font-semibold text-fg"
      >
        Related tools
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slugs.map((slug) => (
          <Link
            key={slug}
            href={`/${slug}`}
            className="group flex items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-3.5 transition-all hover:border-primary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="text-sm font-medium text-fg group-hover:text-primary transition-colors">
              {slugToTitle(slug)}
            </span>
            <ArrowRight
              className="h-4 w-4 shrink-0 text-fg-subtle transition-all group-hover:text-primary group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
