// app/(tools)/json-formatter/layout.tsx
import type { Metadata } from 'next'
import { config } from '@/content/tools/json-formatter'
import { textToolMetadata } from '@/lib/seo/metadata'
import { howToSchema, textSoftwareApplicationSchema, faqPageSchema, breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

export const metadata: Metadata = textToolMetadata(config)

export default function Layout({ children }: { children: React.ReactNode }) {
  const schemas = [
    howToSchema(config),
    textSoftwareApplicationSchema(config),
    faqPageSchema(config.faq),
    breadcrumbSchema([
      { name: 'ConvertYard', url: `${BASE_URL}/` },
      { name: config.title, url: `${BASE_URL}/${config.slug}/` },
    ]),
  ]
  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      {children}
    </>
  )
}
