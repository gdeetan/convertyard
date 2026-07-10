import { notFound } from 'next/navigation'
import { SizeTargetShell } from '@/components/size-target-shell/size-target-shell'
import { sizeTargets } from '@/content/size-target-registry'
import { sizeTargetMetadata } from '@/lib/seo/metadata'
import { buildSizeTargetSchemas, BASE_URL } from '@/lib/seo/schema'
import { config as compressVideoConfig } from '@/content/tools/compress-video'

export function generateStaticParams() {
  const params = sizeTargets
    .filter(t => t.parentTool === 'compress-video')
    .map(t => ({ size: t.slug }))
  return params.length > 0 ? params : [{ size: '__placeholder__' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ size: string }>
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-video')
  if (!config) return {}
  return sizeTargetMetadata(config)
}

export default async function Page({
  params,
}: {
  params: Promise<{ size: string }>
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-video')
  if (!config) notFound()

  const schemas = buildSizeTargetSchemas(
    config.specificFaq,
    compressVideoConfig.faq,
    [0, 1],
    [
      { name: 'Home',           url: `${BASE_URL}/` },
      { name: 'Tools',          url: `${BASE_URL}/tools/` },
      { name: 'Video & Audio',  url: `${BASE_URL}/tools/#video-audio` },
      { name: 'Compress Video', url: `${BASE_URL}/compress-video/` },
      { name: config.targetLabel, url: `${BASE_URL}/compress-video/${size}/` },
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
        parentToolLabel="Compress Video"
        parentToolHref="/compress-video/"
        parentCategory="Video & Audio"
        parentCategoryHref="/tools#video-audio"
      />
    </>
  )
}
