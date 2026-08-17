import { pngToIco } from '@/lib/converters/ico'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-ico',
  title: 'PNG to ICO Converter',
  subtitle: 'Generate ICO favicons from PNG — choose which sizes to pack (16, 32, 48, 64, 128 px). No upload.',
  bestFor: 'Best for developers creating a favicon.ico from a square logo PNG.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.ico',
  convertFn: (files, opts, onProgress, onResult) => pngToIco(files, opts, onProgress, onResult),

  options: [
    {
      type: 'dropdown',
      name: 'sizes',
      label: 'ICO sizes',
      choices: [
        { value: '16,32,48,64,128', label: 'Full set (16–128 px)' },
        { value: '16,32,48',        label: 'Web favicon (16–48 px)' },
        { value: '32,64',           label: 'App shortcut (32, 64 px)' },
        { value: '128',             label: 'Large only (128 px)' },
      ],
      default: '16,32,48,64,128',
      hint: 'Choose which pixel sizes to pack into the ICO container.',
    },
  ],

  faq: [
    {
      q: 'What sizes does the ICO file include?',
      a: 'By default the output ICO contains five sizes: 16×16, 32×32, 48×48, 64×64, and 128×128 pixels. Use the "ICO sizes" dropdown to pack only the sizes you need. Browser favicons need 16–48 px; Windows shortcuts use 32–64 px; high-DPI displays benefit from 128 px.',
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
      'Pack a PNG into a multi-size ICO favicon — 16, 32, 48, 64, and 128 px in one file. Batch convert in your browser — nothing is uploaded. Site-ready icons.',
  },
}
