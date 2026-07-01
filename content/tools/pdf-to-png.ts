import { pdfToPng } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-png',
  title: 'PDF to PNG Converter',
  subtitle: 'Export every PDF page as a high-resolution PNG — up to 600 DPI. Useful for thumbnails, slides, and image pipelines.',
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
      q: 'What DPI should I choose?',
      a: '72 DPI is fine for web thumbnails or quick previews. 150 DPI works well for email and presentations — clear and readable without large files. 300 DPI is print-quality, suitable for professional workflows. 600 DPI produces archival-quality images where every fine detail is preserved. No competing free tool offers 600 DPI — most cap at 150–200.',
    },
    {
      q: 'Why is the PNG file larger than the original PDF?',
      a: 'PDFs store content as vector instructions and compressed data. Rendering to PNG rasterizes those instructions into pixels — a 300 DPI render of an A4 page produces a 2480×3508 pixel image. The PNG stores every one of those pixels uncompressed (losslessly). A 1MB PDF can easily become a 15MB PNG at 300 DPI. If file size matters, use 150 DPI or choose PDF to JPG instead.',
    },
    {
      q: 'What does transparent background do?',
      a: 'When enabled, areas of the PDF with no content — typically the page background — become transparent in the PNG output instead of white. Useful for PDFs containing vector graphics or logos you want to composite onto other images.',
    },
    {
      q: 'Can I export only specific pages?',
      a: 'Yes. Set "From page" and "To page" to a range. For example, set both to 3 to export only page 3, or set From to 2 and To to 5 to export pages 2 through 5. Leave "To page" at 9999 to export all pages from your start point.',
    },
    {
      q: 'How is PDF to PNG different from PDF to JPG?',
      a: 'PNG uses lossless compression — every pixel is preserved exactly, and transparent backgrounds are supported. JPG uses lossy compression — smaller files, slight quality loss, no transparency. For PDFs with text or vector graphics, PNG is the better choice. For scanned photo-heavy documents, JPG at 85 quality looks identical at a much smaller size.',
    },
    {
      q: 'How does a multi-page PDF export?',
      a: 'Each page becomes a separate PNG file, named with the page number appended — for example, "report-page-1.png", "report-page-2.png". All pages download together in a single ZIP.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. All rendering happens in your browser via WebAssembly. Your PDFs never leave your device.',
    },
  ],

  relatedTools: ['pdf-to-jpg', 'compress-pdf', 'merge-pdf', 'jpg-to-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to PNG Converter — ConvertYard',
    description: 'Convert PDF pages to PNG images in your browser. Up to 600 DPI, transparent backgrounds, page range selection. Batch 1,000 files — no uploads, no account.',
  },
}
