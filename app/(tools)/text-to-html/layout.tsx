import type { Metadata } from 'next'
import { breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

export const metadata: Metadata = {
  title: 'Text to HTML Converter — ConvertYard',
  description: 'Convert Markdown or plain text to a full HTML document in your browser. Live preview with GitHub styling. Files never leave your device.',
  alternates: { canonical: `${BASE_URL}/text-to-html/` },
  openGraph: {
    title: 'Text to HTML Converter — ConvertYard',
    description: 'Convert Markdown or plain text to HTML in your browser. Live preview with GitHub styling.',
    url: `${BASE_URL}/text-to-html/`,
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const schema = breadcrumbSchema([
    { name: 'ConvertYard', url: `${BASE_URL}/` },
    { name: 'Text to HTML Converter', url: `${BASE_URL}/text-to-html/` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  )
}
