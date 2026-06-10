// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleShell } from '@/components/article-shell/article-shell'
import { articles, type ArticleMeta } from '@/content/article-registry'

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = articles.find((a) => a.slug === slug)
  if (!entry) return {}

  return {
    title: entry.title,
    description: entry.description,
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: `/blog/${slug}/`,
      type: 'article',
      publishedTime: entry.lastUpdated,
      modifiedTime: entry.lastUpdated,
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = articles.find((a) => a.slug === slug)
  if (!entry) notFound()

  let Content: React.ComponentType
  let meta: ArticleMeta

  try {
    const mod = await import(`@/content/articles/${slug}.mdx`)
    Content = mod.default
    meta = mod.meta
  } catch {
    notFound()
  }

  return (
    <ArticleShell
      slug={slug}
      title={meta.title}
      description={meta.description}
      lastUpdated={meta.lastUpdated}
      faq={meta.faq}
      relatedTools={meta.relatedTools}
    >
      <Content />
    </ArticleShell>
  )
}
