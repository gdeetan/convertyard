import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SizeTargetShell } from '@/components/size-target-shell/size-target-shell'
import { sizeTargets } from '@/content/size-target-registry'
import { config as parentConfig } from '@/content/tools/compress-image'

export function generateStaticParams() {
  return sizeTargets
    .filter(t => t.parentTool === 'compress-image')
    .map(t => ({ size: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ size: string }>
}): Promise<Metadata> {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-image')
  if (!config) return {}
  return {
    title: `${config.h1} — ConvertYard`,
    description: config.intro.slice(0, 155),
    alternates: { canonical: `https://convertyard.com/compress-image/${size}/` },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ size: string }>
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-image')
  if (!config) notFound()

  return (
    <SizeTargetShell
      config={config}
      parentToolConfig={parentConfig}
      parentToolLabel="Image Compressor"
      parentToolHref="/compress-image/"
      parentCategory="Image Tools"
      parentCategoryHref="/tools#image-editing"
    />
  )
}
