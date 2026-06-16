'use client'

import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { sizeTargets } from '@/content/size-target-registry'
import { verticals } from '@/content/vertical-registry'
import { config as compressPdfConfig } from '@/content/tools/compress-pdf'
import { config as compressImageConfig } from '@/content/tools/compress-image'
import type { SizeTargetConfig, ToolConfig, ToolOption } from '@/lib/types'

const INHERITED_FAQ_INDICES: Record<string, number[]> = {
  'compress-pdf':   [4, 5], // "Are files uploaded?" + "Can I batch?"
  'compress-image': [6],    // "Are my images uploaded to your servers?"
}

interface SizeTargetShellProps {
  config: SizeTargetConfig
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
        if (opt.type === 'section-header') return opt
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
      if (opt.type === 'section-header') return opt
      if (opt.name === 'maxSizeKb') return { ...opt, default: targetKB }
      return opt
    }) as ToolOption[],
  }
}

export function SizeTargetShell({
  config,
  parentToolLabel,
  parentToolHref,
  parentCategory,
  parentCategoryHref,
}: SizeTargetShellProps) {
  const parentToolConfig = config.parentTool === 'compress-pdf' ? compressPdfConfig : compressImageConfig
  const toolConfig = buildPrefilledConfig(parentToolConfig, config)

  const relatedSizeConfigs = sizeTargets.filter(
    t => config.relatedSizes.includes(t.slug) && t.parentTool === config.parentTool
  )

  const relatedVerticalConfigs = verticals.filter(v =>
    config.relatedVerticals.includes(v.slug)
  )

  const inheritedFaq = (INHERITED_FAQ_INDICES[config.parentTool] ?? [])
    .map(i => parentToolConfig.faq[i])
    .filter(Boolean)
  const allFaq = [...config.specificFaq, ...inheritedFaq]

  const normalizedParentHref = parentToolHref.replace(/\/$/, '')

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Breadcrumbs */}
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Tools', href: '/tools' },
        { label: parentCategory, href: parentCategoryHref },
        { label: parentToolLabel, href: parentToolHref },
        { label: config.targetLabel },
      ]} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{config.h1}</h1>
        <p className="mt-2 text-base text-fg-muted">{config.subhead}</p>
      </div>

      {/* Tool — pre-filled with target */}
      <div className="mb-12">
        <ToolShell config={toolConfig} embedded />
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
      <section className="mb-10">
        <FAQAccordion items={allFaq} />
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
      <RelatedToolsStrip
        slugs={[config.parentTool, ...parentToolConfig.relatedTools.slice(0, 2)]}
      />
    </div>
  )
}
