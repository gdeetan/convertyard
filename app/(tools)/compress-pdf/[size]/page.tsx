import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SizeTargetShell } from '@/components/size-target-shell/size-target-shell'
import { sizeTargets } from '@/content/size-target-registry'

export function generateStaticParams() {
  const params = sizeTargets
    .filter(t => t.parentTool === 'compress-pdf')
    .map(t => ({ size: t.slug }))
  return params.length > 0 ? params : [{ size: '__placeholder__' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ size: string }>
}): Promise<Metadata> {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-pdf')
  if (!config) return {}
  return {
    title: `${config.h1} — ConvertYard`,
    description: config.intro.slice(0, 155),
    alternates: { canonical: `https://convertyard.com/compress-pdf/${size}/` },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ size: string }>
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-pdf')
  if (!config) notFound()

  return (
    <SizeTargetShell
      config={config}
      parentToolLabel="Compress PDF"
      parentToolHref="/compress-pdf/"
      parentCategory="PDF Tools"
      parentCategoryHref="/tools#pdf"
    />
  )
}
