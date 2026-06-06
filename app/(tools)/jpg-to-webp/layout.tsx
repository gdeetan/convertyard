import { config } from '@/content/tools/jpg-to-webp'
import { toolMetadata } from '@/lib/seo/metadata'
import {
  softwareApplicationSchema,
  faqPageSchema,
  breadcrumbSchema,
} from '@/lib/seo/schema'
import type { Metadata } from 'next'

export const metadata: Metadata = toolMetadata(config)

export default function Layout({ children }: { children: React.ReactNode }) {
  const schemas = [
    softwareApplicationSchema(config),
    faqPageSchema(config.faq),
    breadcrumbSchema([
      { name: 'ConvertYard', url: 'https://convertyard.com/' },
      { name: config.title, url: `https://convertyard.com/${config.slug}/` },
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
