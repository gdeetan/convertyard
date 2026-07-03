// components/article-shell/article-shell.tsx
import Link from 'next/link'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { ShareButtons } from './share-buttons'
import {
  articleSchema,
  faqPageSchema,
  breadcrumbSchema,
  BASE_URL,
} from '@/lib/seo/schema'
import { articleIllustrations } from '@/components/article-illustrations'

interface FAQItem {
  q: string
  a: string
}

interface ArticleShellProps {
  slug: string
  title: string
  description: string
  lastUpdated: string
  faq: FAQItem[]
  relatedTools: string[]
  children: React.ReactNode
}

export function ArticleShell({
  slug,
  title,
  description,
  lastUpdated,
  faq,
  relatedTools,
  children,
}: ArticleShellProps) {
  const Illustration = articleIllustrations[slug]
  const url = `${BASE_URL}/blog/${slug}/`

  const articleJson = articleSchema({
    title,
    description,
    url,
    datePublished: lastUpdated,
    dateModified: lastUpdated,
  })

  const faqJson = faqPageSchema(faq)

  const crumbJson = breadcrumbSchema([
    { name: 'Home', url: BASE_URL },
    { name: 'Blog', url: `${BASE_URL}/blog/` },
    { name: title, url },
  ])

  const formattedDate = new Date(lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbJson) }}
      />

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-sm text-fg-subtle">
            <li>
              <Link href="/" className="hover:text-fg transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li>
              <Link href="/blog/" className="hover:text-fg transition-colors">
                Blog
              </Link>
            </li>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li
              className="truncate max-w-[180px] text-fg"
              aria-current="page"
            >
              {title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl font-bold leading-tight text-fg sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-fg-subtle">
            By <span className="text-fg">ConvertYard Team</span>
            {' · '}Updated{' '}
            <time dateTime={lastUpdated}>{formattedDate}</time>
          </p>
        </header>

        {/* Hero illustration */}
        {Illustration && (
          <div className="mb-10">
            <Illustration />
          </div>
        )}

        {/* MDX prose */}
        <article>{children}</article>

        {/* Social share */}
        <div className="mt-12 border-t border-border pt-8">
          <ShareButtons title={title} />
        </div>

        {/* FAQ */}
        {faq.length > 0 && (
          <section className="mt-12" aria-labelledby="faq-heading">
            <h2
              id="faq-heading"
              className="mb-6 text-2xl font-bold text-fg"
            >
              Frequently asked questions
            </h2>
            <dl className="space-y-4">
              {faq.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl border border-border bg-bg-elevated p-5"
                >
                  <dt className="font-semibold text-fg">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-fg-subtle">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Related tools */}
        {relatedTools.length > 0 && (
          <div className="mt-12">
            <RelatedToolsStrip slugs={relatedTools} />
          </div>
        )}
      </main>
    </>
  )
}
