import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compare-pdfs',
  title: 'Compare Two PDFs',
  subtitle: 'Visual diff between two PDFs. Highlights what changed.',
  bestFor: 'Best for spotting changes between versions of a contract, report, or document.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.zip',
  convertFn: () => Promise.resolve([]),
  options: [
    {
      type: 'slider' as const,
      name: 'dpi',
      label: 'Resolution (DPI)',
      min: 72,
      max: 150,
      step: 1,
      default: 96,
      hint: 'Higher DPI shows more detail but takes longer.',
    },
  ],
  faq: [
    {
      q: 'Are my PDFs uploaded to a server?',
      a: 'Never. Both PDFs are rasterized and compared entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'How does the diff work?',
      a: 'Each page is rendered as an image at the chosen DPI. Pixels that differ between the two versions are highlighted in red on the diff image.',
    },
    {
      q: 'What if the two PDFs have different page counts?',
      a: 'The tool compares matching pages (1 vs 1, 2 vs 2, etc.) up to the shorter document. Extra pages from the longer document are shown as-is with no diff.',
    },
    {
      q: 'What does the ZIP download contain?',
      a: 'The ZIP contains three folders: "a" (pages from PDF A), "b" (pages from PDF B), and "diff" (red-highlighted difference images).',
    },
    {
      q: 'Why does the diff show everything as changed?',
      a: 'This happens when the PDFs have different page sizes or when content is shifted by even 1 pixel. Make sure both PDFs use the same page size and layout.',
    },
  ],
  relatedTools: ['flatten-pdf', 'watermark-pdf', 'compress-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Compare Two PDFs — ConvertYard',
    description: 'Visual diff between two PDF files in your browser. Highlights added and removed content per page. No uploads, no account, entirely local.',
  },
}
