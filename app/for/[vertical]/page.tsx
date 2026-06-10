import { notFound } from 'next/navigation'
import { VerticalHubShell } from '@/components/vertical-hub-shell/vertical-hub-shell'
import { verticals } from '@/content/vertical-registry'
import { verticalMetadata } from '@/lib/seo/metadata'

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
}) {
  const { vertical } = await params
  const config = verticals.find(v => v.slug === vertical)
  if (!config) return {}
  return verticalMetadata(config)
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
