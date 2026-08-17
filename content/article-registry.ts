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
    lastUpdated: '2026-04-13',
  },
  {
    slug: 'lossless-vs-lossy',
    title: 'Lossless vs. Lossy Image Compression: What Is the Difference?',
    description:
      'Lossless compression preserves every pixel exactly. Lossy discards data your eye will not notice. Here is when each matters and which formats use which.',
    lastUpdated: '2026-04-27',
  },
  {
    slug: 'compress-images-without-losing-quality',
    title: 'How to Compress Images Without Losing Quality',
    description:
      'Understand the quality threshold that makes lossy compression invisible, why format choice matters more than any quality slider, and how to compress in batches.',
    lastUpdated: '2026-05-02',
  },
  {
    slug: 'batch-convert-images',
    title: 'How to Batch Convert Images: The Complete Guide',
    description:
      'Convert hundreds or thousands of images at once — without desktop software, without uploads, and without babysitting a one-file-at-a-time tool.',
    lastUpdated: '2026-05-08',
  },
  {
    slug: 'best-webp-quality',
    title: 'What Is the Best WebP Quality Setting?',
    description:
      'Quality 80 is the standard recommendation for WebP — here is why, what changes at different settings, and when to go higher or lower.',
    lastUpdated: '2026-05-15',
  },
  {
    slug: 'avif-browser-support',
    title: 'AVIF Browser Support in 2026: When Is It Safe to Use?',
    description:
      'AVIF is supported in Chrome, Firefox, Edge, and Safari 16+. That covers over 93% of global web traffic. Here is how to deploy AVIF safely with fallbacks.',
    lastUpdated: '2026-05-20',
  },
  {
    slug: 'exif-data-whats-hiding-in-your-photo',
    title: "EXIF Data and Your Photos: What's Hiding in That JPEG",
    description:
      "Every JPEG from your phone contains hidden metadata — camera model, timestamp, GPS coordinates. Here's what's in yours and how to strip it.",
    lastUpdated: '2026-05-24',
  },
  {
    slug: 'merge-pdf-without-uploading',
    title: 'How to Merge PDF Files Without Uploading Them',
    description:
      "Free PDF merge tools upload your documents to third-party servers. Here's what happens to your files — and how to merge PDFs locally in your browser instead.",
    lastUpdated: '2026-05-27',
  },
  {
    slug: 'avif-vs-webp-vs-jpeg-2026',
    title: 'AVIF vs. WebP vs. JPEG in 2026: Which Format Should You Actually Use',
    description:
      'Updated 2026 comparison of AVIF, WebP, and JPEG — compression, browser support, and a plain-English decision framework for web and general use.',
    lastUpdated: '2026-05-31',
  },
  {
    slug: 'alt-text-guide',
    title: 'Alt Text for Images: A Complete Guide for Web Accessibility',
    description:
      'The European Accessibility Act took effect June 2025. Learn what alt text is, what the law requires, how to write it well, and how to generate it for hundreds of images at once.',
    lastUpdated: '2026-06-04',
  },
  {
    slug: 'import-alt-text-csv-to-cms',
    title: 'How to Import Alt Text CSV to WordPress, Shopify, and Contentful',
    description:
      'Step-by-step instructions for importing a bulk alt text CSV into WordPress, Shopify, and Contentful — plus guidance for Webflow, Squarespace, and custom CMS setups.',
    lastUpdated: '2026-06-08',
  },
  {
    slug: 'how-browser-based-file-conversion-works',
    title: 'The Complete Guide to Browser-Based File Conversion',
    description:
      'How WebAssembly makes local-only file conversion possible — and what it means for speed, privacy, and reliability. Your files stay in your browser.',
    lastUpdated: '2026-06-11',
  },
  {
    slug: 'convertyard-vs-adobe-acrobat-pro',
    title: 'ConvertYard vs. Adobe Acrobat Pro: Free Alternative Compared',
    description:
      'Honest feature-by-feature comparison of ConvertYard and Adobe Acrobat Pro. See what each tool does well — and which one you actually need.',
    lastUpdated: '2026-06-13',
  },
  {
    slug: 'compress-pdf-without-uploading-privacy-guide',
    title: 'How to Compress PDFs Without Uploading: The Privacy Guide',
    description:
      'Compress PDFs in your browser without sending files to any server. Includes a step-by-step Network tab verification trick that anyone can run.',
    lastUpdated: '2026-06-16',
  },
  {
    slug: 'heic-to-jpg-on-windows',
    title: 'How to Convert HEIC to JPG on Windows (Without iTunes)',
    description:
      'Windows does not open HEIC files by default. Here are three ways to convert iPhone photos to JPG on Windows — including a browser method that requires no software installation.',
    lastUpdated: '2026-06-18',
  },
  {
    slug: 'convertyard-vs-ilovepdf',
    title: 'ConvertYard vs. iLovePDF: Which Free PDF Tool Should You Use',
    description:
      'Comparing ConvertYard and iLovePDF on batch limits, upload requirements, ad experience, and tool coverage. Mechanics compared, not marketing.',
    lastUpdated: '2026-06-20',
  },
  {
    slug: 'cropping-photos-for-id-and-exam-requirements',
    title: 'How to Crop Photos for ID and Exam Photo Requirements',
    description:
      'Step-by-step guide to cropping passport, visa, and exam photos correctly in your browser. Covers UPSC, SSC CGL, NEET, JEE Main, and IBPS PO requirements.',
    lastUpdated: '2026-06-22',
  },
  {
    slug: 'pdf-watermarking-guide',
    title: 'PDF Watermarking 101: Protecting Documents Without Killing Readability',
    description:
      'How to watermark a PDF effectively — text vs. logo, placement, opacity, and the honest limits of what a watermark actually protects against.',
    lastUpdated: '2026-06-24',
  },
  {
    slug: 'password-protect-pdf-when-encryption-isnt-enough',
    title: "How to Password-Protect a PDF (and When Encryption Isn't Enough)",
    description:
      'Add a password to a PDF with AES-256 encryption. Plus: what password protection actually stops, common mistakes, and when you need something stronger.',
    lastUpdated: '2026-06-26',
  },
  {
    slug: 'word-to-pdf-and-back-what-survives',
    title: 'Word to PDF and Back: What Actually Survives the Round Trip',
    description:
      "Honest guide to Word–PDF conversion fidelity. What converts cleanly, what doesn't survive the round trip, and a self-test to check before you send.",
    lastUpdated: '2026-06-28',
  },
  {
    slug: 'exam-photo-requirements-compared-2026',
    title: 'UPSC, SSC CGL, NEET, JEE Main, IBPS PO: 2026 Photo Upload Requirements Compared',
    description:
      '2026 photo upload specs compared across five major Indian exams — file size, dimensions, background colour, and recency requirements in one place.',
    lastUpdated: '2026-06-30',
  },
  {
    slug: 'why-exam-photo-keeps-getting-rejected',
    title: 'Why Your Exam Form Photo Keeps Getting Rejected (and How to Fix It)',
    description:
      'The five most common reasons exam portal photos get rejected — with exact fixes for each one so you can resubmit without retaking the photo.',
    lastUpdated: '2026-07-01',
  },
  {
    slug: 'audio-bitrate-explained',
    title: 'Audio Bitrate Explained: What It Is and What Setting to Use',
    description:
      'Audio bitrate controls how much data is used to store each second of audio. Here is what the numbers mean, how they affect quality, and which setting to pick for every use case.',
    lastUpdated: '2026-07-25',
  },
  {
    slug: 'extract-audio-from-mp4',
    title: 'How to Extract Audio from MP4 (Without Desktop Software)',
    description:
      'Three ways to pull audio out of an MP4 file: a browser tool (no uploads, no software), ffmpeg on the command line, and desktop apps. Includes format and quality guidance.',
    lastUpdated: '2026-07-25',
  },
  {
    slug: 'browser-video-editing-2026',
    title: 'Browser-Based Video Editing in 2026: What You Can (and Cannot) Do',
    description:
      'Modern browsers can compress, convert, extract audio, trim, and package video entirely locally — no uploads. Here is what works, what the limits are, and when to use a desktop app instead.',
    lastUpdated: '2026-07-25',
  },
  {
    slug: 'compress-video-without-uploading',
    title: 'How to Compress Video Without Uploading',
    description:
      'How to shrink a video for email or a form without sending the file to a server — and how to prove the tool is actually local.',
    lastUpdated: '2026-07-30',
  },
  {
    slug: 'h264-vs-h265-video-compression',
    title: 'H.264 vs H.265 Video Compression: Which Should You Use?',
    description:
      'H.264 plays on almost every device. H.265 makes a smaller file. Which to pick for email, phones, and old Windows PCs — and how to switch.',
    lastUpdated: '2026-08-07',
  },
  {
    slug: 'batch-compress-videos',
    title: 'How to Batch Compress Videos',
    description:
      'Drop a folder of videos, set a size or quality once, download a ZIP. What works in a browser, what settings to use, and when HandBrake is faster.',
    lastUpdated: '2026-08-14',
  },
]
