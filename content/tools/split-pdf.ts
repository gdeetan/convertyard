import { splitPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'split-pdf',
  title: 'Split PDF',
  subtitle: 'Extract pages or split a PDF into parts. Built for batches.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: splitPdf,

  options: [
    {
      type: 'radio',
      name: 'splitMode',
      label: 'Split mode',
      choices: [
        { value: 'each-page', label: 'One file per page' },
        { value: 'every-n',   label: 'Every N pages' },
        { value: 'page-range', label: 'Extract page range' },
      ],
      default: 'each-page',
      conditionalHints: {
        'each-page':  'Each page becomes its own PDF file.',
        'every-n':    'Split into chunks of N pages. Set N below.',
        'page-range': 'Extract a specific range of pages into one PDF. Set From/To below.',
      },
    },
    {
      type: 'number',
      name: 'everyN',
      label: 'Pages per chunk',
      min: 1,
      default: 2,
      hint: 'Split the PDF into chunks of this many pages',
      dependsOn: { name: 'splitMode', value: 'every-n' },
    },
    {
      type: 'number',
      name: 'pageFrom',
      label: 'From page',
      min: 1,
      default: 1,
      hint: 'First page to extract (1-based)',
      dependsOn: { name: 'splitMode', value: 'page-range' },
    },
    {
      type: 'number',
      name: 'pageTo',
      label: 'To page',
      min: 1,
      default: 9999,
      hint: 'Last page to extract. Leave at 9999 to extract to the end.',
      dependsOn: { name: 'splitMode', value: 'page-range' },
    },
  ],

  faq: [
    {
      q: 'What does "one file per page" do?',
      a: 'Each page of your PDF becomes a separate PDF file. A 10-page document produces 10 individual files. They all download together in a ZIP. This is the fastest way to separate a PDF into individual pages.',
    },
    {
      q: 'How does "every N pages" work?',
      a: 'The PDF is divided into sequential chunks. For example, a 10-page PDF split every 3 pages produces: pages 1–3, pages 4–6, pages 7–9, and page 10. The last chunk may be shorter than N.',
    },
    {
      q: 'Can I extract just a few specific pages?',
      a: 'Yes. Choose "Extract page range" and set From and To. For example, From: 2, To: 5 extracts pages 2, 3, 4, and 5 into a single PDF. To extract a single page, set both From and To to the same number.',
    },
    {
      q: 'Does this work on batches?',
      a: 'Yes. Drop multiple PDFs and the same split settings are applied to each. Each PDF produces its own set of output files. Everything downloads as a ZIP.',
    },
    {
      q: 'Will the quality of my PDF change after splitting?',
      a: 'No. Pages are copied exactly as-is using pdf-lib. No re-rendering, no re-encoding. Text, images, and vector graphics are preserved without loss.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Splitting runs entirely in your browser. Your PDFs never leave your device.',
    },
  ],

  relatedTools: ['merge-pdf', 'compress-pdf', 'pdf-to-jpg'],
  relatedArticles: [],

  meta: {
    title: 'Split PDF — ConvertYard',
    description: 'Split PDF into individual pages, chunks of N pages, or extract a page range in your browser. Batch 1,000 files — no uploads, no account.',
  },
}
