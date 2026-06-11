// content/article-registry.ts
export interface ArticleFAQItem {
  q: string
  a: string
}

export interface ArticleMeta {
  title: string
  description: string
  lastUpdated: string
  faq: ArticleFAQItem[]
  relatedTools: string[]
}

export interface ArticleEntry {
  slug: string
  title: string
  description: string
  lastUpdated: string
}

export const articles: ArticleEntry[] = [
  {
    slug: 'what-is-heic',
    title: 'What Is HEIC and How to Convert It',
    description:
      "HEIC is Apple's photo format — half the size of JPG, but barely supported outside Apple devices. Learn what's inside HEIC files and how to convert them without uploading.",
    lastUpdated: '2026-06-10',
  },
  {
    slug: 'webp-vs-avif-vs-jpeg',
    title: 'WebP vs AVIF vs JPEG: Which Image Format Should You Use?',
    description:
      'Real compression numbers, browser support tables, and a plain-English decision guide for choosing between JPEG, WebP, and AVIF for web images.',
    lastUpdated: '2026-06-10',
  },
  {
    slug: 'compress-images-without-losing-quality',
    title: 'How to Compress Images Without Losing Quality',
    description:
      'Understand the quality threshold that makes lossy compression invisible, why format choice matters more than any quality slider, and how to compress in batches.',
    lastUpdated: '2026-06-10',
  },
  {
    slug: 'merge-pdf-without-uploading',
    title: 'How to Merge PDF Files Without Uploading Them',
    description:
      "Free PDF merge tools upload your documents to third-party servers. Here's what happens to your files — and how to merge PDFs locally in your browser instead.",
    lastUpdated: '2026-06-10',
  },
  {
    slug: 'alt-text-guide',
    title: 'Alt Text for Images: A Complete Guide for Web Accessibility',
    description:
      'The European Accessibility Act took effect June 2025. Learn what alt text is, what the law requires, how to write it well, and how to generate it for hundreds of images at once.',
    lastUpdated: '2026-06-10',
  },
  {
    slug: 'import-alt-text-csv-to-cms',
    title: 'How to Import Alt Text CSV to WordPress, Shopify, and Contentful',
    description:
      'Step-by-step instructions for importing a bulk alt text CSV into WordPress, Shopify, and Contentful — plus guidance for Webflow, Squarespace, and custom CMS setups.',
    lastUpdated: '2026-06-11',
  },
]
