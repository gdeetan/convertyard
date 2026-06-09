// lib/seo/metadata.ts
import type { Metadata } from 'next'
import type { ToolConfig } from '@/lib/types'
import type { TextToolConfig } from '@/lib/types-text'
import { BASE_URL } from '@/lib/seo/schema'

export function toolMetadata(config: ToolConfig): Metadata {
  const canonicalUrl = `${BASE_URL}/${config.slug}/`
  const ogImage = config.meta.ogImage ?? `${BASE_URL}/${config.slug}/opengraph-image`

  return {
    title: { absolute: config.meta.title },
    description: config.meta.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: config.meta.title,
      description: config.meta.description,
      url: canonicalUrl,
      siteName: 'ConvertYard',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.meta.title,
      description: config.meta.description,
      images: [ogImage],
    },
  }
}

export function textToolMetadata(config: TextToolConfig): Metadata {
  const canonicalUrl = `${BASE_URL}/${config.slug}/`
  const ogImage = config.meta.ogImage ?? `${BASE_URL}/og-default.png`

  return {
    title: { absolute: config.meta.title },
    description: config.meta.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: config.meta.title,
      description: config.meta.description,
      url: canonicalUrl,
      siteName: 'ConvertYard',
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.meta.title,
      description: config.meta.description,
      images: [ogImage],
    },
  }
}
