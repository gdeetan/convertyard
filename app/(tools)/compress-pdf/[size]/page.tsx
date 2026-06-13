import { notFound } from 'next/navigation'
import { SizeTargetShell } from '@/components/size-target-shell/size-target-shell'
import { sizeTargets } from '@/content/size-target-registry'
import { sizeTargetMetadata } from '@/lib/seo/metadata'
import { buildSizeTargetSchemas, BASE_URL } from '@/lib/seo/schema'
import { config as compressPdfConfig } from '@/content/tools/compress-pdf'

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
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-pdf')
  if (!config) return {}
  return sizeTargetMetadata(config)
}

export default async function Page({
  params,
}: {
  params: Promise<{ size: string }>
}) {
  const { size } = await params
  const config = sizeTargets.find(t => t.slug === size && t.parentTool === 'compress-pdf')
  if (!config) notFound()

  const schemas = buildSizeTargetSchemas(
    config.specificFaq,
    compressPdfConfig.faq,
    [4, 5],
    [
      { name: 'Home',         url: `${BASE_URL}/` },
      { name: 'Tools',        url: `${BASE_URL}/tools/` },
      { name: 'PDF Tools',    url: `${BASE_URL}/tools/#pdf` },
      { name: 'Compress PDF', url: `${BASE_URL}/compress-pdf/` },
      { name: config.targetLabel, url: `${BASE_URL}/compress-pdf/${size}/` },
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
        parentToolLabel="Compress PDF"
        parentToolHref="/compress-pdf/"
        parentCategory="PDF Tools"
        parentCategoryHref="/tools#pdf"
      />
    </>
  )
}
