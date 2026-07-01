import { pdfToText } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-text',
  title: 'PDF to Text Converter',
  subtitle: 'Extract searchable text from any PDF — one file per PDF or split by page. Preview before download.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.txt',
  convertFn: pdfToText,

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
      q: 'Will the text be in reading order?',
      a: 'Yes, for standard digital PDFs. MuPDF extracts text in the order it appears in the file, which matches reading order for most documents created by word processors, PDF exporters, or report generators. Complex multi-column layouts may have text in a different order than expected.',
    },
    {
      q: 'What about scanned PDFs?',
      a: 'Scanned PDFs are images of pages, not text documents — this tool will return empty or near-empty output for them. For scanned PDFs, use the PDF to Word tool instead: it includes free OCR that reads the image and extracts the text.',
    },
    {
      q: 'Can I extract text from just certain pages?',
      a: 'Yes. Use the "From page" and "To page" options to set a page range. For example, set From 2 and To 4 to extract only pages 2 through 4. Leave "To page" at 9999 to extract through the end of the document.',
    },
    {
      q: 'What\'s the difference between PDF to Text and PDF to Word?',
      a: 'PDF to Text outputs a plain .txt file — no formatting, no fonts, no images. It\'s ideal when you just need the words. PDF to Word outputs a .docx file that attempts to preserve headings, bold, italics, and tables. Use PDF to Text for data pipelines and quick copy-paste; use PDF to Word when document formatting matters.',
    },
    {
      q: 'Will special characters and Unicode be preserved?',
      a: 'Yes. The output is UTF-8 encoded, so accented characters, non-Latin scripts, mathematical symbols, and emoji are preserved exactly as they appear in the PDF — as long as the PDF itself has those characters embedded as text (not as images).',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Text extraction runs entirely in your browser via WebAssembly. Your PDFs never leave your device.',
    },
  ],

  relatedTools: ['pdf-to-word', 'pdf-to-jpg', 'split-pdf', 'compress-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to Text Converter — ConvertYard',
    description: 'Extract text from PDF files in your browser. Preview before download, copy to clipboard. Page range selection. Files never upload to a server.',
  },
}
