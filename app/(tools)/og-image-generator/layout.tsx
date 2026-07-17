import { config } from '@/content/tools/og-image-generator'
import { toolMetadata } from '@/lib/seo/metadata'
import {
  BASE_URL,
  breadcrumbSchema,
  faqPageSchema,
  softwareApplicationSchema,
} from '@/lib/seo/schema'
import type { Metadata } from 'next'

export const metadata: Metadata = toolMetadata(config)

export default function Layout({ children }: { children: React.ReactNode }) {
  const schemas = [
    softwareApplicationSchema(config),
    faqPageSchema(config.faq),
    breadcrumbSchema([
      { name: 'ConvertYard', url: `${BASE_URL}/` },
      { name: 'Web Tools', url: `${BASE_URL}/web-tools/` },
      { name: config.title, url: `${BASE_URL}/${config.slug}/` },
    ]),
  ]

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
      {children}
    </>
  )
}
