import type { Metadata } from 'next'
import { breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

const title = 'Color Picker — ConvertYard'
const description =
  'Pick a color and copy it as HEX, RGB, HSL, or OKLCH. Convert between formats in your browser. Nothing is uploaded.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${BASE_URL}/color-picker/` },
  openGraph: { title, description, url: `${BASE_URL}/color-picker/` },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const schema = breadcrumbSchema([
    { name: 'ConvertYard', url: `${BASE_URL}/` },
    { name: 'Color Picker', url: `${BASE_URL}/color-picker/` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  )
}
