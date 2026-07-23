import { headerFooterPdf } from '@/lib/converters/pdf-tier3'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'header-footer',
  title: 'Add Header and Footer to PDF',
  subtitle: 'Local-first header and footer stamping. Built for batches.',
  bestFor: 'Best for adding company names, document titles, or dates to every page of a report or contract.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: headerFooterPdf,
  enablePresets: true,
  options: [
    {
      type: 'dropdown' as const,
      name: 'headerText',
      label: 'Header text',
      choices: [
        { value: '',                       label: 'None' },
        { value: '{date}',                 label: 'Date ({date})' },
        { value: 'Page {page} of {total}', label: 'Page number (Page {page} of {total})' },
        { value: 'CONFIDENTIAL',           label: 'CONFIDENTIAL' },
        { value: 'DRAFT',                  label: 'DRAFT' },
      ],
      default: '',
    },
    {
      type: 'dropdown' as const,
      name: 'footerText',
      label: 'Footer text',
      choices: [
        { value: '',                       label: 'None' },
        { value: 'Page {page} of {total}', label: 'Page number (Page {page} of {total})' },
        { value: '{page}',                 label: 'Page number only ({page})' },
        { value: '{date}',                 label: 'Date ({date})' },
        { value: 'CONFIDENTIAL',           label: 'CONFIDENTIAL' },
      ],
      default: 'Page {page} of {total}',
    },
    {
      type: 'radio' as const,
      name: 'alignment',
      label: 'Alignment',
      choices: [
        { value: 'left',   label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right',  label: 'Right' },
      ],
      default: 'center',
    },
    {
      type: 'slider' as const,
      name: 'fontSize',
      label: 'Font size (pt)',
      min: 6,
      max: 18,
      step: 1,
      default: 10,
    },
  ],
  faq: [
    {
      q: 'Are my PDFs uploaded to a server?',
      a: 'Never. Headers and footers are stamped in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'What variables can I use in the text?',
      a: '{page} inserts the current page number, {total} inserts the total page count, and {date} inserts today\'s date (e.g. "Jul 23, 2026").',
    },
    {
      q: 'Can I add a header but no footer, or vice versa?',
      a: 'Yes. Select "None" for either field and only the other will be stamped.',
    },
    {
      q: 'Can I apply different headers to different PDFs in the same batch?',
      a: 'Not in a single pass — the same header and footer text is applied to every file in the batch. Process each group separately if you need different text per file.',
    },
    {
      q: 'Will the header or footer overlap my content?',
      a: 'The text is drawn 30 pt from the page edge. If your PDF has content that bleeds to the very edge, there is a small risk of overlap — try reducing the font size.',
    },
  ],
  relatedTools: ['page-numbers', 'watermark-pdf', 'crop-pdf', 'compress-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Add Header and Footer to PDF — ConvertYard',
    description: 'Add custom headers and footers to PDF files in your browser. Supports page numbers and dates. Batch 1,000 files — no uploads, entirely local.',
  },
}
