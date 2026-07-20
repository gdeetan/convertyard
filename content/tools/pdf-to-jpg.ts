import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-jpg',
  title: 'PDF to JPG Converter',
  subtitle: 'Export PDF pages as JPG images. Pick pages, preview quality.',
  bestFor: 'Best for creating image previews of PDF pages for web display or presentations.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.jpg',
  // This tool uses a custom page.tsx — convertFn is never called through ToolShell.
  convertFn: () => Promise.resolve([]),

  faq: [
    {
      q: 'Are my PDFs uploaded to your servers during rendering?',
      a: 'Never. Rendering happens entirely in your browser using WebAssembly. Your PDFs never leave your device.',
    },
    {
      q: 'What DPI should I choose?',
      a: '72 DPI is fine for web thumbnails or quick previews. 150 DPI works well for email, presentations, and most online uses. 300 DPI produces print-quality images for physical printing or professional workflows. Higher DPI means larger files and slower processing.',
    },
    {
      q: 'Will text in the PDF be readable in the exported JPGs?',
      a: 'Yes, as long as you use a sufficient DPI. At 150 DPI, standard body text is clearly legible. Small text like footnotes may need 200–300 DPI to remain sharp. JPEG compression can also soften fine text — use quality 85 or higher if text readability matters.',
    },
    {
      q: 'What is the difference between PDF to JPG and PDF to PNG?',
      a: 'JPG uses lossy compression — smaller files, suitable for photos and scanned documents. PNG uses lossless compression — larger files but every pixel is preserved exactly, with optional transparency. For most PDFs with text or mixed content, JPG at quality 85+ looks identical to PNG at a much smaller size.',
    },
    {
      q: 'Can I export only specific pages?',
      a: 'Yes. Expand any file to see its page thumbnails, then uncheck the pages you want to skip. Only checked pages are included in the download.',
    },
    {
      q: 'Why does my exported JPG look blurry or pixelated?',
      a: 'The DPI setting controls sharpness. If the output looks soft, increase DPI — 72 DPI is often too low for text-heavy pages. Also check that the quality slider is at 80 or above; low JPEG quality adds visible compression artifacts on text edges.',
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
