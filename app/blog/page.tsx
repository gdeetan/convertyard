// app/blog/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { articles } from '@/content/article-registry'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides on file conversion, image formats, PDF tools, and web accessibility — all from ConvertYard.',
}

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-fg sm:text-4xl">Blog</h1>
        <p className="mt-3 text-fg-subtle">
          Guides on file conversion, image formats, PDF tools, and web
          accessibility.
        </p>
      </header>

      <ul className="space-y-4">
        {[...articles].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).map((article) => (
          <li key={article.slug}>
            <Link
              href={`/blog/${article.slug}/`}
              className="group flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-5 transition-all hover:border-primary hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-fg group-hover:text-primary transition-colors leading-snug">
                  {article.title}
                </h2>
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle transition-all group-hover:text-primary group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
              <p className="text-sm text-fg-subtle leading-relaxed">
                {article.description}
              </p>
              <time
                dateTime={article.lastUpdated}
                className="text-xs text-fg-subtle"
              >
                {new Date(article.lastUpdated).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
