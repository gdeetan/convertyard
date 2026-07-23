import { pdfToText } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-text',
  title: 'PDF to Text Converter',
  subtitle: 'Extract searchable text from any PDF — one file per PDF or split by page. Preview before download.',
  bestFor: 'Best for copying text content from a PDF into a script, database, or document pipeline.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.txt',
  convertFn: pdfToText,
  enablePresets: true,

  options: [
    {
      type: 'toggle' as const,
      name: 'pageMarkers',
      label: 'Include page markers',
      default: true,
      hint: 'Adds "--- Page 1 ---" dividers between pages in the output',
    },
    {
      type: 'number' as const,
      name: 'pageFrom',
      label: 'From page',
      min: 1,
      default: 1,
    },
    {
      type: 'number' as const,
      name: 'pageTo',
      label: 'To page',
      min: 1,
      default: 9999,
      hint: 'Leave at 9999 to extract all pages',
    },
  ],

  limitationNote: {
    summary: 'When does this work best?',
    body: 'This tool extracts embedded text from the PDF. If your PDF is a scanned document (an image of a page rather than a text document), the output will be empty or minimal. For scanned PDFs, use PDF to Word instead — it includes OCR.',
  },

  faq: [
    {
      q: 'Are my PDFs uploaded to your servers during extraction?',
      a: 'Never. Text extraction runs entirely in your browser via WebAssembly. Your PDFs never leave your device.',
    },
    {
      q: 'Why is the output empty or near-empty?',
      a: 'The PDF is likely a scan — an image of a page with no embedded text layer. This tool only extracts text that is already encoded in the PDF structure. For scanned documents, use PDF to Word instead: it runs OCR automatically to recognise text from the image.',
    },
    {
      q: 'Will the text be in reading order?',
      a: 'Yes, for standard digital PDFs. MuPDF extracts text in the order it appears in the file, which matches reading order for most word-processor exports. Complex multi-column layouts — newspapers, academic papers — may have text extracted in an unexpected order.',
    },
    {
      q: 'What is the difference between PDF to Text and PDF to Word?',
      a: 'PDF to Text outputs a plain .txt file — no formatting, no images, just the words. It is ideal for feeding text into scripts or databases. PDF to Word outputs a .docx that attempts to preserve headings, bold, italics, and tables. Use PDF to Text for data pipelines; use PDF to Word when document structure matters.',
    },
    {
      q: 'Will special characters and non-Latin scripts be preserved?',
      a: 'Yes. The output is UTF-8 encoded, so accented characters, Arabic, Chinese, Japanese, mathematical symbols, and most Unicode text are preserved exactly — as long as those characters are embedded as text in the PDF, not as images.',
    },
    {
      q: 'Can I extract text from just certain pages?',
      a: 'Yes. Use the "From page" and "To page" options. Set both to the same number to extract a single page. Leave "To page" at 9999 to extract from your start page to the end of the document.',
    },
  ],

  relatedTools: ['pdf-to-word', 'pdf-to-jpg', 'split-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to Text Converter — ConvertYard',
    description: 'Extract text from PDF files in your browser. Preview before download, copy to clipboard. Page range selection. Files never upload to a server.',
  },
}
