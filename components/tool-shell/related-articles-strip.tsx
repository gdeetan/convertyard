import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'

interface RelatedArticlesStripProps {
  slugs: string[]
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => {
      if (w === 'vs') return 'vs'
      if (w.length <= 4 && /^[a-z0-9]+$/.test(w)) return w.toUpperCase()
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(' ')
}

export function RelatedArticlesStrip({ slugs }: RelatedArticlesStripProps) {
  if (slugs.length === 0) return null

  return (
    <section aria-labelledby="related-articles-heading">
      <h2
        id="related-articles-heading"
        className="mb-4 text-xl font-semibold text-fg"
      >
        Learn more
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slugs.map((slug) => (
          <Link
            key={slug}
            href={`/blog/${slug}/`}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-4 transition-all hover:border-primary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <div className="flex items-center gap-2 text-fg-subtle">
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wide">Article</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium text-fg group-hover:text-primary transition-colors leading-snug">
                {slugToTitle(slug)}
              </span>
              <ArrowRight
                className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle transition-all group-hover:text-primary group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
