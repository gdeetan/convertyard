import { extractPages } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'extract-pages',
  title: 'Extract Pages from PDF',
  subtitle: 'Pull specific pages or page ranges into a new PDF. Batch-friendly — process 1,000 files without uploading a single one.',
  bestFor: 'Best for pulling a few pages out of a large PDF without splitting the whole file.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: extractPages,

  faq: [
    {
      q: 'Does page extraction upload my PDF to your servers?',
      a: 'No. Everything runs in your browser using WebAssembly. Your PDF never leaves your device.',
    },
    {
      q: 'What page range format should I use?',
      a: 'Enter page numbers separated by commas, and use a hyphen for ranges. For example, "1, 3, 5-8" extracts pages 1, 3, 5, 6, 7, and 8. Page numbers are 1-based.',
    },
    {
      q: 'Can I extract pages from multiple PDFs at once?',
      a: 'Yes. Drop multiple PDFs and the same page range is applied to each one. Each PDF produces its own output file.',
    },
    {
      q: 'What is the "One PDF per page" option?',
      a: 'When enabled, each selected page is saved as a separate PDF file instead of combining all selected pages into one. If you select pages 1, 3, and 5, you get three files.',
    },
    {
      q: 'Will text, images, and fonts be preserved?',
      a: 'Yes. Pages are copied exactly as-is using pdf-lib. No re-rendering or re-encoding occurs. Text, images, and vector graphics are preserved without loss.',
    },
    {
      q: 'Can I extract pages from a password-protected PDF?',
      a: 'No. Remove the password first with the Unlock PDF tool, then extract pages.',
    },
  ],

  relatedTools: ['delete-pages', 'split-pdf', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Extract Pages from PDF — ConvertYard',
    description:
      'Extract specific pages or page ranges from a PDF in your browser. Batch 1,000 files — no uploads, no account. Enter ranges like "1, 3, 5-8".',
  },
}
