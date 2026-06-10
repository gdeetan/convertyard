import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VerticalHubShell } from '@/components/vertical-hub-shell/vertical-hub-shell'
import { verticals } from '@/content/vertical-registry'

export function generateStaticParams() {
  // Returns empty array when no verticals are registered yet.
  // Next.js static export requires at least one entry to avoid a build error,
  // so we return a placeholder that will hit notFound() at render time.
  const params = verticals.map(v => ({ vertical: v.slug }))
  return params.length > 0 ? params : [{ vertical: '__placeholder__' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>
}): Promise<Metadata> {
  const { vertical } = await params
  const config = verticals.find(v => v.slug === vertical)
  if (!config) return {}
  return {
    title: `${config.h1} — ConvertYard`,
    description: config.intro.slice(0, 155),
    alternates: { canonical: `https://convertyard.com/for/${vertical}/` },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ vertical: string }>
}) {
  const { vertical } = await params
  const config = verticals.find(v => v.slug === vertical)
  if (!config) notFound()

  return <VerticalHubShell config={config} />
}
