// lib/seo/metadata.ts
import type { Metadata } from 'next'
import type { ToolConfig, SizeTargetConfig, VerticalHubConfig } from '@/lib/types'
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

export function sizeTargetMetadata(config: SizeTargetConfig): Metadata {
  const canonicalUrl = `${BASE_URL}/${config.parentTool}/${config.slug}/`
  const title = `${config.h1} — ConvertYard`
  const description = config.intro.slice(0, 155)
  const ogImage = `${BASE_URL}/${config.parentTool}/opengraph-image`
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title, description, url: canonicalUrl, siteName: 'ConvertYard', type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  }
}

export function verticalMetadata(config: VerticalHubConfig): Metadata {
  const canonicalUrl = `${BASE_URL}/for/${config.slug}/`
  const title = `${config.name} Upload Kit — ConvertYard`
  const description = config.intro.slice(0, 155)
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl, siteName: 'ConvertYard', type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
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
