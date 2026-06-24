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
  {
    slug: 'convertyard-vs-adobe-acrobat-pro',
    title: 'ConvertYard vs. Adobe Acrobat Pro: Free Alternative Compared',
    description:
      'Honest feature-by-feature comparison of ConvertYard and Adobe Acrobat Pro. See what each tool does well — and which one you actually need.',
    lastUpdated: '2026-06-04',
  },
  {
    slug: 'compress-pdf-without-uploading-privacy-guide',
    title: 'How to Compress PDFs Without Uploading: The Privacy Guide',
    description:
      'Compress PDFs in your browser without sending files to any server. Includes a step-by-step Network tab verification trick that anyone can run.',
    lastUpdated: '2026-06-06',
  },
  {
    slug: 'convertyard-vs-ilovepdf',
    title: 'ConvertYard vs. iLovePDF: Which Free PDF Tool Should You Use',
    description:
      'Comparing ConvertYard and iLovePDF on batch limits, upload requirements, ad experience, and tool coverage. Mechanics compared, not marketing.',
    lastUpdated: '2026-06-08',
  },
  {
    slug: 'how-browser-based-file-conversion-works',
    title: 'The Complete Guide to Browser-Based File Conversion',
    description:
      'How WebAssembly makes local-only file conversion possible — and what it means for speed, privacy, and reliability. Your files stay in your browser.',
    lastUpdated: '2026-06-10',
  },
  {
    slug: 'cropping-photos-for-id-and-exam-requirements',
    title: 'How to Crop Photos for ID and Exam Photo Requirements',
    description:
      'Step-by-step guide to cropping passport, visa, and exam photos correctly in your browser. Covers UPSC, SSC CGL, NEET, JEE Main, and IBPS PO requirements.',
    lastUpdated: '2026-06-12',
  },
  {
    slug: 'pdf-watermarking-guide',
    title: 'PDF Watermarking 101: Protecting Documents Without Killing Readability',
    description:
      'How to watermark a PDF effectively — text vs. logo, placement, opacity, and the honest limits of what a watermark actually protects against.',
    lastUpdated: '2026-06-14',
  },
  {
    slug: 'password-protect-pdf-when-encryption-isnt-enough',
    title: "How to Password-Protect a PDF (and When Encryption Isn't Enough)",
    description:
      'Add a password to a PDF with AES-256 encryption. Plus: what password protection actually stops, common mistakes, and when you need something stronger.',
    lastUpdated: '2026-06-16',
  },
  {
    slug: 'word-to-pdf-and-back-what-survives',
    title: 'Word to PDF and Back: What Actually Survives the Round Trip',
    description:
      "Honest guide to Word–PDF conversion fidelity. What converts cleanly, what doesn't survive the round trip, and a self-test to check before you send.",
    lastUpdated: '2026-06-18',
  },
  {
    slug: 'exam-photo-requirements-compared-2026',
    title: 'UPSC, SSC CGL, NEET, JEE Main, IBPS PO: 2026 Photo Upload Requirements Compared',
    description:
      '2026 photo upload specs compared across five major Indian exams — file size, dimensions, background colour, and recency requirements in one place.',
    lastUpdated: '2026-06-20',
  },
  {
    slug: 'why-exam-photo-keeps-getting-rejected',
    title: 'Why Your Exam Form Photo Keeps Getting Rejected (and How to Fix It)',
    description:
      'The five most common reasons exam portal photos get rejected — with exact fixes for each one so you can resubmit without retaking the photo.',
    lastUpdated: '2026-06-21',
  },
  {
    slug: 'exif-data-whats-hiding-in-your-photo',
    title: "EXIF Data and Your Photos: What's Hiding in That JPEG",
    description:
      "Every JPEG from your phone contains hidden metadata — camera model, timestamp, GPS coordinates. Here's what's in yours and how to strip it.",
    lastUpdated: '2026-06-23',
  },
  {
    slug: 'avif-vs-webp-vs-jpeg-2026',
    title: 'AVIF vs. WebP vs. JPEG in 2026: Which Format Should You Actually Use',
    description:
      'Updated 2026 comparison of AVIF, WebP, and JPEG — compression, browser support, and a plain-English decision framework for web and general use.',
    lastUpdated: '2026-06-24',
  },
]
