import type { Metadata } from 'next'
import { breadcrumbSchema, BASE_URL } from '@/lib/seo/schema'

const title = 'Regex Tester — ConvertYard'
const description =
  'Test a JavaScript regular expression against sample text. See matches, capture groups, and flags as you type. Runs in your browser — nothing is uploaded.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: `${BASE_URL}/regex-tester/` },
  openGraph: { title, description, url: `${BASE_URL}/regex-tester/` },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const schema = breadcrumbSchema([
    { name: 'ConvertYard', url: `${BASE_URL}/` },
    { name: 'Regex Tester', url: `${BASE_URL}/regex-tester/` },
  ])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {children}
    </>
  )
}
