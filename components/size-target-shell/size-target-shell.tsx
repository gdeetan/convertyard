'use client'

import Link from 'next/link'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { sizeTargets } from '@/content/size-target-registry'
import { verticals } from '@/content/vertical-registry'
import type { SizeTargetConfig, ToolConfig, ToolOption } from '@/lib/types'

interface SizeTargetShellProps {
  config: SizeTargetConfig
  parentToolConfig: ToolConfig
  parentToolLabel: string
  parentToolHref: string  // e.g. "/compress-pdf/"
  parentCategory: string  // e.g. "PDF Tools"
  parentCategoryHref: string  // e.g. "/tools#pdf"
}

function buildPrefilledConfig(parentConfig: ToolConfig, config: SizeTargetConfig): ToolConfig {
  const targetKB = Math.round(config.targetBytes / 1024)
  if (config.parentTool === 'compress-pdf') {
    return {
      ...parentConfig,
      options: parentConfig.options?.map(opt => {
        if (opt.name === 'targetSizeMode') return { ...opt, default: true }
        if (opt.name === 'targetKB') return { ...opt, default: targetKB }
        return opt
      }) as ToolOption[],
    }
  }
  // compress-image: set maxSizeKb to the target
  return {
    ...parentConfig,
    options: parentConfig.options?.map(opt => {
      if (opt.name === 'maxSizeKb') return { ...opt, default: targetKB }
      return opt
    }) as ToolOption[],
  }
}

export function SizeTargetShell({
  config,
  parentToolConfig,
  parentToolLabel,
  parentToolHref,
  parentCategory,
  parentCategoryHref,
}: SizeTargetShellProps) {
  const toolConfig = buildPrefilledConfig(parentToolConfig, config)

  const relatedSizeConfigs = sizeTargets.filter(
    t => config.relatedSizes.includes(t.slug) && t.parentTool === config.parentTool
  )

  const relatedVerticalConfigs = verticals.filter(v =>
    config.relatedVerticals.includes(v.slug)
  )

  // Inherit 2 generic FAQ items from parent (skip the first 4 which are tool-specific)
  const inheritedFaq = parentToolConfig.faq.slice(4, 6)
  const allFaq = [...config.specificFaq, ...inheritedFaq]

  const normalizedParentHref = parentToolHref.replace(/\/$/, '')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-fg-subtle">/</li>
          <li><Link href="/tools" className="hover:text-fg transition-colors">Tools</Link></li>
          <li aria-hidden="true" className="text-fg-subtle">/</li>
          <li>
            <Link href={parentCategoryHref} className="hover:text-fg transition-colors">
              {parentCategory}
            </Link>
          </li>
          <li aria-hidden="true" className="text-fg-subtle">/</li>
          <li>
            <Link href={parentToolHref} className="hover:text-fg transition-colors">
              {parentToolLabel}
            </Link>
          </li>
          <li aria-hidden="true" className="text-fg-subtle">/</li>
          <li aria-current="page" className="text-fg font-medium">{config.targetLabel}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{config.h1}</h1>
        <p className="mt-3 text-lg text-fg-muted">{config.subhead}</p>
      </div>

      {/* Tool — pre-filled with target */}
      <div className="mb-12">
        <ToolShell config={toolConfig} />
      </div>

      {/* Intro */}
      <section className="mb-10">
        <p className="text-base text-fg-muted leading-relaxed">{config.intro}</p>
      </section>

      {/* Use cases */}
      <section className="mb-10" aria-labelledby="use-cases-heading">
        <h2 id="use-cases-heading" className="text-xl font-semibold text-fg mb-4">
          When you need {config.targetLabel}
        </h2>
        <ul className="space-y-3">
          {config.useCases.map((uc, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <div>
                <span className="font-medium text-fg">{uc.label}</span>
                {uc.description && (
                  <p className="mt-0.5 text-sm text-fg-muted">{uc.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mb-10" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-xl font-semibold text-fg mb-4">
          Frequently asked questions
        </h2>
        <dl className="space-y-4">
          {allFaq.map((item, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <dt className="font-medium text-fg">{item.q}</dt>
              <dd className="mt-1.5 text-sm text-fg-muted leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Other size targets */}
      {relatedSizeConfigs.length > 0 && (
        <section className="mb-10" aria-labelledby="related-sizes-heading">
          <h2 id="related-sizes-heading" className="text-xl font-semibold text-fg mb-4">
            Other size targets
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {relatedSizeConfigs.map(sz => (
              <Link
                key={sz.slug}
                href={`${normalizedParentHref}/${sz.slug}/`}
                className="rounded-lg border border-border p-4 hover:border-primary hover:bg-bg-muted transition-colors"
              >
                <div className="font-semibold text-fg">{sz.targetLabel}</div>
                <div className="mt-0.5 text-xs text-fg-muted line-clamp-2">{sz.subhead}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upload kits */}
      {config.relatedVerticals.length > 0 && (
        <section className="mb-10" aria-labelledby="verticals-heading">
          <h2 id="verticals-heading" className="text-xl font-semibold text-fg mb-4">
            Upload kits by exam or platform
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {config.relatedVerticals.map(slug => {
              const v = relatedVerticalConfigs.find(x => x.slug === slug)
              return (
                <div key={slug} className="rounded-lg border border-border p-4">
                  {v ? (
                    <Link
                      href={`/for/${slug}/`}
                      className="block hover:text-primary transition-colors"
                    >
                      <div className="font-semibold text-fg">{v.name}</div>
                      <div className="mt-0.5 text-xs text-fg-muted">{v.subhead}</div>
                    </Link>
                  ) : (
                    <>
                      <div className="font-semibold text-fg capitalize">
                        {slug.replace(/-/g, ' ').toUpperCase()}
                      </div>
                      <span className="mt-1 inline-block rounded-full bg-bg-muted px-2 py-0.5 text-xs text-fg-subtle">
                        Coming soon
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Related tools */}
      <section aria-labelledby="related-tools-heading">
        <h2 id="related-tools-heading" className="text-xl font-semibold text-fg mb-4">
          Related tools
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={parentToolHref}
            className="rounded-full border border-border px-4 py-1.5 text-sm text-fg-muted hover:text-fg hover:border-primary transition-colors"
          >
            {parentToolLabel}
          </Link>
          {parentToolConfig.relatedTools.slice(0, 2).map(slug => (
            <Link
              key={slug}
              href={`/${slug}/`}
              className="rounded-full border border-border px-4 py-1.5 text-sm text-fg-muted hover:text-fg hover:border-primary transition-colors"
            >
              {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
