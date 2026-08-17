import type { Metadata } from 'next'
import { breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

const title = 'Compare Two Texts — ConvertYard'
const description =
  'Compare two texts side by side. Added, removed, and changed lines are highlighted at line and word level. Runs in your browser — nothing is uploaded or stored.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${BASE_URL}/diff-checker/` },
  openGraph: { title, description, url: `${BASE_URL}/diff-checker/` },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const schema = breadcrumbSchema([
    { name: 'ConvertYard', url: `${BASE_URL}/` },
    { name: 'Compare Two Texts', url: `${BASE_URL}/diff-checker/` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  )
}
