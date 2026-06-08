import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'All Tools — ConvertYard',
  description: 'Browse 60+ local-first file conversion tools. Images, PDF, video, audio, developer utilities, web tools, and AI tools — all run in your browser.',
  alternates: { canonical: 'https://convertyard.com/tools' },
  openGraph: {
    title: 'All Tools — ConvertYard',
    description: 'Browse 60+ local-first file conversion tools — all run in your browser.',
    url: 'https://convertyard.com/tools',
  },
}

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://convertyard.com' },
      { '@type': 'ListItem', position: 2, name: 'All Tools', item: 'https://convertyard.com/tools' },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  )
}
