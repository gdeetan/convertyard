import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'pdf-to-csv',
  title: 'PDF to CSV',
  subtitle: 'Extract tables from any PDF. One CSV per page, in your browser.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.csv',
  convertFn: noop,

  faq: [
    {
      q: 'What gets extracted into the CSV?',
      a: 'We extract the text content from each page and reconstruct rows and columns based on the position of text on the page. This works best on PDFs that were exported from Word, Excel, or a design tool — they have a real text layer with accurate positions. Scanned documents have no text layer and will produce empty CSVs.',
    },
    {
      q: 'Why does my CSV look wrong or jumbled?',
      a: 'PDF was not designed as a table format. Text positions are approximate, especially in PDFs with merged cells, rotated text, or unusual column layouts. If the output looks scrambled, the source PDF likely has a complex layout that does not map cleanly to rows and columns.',
    },
    {
      q: 'Can I extract just specific pages?',
      a: 'Yes. Set the "From page" and "To page" fields before clicking Extract. Only pages in that range will be processed and included in the download.',
    },
    {
      q: 'What is the output format?',
      a: 'You get one CSV file per page. If you extract a single page, you download a .csv file directly. If you extract multiple pages, you get a .zip file containing one .csv per page.',
    },
    {
      q: 'Is my PDF uploaded to your server?',
      a: 'No. Everything runs in your browser using WebAssembly. Your file never leaves your device. The text extraction and CSV generation both happen locally.',
    },
  ],

  relatedTools: ['pdf-to-text', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to CSV Converter — ConvertYard',
    description: 'Extract tables from any PDF as CSV files. One CSV per page, with preview. Free, local, no upload. Works in your browser.',
  },
}
