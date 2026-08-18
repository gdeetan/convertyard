'use client'

import Script from 'next/script'

const PRODUCT_ID = '4117256'

const BADGES = [
  {
    variant: 'sf',
    href: 'https://sourceforge.net/software/product/ConvertYard/',
  },
  {
    variant: 'sd',
    href: 'https://slashdot.org/software/p/ConvertYard/',
  },
  {
    variant: 'tbs',
    href: 'https://topbusinesssoftware.com/products/ConvertYard/reviews/',
  },
] as const

export function DirectoryBadges() {
  return (
    <section aria-label="Software directory listings">
      <h2 className="mb-4 mt-10 text-xl font-semibold text-fg">Reviews</h2>
      <div className="flex flex-wrap items-start gap-4">
        {BADGES.map((badge) => (
          <div
            key={badge.variant}
            className="sf-root"
            data-id={PRODUCT_ID}
            data-badge="light-default"
            data-variant-id={badge.variant}
            style={{ width: 100 }}
          >
            <a href={badge.href} target="_blank" rel="noopener noreferrer">
              ConvertYard Reviews
            </a>
          </div>
        ))}
      </div>
      {BADGES.map((badge) => (
        <Script
          key={badge.variant}
          src={`https://b.sf-syn.com/badge_js?sf_id=${PRODUCT_ID}&variant_id=${badge.variant}`}
          strategy="afterInteractive"
        />
      ))}
    </section>
  )
}
