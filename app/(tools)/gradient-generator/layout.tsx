import type { Metadata } from 'next'
import { breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

const title = 'CSS Gradient Generator - Generates CSS, Image Background, w/ Presets'
const description =
  'Generate colorfull CSS gradient background with this tool. It has gradient presets (linear, radial, or conic), and you can export the background as a PNG file.'

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
