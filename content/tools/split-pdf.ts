import { splitPdf } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'split-pdf',
  title: 'Split PDF',
  subtitle: 'Split by page range, extract specific pages, or divide into equal chunks. Nothing leaves your browser.',
  bestFor: 'Best for extracting specific pages or breaking a long PDF into separate documents.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: splitPdf,
  enablePresets: true,

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
      q: 'Does splitting upload my PDF to your servers?',
      a: 'No. The split runs in your browser using WebAssembly. Your PDF never leaves your device.',
    },
    {
      q: 'What happens to bookmarks and internal links when I split a PDF?',
      a: 'Bookmarks and internal hyperlinks pointing to pages outside the extracted range are removed. Links to external URLs and links within extracted pages are preserved.',
    },
    {
      q: 'Can I split a scanned PDF?',
      a: 'Yes. Splitting works on any PDF, including scanned ones. It reorganises pages without altering or re-encoding page content.',
    },
    {
      q: 'Why does "every N pages" produce one fewer file than I expected?',
      a: 'If the page count is not evenly divisible by N, the last chunk contains the remaining pages rather than being discarded. A 10-page PDF split every 3 pages produces files of 3, 3, 3, and 1 page.',
    },
    {
      q: 'Will the quality of my PDF change after splitting?',
      a: 'No. Pages are copied exactly as-is using pdf-lib. No re-rendering, no re-encoding. Text, images, and vector graphics are preserved without loss.',
    },
    {
      q: 'Can I split a password-protected PDF?',
      a: 'PDFs with an open password cannot be split here. Remove the password first using the Unlock PDF tool, then split.',
    },
  ],

  relatedTools: ['extract-pages', 'delete-pages', 'merge-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Split a PDF — ConvertYard',
    description: 'Split a PDF into single pages, chunks of N pages, or a page range. Runs in your browser. Batch up to 1,000 files — nothing is uploaded, no account needed.',
  },
}
