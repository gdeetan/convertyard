import { config } from '@/content/tools/tiff-to-webp'
import { toolMetadata } from '@/lib/seo/metadata'
import {
  howToSchema,
  softwareApplicationSchema,
  faqPageSchema,
  breadcrumbSchema,
  BASE_URL,
} from '@/lib/seo/schema'
import type { Metadata } from 'next'

export const metadata: Metadata = toolMetadata(config)

export default function Layout({ children }: { children: React.ReactNode }) {
  const schemas = [
    howToSchema(config),
    softwareApplicationSchema(config),
    faqPageSchema(config.faq),
    breadcrumbSchema([
      { name: 'ConvertYard', url: `${BASE_URL}/` },
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
