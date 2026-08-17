import type { Metadata } from 'next'
import { breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

const title = 'Decode a JWT — ConvertYard'
const description =
  'Paste a JWT to inspect its header, payload, and expiry. Optional HS256, RS256, or ES256 check. Decoded in your browser — the token is never sent anywhere.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${BASE_URL}/jwt-decoder/` },
  openGraph: { title, description, url: `${BASE_URL}/jwt-decoder/` },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const schema = breadcrumbSchema([
    { name: 'ConvertYard', url: `${BASE_URL}/` },
    { name: 'JWT Decoder', url: `${BASE_URL}/jwt-decoder/` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  )
}
