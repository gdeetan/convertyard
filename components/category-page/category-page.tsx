import Link from 'next/link'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { CategoryToolCard } from './category-tool-card'
import { ToolSearchCombobox } from '@/components/ui/tool-search-combobox'
import type { CategoryMeta } from '@/content/category-meta'
import type { CatalogTool } from '@/content/tool-catalog'

interface Props {
  meta: CategoryMeta
  tools: CatalogTool[]
}

export function CategoryPage({ meta, tools }: Props) {
  const liveCount = tools.filter((t) => t.status === 'live').length
  const totalCount = tools.length

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-8 text-xs text-fg-muted" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 flex-wrap">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/tools" className="hover:text-primary transition-colors">Tools</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-fg" aria-current="page">{meta.title}</li>
        </ol>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {meta.title}
        </h1>
        <p className="mt-2 text-base font-medium text-primary">
          {meta.subtitle}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-fg-muted leading-relaxed">
          {meta.description}
        </p>
        <p className="mt-3 text-xs text-fg-subtle">
          {liveCount} tool{liveCount !== 1 ? 's' : ''} live
          {totalCount > liveCount ? ` · ${totalCount - liveCount} coming soon` : ''}
        </p>
      </header>

      {/* Search */}
      <div className="mb-6">
        <ToolSearchCombobox placeholder="Search all tools…" />
      </div>

      {/* Tool grid */}
      <section aria-label="Tools in this category">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {tools.map((tool) => (
            <CategoryToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      {meta.faq.length > 0 && (
        <div className="mt-16">
          <FAQAccordion items={meta.faq} />
        </div>
      )}
    </main>
  )
}
