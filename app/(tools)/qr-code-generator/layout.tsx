import type { Metadata } from 'next'
import { breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

const title = 'QR Code Generator — ConvertYard'
const description =
  'Turn a URL or any text into a QR code. Download PNG or SVG, or generate a batch from a CSV. Everything runs in your browser.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${BASE_URL}/qr-code-generator/` },
  openGraph: { title, description, url: `${BASE_URL}/qr-code-generator/` },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const schema = breadcrumbSchema([
    { name: 'ConvertYard', url: `${BASE_URL}/` },
    { name: 'QR Code Generator', url: `${BASE_URL}/qr-code-generator/` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  )
}
