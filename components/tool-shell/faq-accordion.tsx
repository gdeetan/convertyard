'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { FAQItem } from '@/lib/types'

interface FAQAccordionProps {
  items: FAQItem[]
  pageUrl?: string
}

export function FAQAccordion({ items, pageUrl }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (items.length === 0) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <section aria-labelledby="faq-heading">
      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <h2
        id="faq-heading"
        className="mb-6 text-xl font-semibold text-fg"
      >
        Frequently asked questions
      </h2>

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          const panelId = `faq-panel-${i}`
          const triggerId = `faq-trigger-${i}`

          return (
            <div key={i} className="bg-bg-elevated">
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className={cn(
                  'flex w-full items-center justify-between gap-4',
                  'px-5 py-4 text-left',
                  'text-sm font-medium text-fg',
                  'transition-colors hover:bg-bg-muted',
                  'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary',
                  'min-h-[52px]'
                )}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!isOpen}
                className="border-t border-border px-5 pb-4 pt-3"
              >
                <p className="text-sm leading-relaxed text-fg-muted">{item.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
