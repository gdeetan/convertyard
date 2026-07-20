import { pdfToPng } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-png',
  title: 'PDF to PNG Converter',
  subtitle: 'Export every PDF page as a high-resolution PNG — up to 600 DPI. Useful for thumbnails, slides, and image pipelines.',
  bestFor: 'Best for extracting PDF pages as lossless images for design work or archival.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.png',
  convertFn: pdfToPng,

  options: [
    {
      type: 'slider',
      name: 'dpi',
      label: 'DPI',
      min: 72,
      max: 600,
      step: 1,
      default: 150,
      hint: '72 for screen previews · 150 for web/email · 300 for print · 600 for archival fidelity',
    },
    {
      type: 'toggle',
      name: 'transparent',
      label: 'Transparent background',
      default: false,
      hint: 'Preserve transparency in the PDF. Useful for vector graphics or logos on a transparent canvas.',
    },
    {
      type: 'number',
      name: 'pageFrom',
      label: 'From page',
      min: 1,
      default: 1,
      hint: 'First page to export (1-based)',
    },
    {
      type: 'number',
      name: 'pageTo',
      label: 'To page',
      min: 1,
      default: 9999,
      hint: 'Last page to export. Leave at 9999 to export all pages.',
    },
  ],

  faq: [
    {
      q: 'Are my PDFs uploaded to your servers during rendering?',
      a: 'Never. All rendering happens in your browser via WebAssembly. Your PDFs never leave your device.',
    },
    {
      q: 'Why is the PNG file larger than the original PDF?',
      a: 'PDFs store content as vector instructions and compressed data. Rendering to PNG rasterises those instructions into pixels — a 300 DPI render of an A4 page produces a 2480×3508 pixel image. The PNG stores every pixel losslessly. A 1MB PDF can easily become a 15MB PNG at 300 DPI. Use 150 DPI or PDF to JPG if file size matters.',
    },
    {
      q: 'What does transparent background do?',
      a: 'Areas of the PDF with no content — typically the page background — become transparent instead of white. This is useful for PDFs containing vector graphics or logos you want to composite onto a coloured background in another tool.',
    },
    {
      q: 'How is PDF to PNG different from PDF to JPG?',
      a: 'PNG uses lossless compression — every pixel is preserved exactly, and transparent backgrounds are supported. JPG uses lossy compression — smaller files, no transparency. For PDFs with text or line art, PNG is sharper at the same DPI. For scanned photo-heavy documents, JPG at quality 85+ looks the same at a fraction of the size.',
    },
    {
      q: 'Can I export only specific pages?',
      a: 'Yes. Set "From page" and "To page" to select a range. Set both to the same number to export a single page. Leave "To page" at 9999 to export from your start page to the end of the document.',
    },
    {
      q: 'Why would I use 600 DPI?',
      a: 'Archival workflows — where a scan must be reproduced at print quality — benefit from 600 DPI. It is also useful for extracting very small text or fine line art that looks blurry at 300 DPI. The output files are large (often 50–100 MB per page); only use 600 DPI when the detail genuinely requires it.',
    },
  ],

  relatedTools: ['pdf-to-jpg', 'compress-pdf', 'merge-pdf', 'jpg-to-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to PNG Converter — ConvertYard',
    description: 'Convert PDF pages to PNG images in your browser. Up to 600 DPI, transparent backgrounds, page range selection. Batch 1,000 files — no uploads, no account.',
  },
}
