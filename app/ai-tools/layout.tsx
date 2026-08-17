import type { Metadata } from 'next'
import { CATEGORY_META } from '@/content/category-meta'

const meta = CATEGORY_META['ai-tools']

export const metadata: Metadata = {
  title: { absolute: meta.seoTitle },
  description: meta.seoDescription,
  alternates: { canonical: 'https://convertyard.com/ai-tools' },
  openGraph: {
    title: meta.seoTitle,
    description: meta.seoDescription,
    url: 'https://convertyard.com/ai-tools',
  },
}

export default function AiToolsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://convertyard.com' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://convertyard.com/tools' },
      { '@type': 'ListItem', position: 3, name: 'AI Tools', item: 'https://convertyard.com/ai-tools' },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  )
}
