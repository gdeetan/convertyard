import { notFound } from 'next/navigation'
import { SizeTargetShell } from '@/components/size-target-shell/size-target-shell'
import { sizeTargets } from '@/content/size-target-registry'
import { sizeTargetMetadata } from '@/lib/seo/metadata'
import { buildSizeTargetSchemas, BASE_URL } from '@/lib/seo/schema'
import { config as compressMp3Config } from '@/content/tools/compress-mp3'

export function generateStaticParams() {
  const params = sizeTargets
    .filter(t => t.parentTool === 'compress-mp3')
    .map(t => ({ size: t.slug }))
  return params.length > 0 ? params : [{ size: '__placeholder__' }]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ size: string }>
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-mp3')
  if (!config) return {}
  return sizeTargetMetadata(config)
}

export default async function Page({
  params,
}: {
  params: Promise<{ size: string }>
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-mp3')
  if (!config) notFound()

  const schemas = buildSizeTargetSchemas(
    config.specificFaq,
    compressMp3Config.faq,
    [0, 6],
    [
      { name: 'Home',           url: `${BASE_URL}/` },
      { name: 'Tools',          url: `${BASE_URL}/tools/` },
      { name: 'Video & Audio',  url: `${BASE_URL}/tools/#video-audio` },
      { name: 'MP3 Compressor', url: `${BASE_URL}/compress-mp3/` },
      { name: config.targetLabel, url: `${BASE_URL}/compress-mp3/${size}/` },
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
        parentToolLabel="MP3 Compressor"
        parentToolHref="/compress-mp3/"
        parentCategory="Video & Audio"
        parentCategoryHref="/tools#video-audio"
      />
    </>
  )
}
