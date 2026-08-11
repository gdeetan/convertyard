import { icoToPng } from '@/lib/converters/ico'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'ico-to-png',
  title: 'ICO to PNG Converter',
  subtitle: 'Extract every embedded PNG from an ICO file — 16×16 through 256×256. No upload, no software needed.',
  bestFor: 'Best for designers and developers who need to extract a high-resolution PNG from a Windows .ico file.',
  category: 'images',
  accepts: ['image/x-icon', 'image/vnd.microsoft.icon'],
  acceptsExt: ['.ico'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) => icoToPng(files, opts, onProgress, onResult),

  faq: [
    {
      q: 'Which size does this extract from the ICO?',
      a: 'The largest available size. ICO files are containers that hold multiple resolutions — typically 16×16, 32×32, 48×48, 64×64, and 128×128. This tool always picks the highest-resolution image, giving you the best starting point for editing or resizing.',
    },
    {
      q: 'Why would I convert an ICO to PNG?',
      a: 'Common reasons: editing an icon in Photoshop, Figma, or any tool that doesn\'t support ICO; using a Windows application icon as a web image; extracting a high-resolution version of an icon for print or large-format use; or converting a company logo extracted from a .exe into an editable PNG.',
    },
    {
      q: 'Can I batch convert ICO files?',
      a: 'Yes. Drop as many .ico files as you need. Each produces one PNG — the largest size from that ICO\'s container. Download all results as a ZIP.',
    },
    {
      q: 'What if my ICO file contains BMP data instead of PNG?',
      a: 'Older ICO files store images as BMP data rather than PNG. This tool handles both formats automatically — BMP-format ICO entries are converted to PNG via the browser\'s built-in canvas renderer, so the output is always a valid PNG regardless of how the ICO was built.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'Never. Everything runs in your browser. Your .ico files never leave your device.',
    },
  ],

  relatedTools: ['png-to-ico', 'image-resizer', 'png-to-webp', 'compress-image'],
  relatedArticles: ['how-browser-based-file-conversion-works', 'compress-images-without-losing-quality'],

  meta: {
    title: 'ICO to PNG Converter — ConvertYard',
    description:
      'Extract PNG from ICO files in your browser. Gets the largest size from multi-resolution .ico containers. Batch convert 1,000 ICOs — no upload.',
  },
}
