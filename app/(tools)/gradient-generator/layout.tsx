import type { Metadata } from 'next'
import { breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

const title = 'Make a CSS Gradient — ConvertYard'
const description =
  'Build a CSS gradient with a live preview. Copy the CSS or export a PNG. Nothing leaves your browser.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${BASE_URL}/gradient-generator/` },
  openGraph: { title, description, url: `${BASE_URL}/gradient-generator/` },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const schema = breadcrumbSchema([
    { name: 'ConvertYard', url: `${BASE_URL}/` },
    { name: 'Gradient Generator', url: `${BASE_URL}/gradient-generator/` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  )
}
