import type { Metadata } from 'next'
import { CATEGORY_META } from '@/content/category-meta'

const meta = CATEGORY_META['images']

export const metadata: Metadata = {
  title: meta.seoTitle,
  description: meta.seoDescription,
  alternates: { canonical: 'https://convertyard.com/images' },
  openGraph: {
    title: meta.seoTitle,
    description: meta.seoDescription,
    url: 'https://convertyard.com/images',
  },
}

export default function ImagesLayout({ children }: { children: React.ReactNode }) {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://convertyard.com' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://convertyard.com/tools' },
      { '@type': 'ListItem', position: 3, name: 'Images', item: 'https://convertyard.com/images' },
    ],
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  )
}
