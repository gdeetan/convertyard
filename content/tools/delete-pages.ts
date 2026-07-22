import { deletePages } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'delete-pages',
  title: 'Delete Pages from PDF',
  subtitle: 'Remove unwanted pages from a PDF. Batch-friendly — all processing happens in your browser.',
  bestFor: 'Best for removing blank pages, cover sheets, or confidential pages before sharing a PDF.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: deletePages,

  faq: [
    {
      q: 'Does deleting pages upload my PDF to your servers?',
      a: 'No. Everything runs in your browser using WebAssembly. Your PDF never leaves your device.',
    },
    {
      q: 'What page range format should I use?',
      a: 'Enter the page numbers you want to DELETE, separated by commas, and use a hyphen for ranges. For example, "1, 3, 5-8" deletes pages 1, 3, 5, 6, 7, and 8. All other pages are kept.',
    },
    {
      q: 'What happens if I try to delete all pages?',
      a: 'The tool will return an error — a PDF must have at least one page. If you need to delete all but a few pages, use the Extract Pages tool instead.',
    },
    {
      q: 'Can I delete pages from multiple PDFs at once?',
      a: 'Yes. Drop multiple PDFs and the same page selection is applied to each one. Each PDF produces its own trimmed output.',
    },
    {
      q: 'Will text, images, and fonts be preserved in the remaining pages?',
      a: 'Yes. Pages are copied exactly as-is. No re-rendering or re-encoding occurs.',
    },
    {
      q: 'Can I delete pages from a password-protected PDF?',
      a: 'No. Remove the password first with the Unlock PDF tool, then delete pages.',
    },
  ],

  relatedTools: ['extract-pages', 'split-pdf', 'compress-pdf', 'merge-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Delete Pages from PDF — ConvertYard',
    description:
      'Delete specific pages from a PDF in your browser. Enter the pages to remove and download the result. Batch 1,000 files — no uploads, no account.',
  },
}
