'use client'

import Link from 'next/link'
import { verticals } from '@/content/vertical-registry'
import type { VerticalHubConfig } from '@/lib/types'

interface VerticalHubShellProps {
  config: VerticalHubConfig
}

export function VerticalHubShell({ config }: VerticalHubShellProps) {
  const relatedVerticalConfigs = verticals.filter(v =>
    config.relatedVerticals.includes(v.slug)
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-fg-subtle">/</li>
          <li>
            <Link href="/for/" className="hover:text-fg transition-colors">
              For exams &amp; forms
            </Link>
          </li>
          <li aria-hidden="true" className="text-fg-subtle">/</li>
          <li aria-current="page" className="text-fg font-medium">{config.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{config.h1}</h1>
        <p className="mt-3 text-lg text-fg-muted">{config.subhead}</p>
        <p className="mt-4 text-base text-fg-muted leading-relaxed">{config.intro}</p>
      </div>

      {/* Tool presets */}
      <section className="mb-10" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="text-xl font-semibold text-fg mb-4">
          Tools for {config.name}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {config.toolPresets.map((preset, i) => (
            <Link
              key={i}
              href={preset.toolHref ?? `/${preset.toolSlug}/`}
              className="rounded-lg border border-border p-4 hover:border-primary hover:bg-bg-muted transition-colors"
            >
              <div className="font-semibold text-fg">{preset.label}</div>
              {preset.notes && (
                <p className="mt-1 text-sm text-fg-muted">{preset.notes}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Official specs */}
      {config.officialSpecs.length > 0 && (
        <section className="mb-10" aria-labelledby="specs-heading">
          <h2 id="specs-heading" className="text-xl font-semibold text-fg mb-4">
            Official requirements
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-bg-muted">
                <tr>
                  {['Document', 'Size', 'Dimensions', 'Format'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-fg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {config.officialSpecs.map((spec, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-fg">{spec.documentType}</td>
                    <td className="px-4 py-3 text-fg-muted">{spec.size}</td>
                    <td className="px-4 py-3 text-fg-muted">{spec.dimensions}</td>
                    <td className="px-4 py-3 text-fg-muted">{spec.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Common mistakes */}
      {config.commonMistakes.length > 0 && (
        <section className="mb-10" aria-labelledby="mistakes-heading">
          <h2 id="mistakes-heading" className="text-xl font-semibold text-fg mb-4">
            Common mistakes to avoid
          </h2>
          <ul className="space-y-2">
            {config.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex gap-3 text-sm text-fg-muted">
                <span className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true">⚠</span>
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      <section className="mb-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-xl font-semibold text-fg mb-4">
          Frequently asked questions
        </h2>
        <dl className="space-y-4">
          {config.specificFaq.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <dt className="font-medium text-fg">{item.q}</dt>
              <dd className="mt-1.5 text-sm text-fg-muted leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related verticals */}
      {relatedVerticalConfigs.length > 0 && (
        <section aria-labelledby="related-verticals-heading">
          <h2 id="related-verticals-heading" className="text-xl font-semibold text-fg mb-4">
            Related upload kits
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {relatedVerticalConfigs.map(v => (
              <Link
                key={v.slug}
                href={`/for/${v.slug}/`}
                className="rounded-lg border border-border p-4 hover:border-primary hover:bg-bg-muted transition-colors"
              >
                <div className="font-semibold text-fg">{v.name}</div>
                <div className="mt-0.5 text-xs text-fg-muted line-clamp-2">{v.subhead}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
