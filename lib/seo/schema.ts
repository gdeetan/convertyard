// lib/seo/schema.ts
import type { ToolConfig, FAQItem } from '@/lib/types'
import type { TextToolConfig } from '@/lib/types-text'

export function buildSizeTargetSchemas(
  specificFaq: FAQItem[],
  parentFaq: FAQItem[],
  inheritedIndices: number[],
  breadcrumbItems: Array<{ name: string; url: string }>
): object[] {
  const allFaq = [
    ...specificFaq,
    ...inheritedIndices.map(i => parentFaq[i]).filter(Boolean),
  ]
  return [faqPageSchema(allFaq), breadcrumbSchema(breadcrumbItems)]
}

export const BASE_URL = 'https://convertyard.com'

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
    publisher: {
      '@type': 'Organization',
      name: 'ConvertYard',
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`,
    },
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
  }
}

export function howToSchema(config: { title: string; slug: string; options?: unknown[] }) {
  const steps = [
    {
      '@type': 'HowToStep',
      name: 'Add your files',
      text: 'Drag and drop your files onto the tool, or click to browse. You can add up to 1,000 files at once.',
    },
    ...(config.options && config.options.length > 0
      ? [{
          '@type': 'HowToStep',
          name: 'Adjust settings',
          text: 'Set your conversion options — quality, format, size target, or other parameters.',
        }]
      : []),
    {
      '@type': 'HowToStep',
      name: 'Convert and download',
      text: `Click Convert. ${config.title} runs entirely in your browser. Download individual files or a ZIP of all results.`,
    },
  ]

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${config.title}`,
    description: `Convert files locally in your browser with ${config.title}. No upload required.`,
    step: steps,
  }
}

export function textSoftwareApplicationSchema(config: TextToolConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.title,
    url: `${BASE_URL}/${config.slug}/`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: config.meta.description,
  }
}
