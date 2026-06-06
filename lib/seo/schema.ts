// lib/seo/schema.ts
import type { ToolConfig, FAQItem } from '@/lib/types'

const BASE_URL = 'https://convertyard.com'

export function softwareApplicationSchema(config: ToolConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.title,
    url: `${BASE_URL}/${config.slug}/`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: config.meta.description,
  }
}

export function faqPageSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function articleSchema(opts: {
  title: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  authorName?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified,
    author: {
      '@type': 'Organization',
      name: opts.authorName ?? 'ConvertYard',
    },
    publisher: organizationSchema(),
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ConvertYard',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [] as string[],
  }
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ConvertYard',
    url: BASE_URL,
    description:
      'Local-first batch file conversion in your browser. No uploads. No accounts.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/tools?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
