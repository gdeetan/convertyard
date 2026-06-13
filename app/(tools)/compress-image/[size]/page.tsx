import { notFound } from 'next/navigation'
import { SizeTargetShell } from '@/components/size-target-shell/size-target-shell'
import { sizeTargets } from '@/content/size-target-registry'
import { sizeTargetMetadata } from '@/lib/seo/metadata'
import { buildSizeTargetSchemas, BASE_URL } from '@/lib/seo/schema'
import { config as compressImageConfig } from '@/content/tools/compress-image'

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

  const schemas = buildSizeTargetSchemas(
    config.specificFaq,
    compressImageConfig.faq,
    [6],
    [
      { name: 'Home',             url: `${BASE_URL}/` },
      { name: 'Tools',            url: `${BASE_URL}/tools/` },
      { name: 'Image Tools',      url: `${BASE_URL}/tools/#image-editing` },
      { name: 'Image Compressor', url: `${BASE_URL}/compress-image/` },
      { name: config.targetLabel, url: `${BASE_URL}/compress-image/${size}/` },
    ]
  )

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}
      <SizeTargetShell
        config={config}
        parentToolLabel="Image Compressor"
        parentToolHref="/compress-image/"
        parentCategory="Image Tools"
        parentCategoryHref="/tools#image-editing"
      />
    </>
  )
}
