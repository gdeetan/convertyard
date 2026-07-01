import { pngToIco } from '@/lib/converters/ico'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-ico',
  title: 'PNG to ICO Converter',
  subtitle: 'Generate ICO favicons from PNG — packs 16, 32, 48, 64, and 128px layers into one file. No upload.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.ico',
  convertFn: (files, opts, onProgress) => pngToIco(files, opts, onProgress),

  faq: [
    {
      q: 'What sizes does the ICO file include?',
      a: 'The output ICO contains five sizes: 16×16, 32×32, 48×48, 64×64, and 128×128 pixels. These cover every common use case — browser favicons (16×16 and 32×32), Windows desktop shortcuts (48×48 and 64×64), and high-DPI displays (128×128). Modern browsers and operating systems automatically pick the most appropriate size.',
    },
    {
      q: 'My source PNG is not square — what happens?',
      a: 'Each size is drawn into a square canvas, so the image is stretched to fill. For best results, crop your PNG to a square before converting. ConvertYard\'s Image Cropper tool can do this in one step.',
    },
    {
      q: 'Can I use this to make a website favicon?',
      a: 'Yes. Drop your square logo PNG, convert it, and place the resulting favicon.ico in your website root. Most browsers will detect it automatically if you also add <link rel="icon" href="/favicon.ico"> to your HTML <head>. For modern browsers, a 32×32 or 48×48 PNG favicon is also widely supported.',
    },
    {
      q: 'Can I convert 1,000 PNG files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each one in your browser — no uploads, no server queue. Each PNG produces one ICO with all five sizes packed in. Download all results as a ZIP when done.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'Never. Conversion runs entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'What is the ICO format and when do I need it?',
      a: 'ICO is a Microsoft container format that holds multiple resolutions of the same image. You need it for: website favicons (the classic favicon.ico), Windows application icons, and Windows shortcut icons. For Apple app icons or Android adaptive icons, PNG is typically preferred over ICO.',
    },
  ],

  relatedTools: ['ico-to-png', 'image-resizer', 'image-cropper', 'compress-image'],
  relatedArticles: ['how-browser-based-file-conversion-works', 'compress-images-without-losing-quality'],

  meta: {
    title: 'PNG to ICO Converter — ConvertYard',
    description:
      'Convert PNG to ICO favicon in your browser. Packs 16×16, 32×32, 48×48, 64×64 and 128×128 into one .ico file. Batch convert 1,000 PNGs — no upload.',
  },
}
