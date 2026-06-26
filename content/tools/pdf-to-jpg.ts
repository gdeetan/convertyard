import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-jpg',
  title: 'PDF to JPG Converter',
  subtitle: 'Export PDF pages as JPG images. Pick pages, preview quality.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.jpg',
  // This tool uses a custom page.tsx — convertFn is never called through ToolShell.
  convertFn: () => Promise.resolve([]),

  faq: [
    {
      q: 'Can I export only specific pages?',
      a: 'Yes. Expand any file to see its page thumbnails, then uncheck the pages you want to skip. Only checked pages are included in the download.',
    },
    {
      q: 'Can I preview what the output will look like before downloading?',
      a: 'Yes. Click any page thumbnail to open a full-resolution preview at your chosen DPI and quality settings. Change the DPI or quality controls to see the effect in real time.',
    },
    {
      q: 'What DPI should I choose?',
      a: '72 DPI is fine for web thumbnails or quick previews. 150 DPI is a good default for email attachments, presentations, and most online uses — clear and readable without large file sizes. 300 DPI produces print-quality images suitable for physical printing or professional workflows. Higher DPI means larger files and slower processing.',
    },
    {
      q: 'How does a multi-page PDF export?',
      a: 'Each selected page becomes a separate JPG file named with your original PDF name and the original page number — for example, page 3 of "report.pdf" exports as "report-page-3.jpg". All files download together in a single ZIP.',
    },
    {
      q: 'Will text in the PDF be readable in the exported JPGs?',
      a: 'Yes, as long as you use a sufficient DPI. At 150 DPI, standard body text is clearly legible. Small text (footnotes, captions) may need 200–300 DPI to remain sharp. JPEG compression can also soften fine text — use quality 85 or higher to preserve readability.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Rendering happens entirely in your browser using WebAssembly. Your PDFs never leave your device — no upload, no account.',
    },
    {
      q: 'What is the difference between PDF to JPG and PDF to PNG?',
      a: 'JPG uses lossy compression — smaller files, perfect for photos and scanned documents. PNG uses lossless compression — larger files, but every pixel is preserved exactly. For most PDFs containing text or mixed content, JPG at quality 85+ looks identical to PNG but at a fraction of the size.',
    },
  ],

  relatedTools: ['compress-pdf', 'merge-pdf'],
  relatedArticles: [],

  meta: {
    title: 'PDF to JPG Converter — ConvertYard',
    description:
      'Convert PDF pages to JPG images in your browser. Pick pages, preview quality before downloading. Batch convert — no uploads, no account, entirely local.',
  },
}
