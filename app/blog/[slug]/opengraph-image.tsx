// app/blog/[slug]/opengraph-image.tsx
import { OG_SIZE, makeOgResponse } from '@/lib/seo/og-image'
import { articles } from '@/content/article-registry'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = 'image/png'
export const alt = 'ConvertYard article'

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = articles.find((a) => a.slug === slug)
  return makeOgResponse({
    title: entry?.title ?? 'ConvertYard',
    subtitle: entry?.description,
  })
}
