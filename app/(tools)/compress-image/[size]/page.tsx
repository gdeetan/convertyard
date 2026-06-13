import { notFound } from 'next/navigation'
import { SizeTargetShell } from '@/components/size-target-shell/size-target-shell'
import { sizeTargets } from '@/content/size-target-registry'
import { sizeTargetMetadata } from '@/lib/seo/metadata'

export function generateStaticParams() {
  const params = sizeTargets
    .filter(t => t.parentTool === 'compress-image')
    .map(t => ({ size: t.slug }))
  return params.length > 0 ? params : [{ size: '__placeholder__' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ size: string }>
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-image')
  if (!config) return {}
  return sizeTargetMetadata(config)
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
      parentToolLabel="Image Compressor"
      parentToolHref="/compress-image/"
      parentCategory="Image Tools"
      parentCategoryHref="/tools#image-editing"
    />
  )
}
