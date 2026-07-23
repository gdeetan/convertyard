import { addPageNumbers } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'page-numbers',
  title: 'Add Page Numbers to PDF',
  subtitle: 'Stamp page numbers onto every page. Batch-friendly — all processing happens in your browser.',
  bestFor: 'Best for reports, manuscripts, or any PDF you need to navigate by page number.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: addPageNumbers,
  enablePresets: true,

  options: [
    {
      type: 'radio',
      name: 'format',
      label: 'Number format',
      choices: [
        { value: 'N',           label: '1, 2, 3 …' },
        { value: 'Page N',      label: 'Page 1, Page 2 …' },
        { value: 'Page N of T', label: 'Page 1 of 12, Page 2 of 12 …' },
        { value: 'N / T',       label: '1 / 12, 2 / 12 …' },
      ],
      default: 'Page N of T',
    },
    {
      type: 'radio',
      name: 'position',
      label: 'Position',
      choices: [
        { value: 'bottom-center', label: 'Bottom centre' },
        { value: 'bottom-right',  label: 'Bottom right' },
        { value: 'bottom-left',   label: 'Bottom left' },
        { value: 'top-center',    label: 'Top centre' },
        { value: 'top-right',     label: 'Top right' },
        { value: 'top-left',      label: 'Top left' },
      ],
      default: 'bottom-center',
    },
    {
      type: 'position-diagram',
      name: 'positionDiagram',
      label: '',
    },
    {
      type: 'slider',
      name: 'margin',
      label: 'Margin from edge (pt)',
      min: 10,
      max: 100,
      step: 5,
      default: 30,
      hint: '30 pt is the standard footer margin. Increase if your PDF has content near the edges.',
    },
    {
      type: 'slider',
      name: 'fontSize',
      label: 'Font size (pt)',
      min: 6,
      max: 24,
      step: 1,
      default: 10,
      hint: '10 pt is standard for footers. Go larger if printing at small scale.',
    },
    {
      type: 'number',
      name: 'startNumber',
      label: 'Start at page',
      min: 1,
      default: 1,
      hint: 'The number to stamp on the first page. Useful when combining documents.',
    },
  ],

  faq: [
    {
      q: 'Does adding page numbers upload my PDF?',
      a: 'No. Numbers are stamped in your browser using WebAssembly. Your PDF never leaves your device.',
    },
    {
      q: 'What font is used for the page numbers?',
      a: 'Helvetica — a clean sans-serif font that is built into the PDF standard and requires no external file.',
    },
    {
      q: 'Can I start numbering from a page other than 1?',
      a: 'Yes. Set "Start at page" to any number. The first page of your PDF will show that number and increment from there.',
    },
    {
      q: 'Can I add page numbers to multiple PDFs at once?',
      a: 'Yes. Drop multiple PDFs — the same format, position, font size, and start number are applied to each file.',
    },
    {
      q: 'Will existing content be covered by the page number?',
      a: 'The number is drawn at the margin distance you set (default 30 pt from the edge). If your PDF has content near the edge, increase the "Margin from edge" slider to push the number further in.',
    },
    {
      q: 'Can I customise the font or colour?',
      a: 'Not yet. The current tool uses black Helvetica at the size you choose. Custom fonts and colours are on the roadmap.',
    },
  ],

  relatedTools: ['watermark-pdf', 'crop-pdf', 'extract-pages', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Add Page Numbers to PDF — ConvertYard',
    description:
      'Add page numbers to PDF files in your browser. Choose position, format, and font size. Batch 1,000 files — no uploads, no account.',
  },
}
