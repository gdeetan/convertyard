import { generateFavicons } from '@/lib/converters/favicon'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'favicon-generator',
  title: 'Favicon Generator',
  subtitle: 'Upload one image, get every favicon size: ICO, PNG, Apple touch icon, and web manifest. No upload to any server.',
  category: 'web',
  accepts: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
  acceptsExt: ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
  outputExt: '.zip',
  convertFn: generateFavicons,
  limitationNote: {
    summary: 'Recommend ≥512×512 source image',
    body: 'Smaller source images will be upscaled, which may cause blurriness at larger sizes. Use a square PNG or SVG of at least 512×512 pixels for best results. Non-square images are center-cropped automatically.',
  },
  faq: [
    {
      q: 'Why do I need so many favicon sizes?',
      a: 'Different platforms request different sizes: browsers use 16×16 and 32×32 for tabs, iOS uses 180×180 for "Add to Home Screen", Android uses 192×192 and 512×512 via the web manifest, and the ICO file bundles 16, 32, and 48 for older Windows/IE compatibility.',
    },
    {
      q: 'What is site.webmanifest?',
      a: 'The web manifest is a JSON file that tells Android browsers about your PWA (Progressive Web App) — including the icons to use when a user adds your site to their home screen. Link it from your HTML with <link rel="manifest" href="/site.webmanifest">.',
    },
    {
      q: 'Should I use ICO or PNG for my favicon?',
      a: 'Use both. The ICO file covers older browsers and Windows (which uses ICO for bookmark icons). Modern browsers prefer the PNG variants. The snippet file included in your download has the correct <link> tags for both.',
    },
    {
      q: 'What resolution should my source image be?',
      a: 'At least 512×512 pixels. Larger is fine — the generator will downscale. Square is ideal. Non-square images are center-cropped to a square before resizing.',
    },
    {
      q: 'What is in the ZIP output?',
      a: 'favicon.ico (16/32/48px), favicon-16×16.png, favicon-32×32.png, apple-touch-icon.png (180px), android-chrome-192×192.png, android-chrome-512×512.png, site.webmanifest, and FAVICON-SNIPPET.txt with ready-to-paste HTML and Next.js code.',
    },
    {
      q: 'Where do I put the files after downloading?',
      a: 'Place all the PNG and ICO files in the root of your public directory (e.g. /public/ in Next.js). The FAVICON-SNIPPET.txt file contains the exact code to add to your <head> or Next.js metadata config.',
    },
  ],
  relatedTools: ['image-resizer', 'image-compressor', 'image-cropper'],
  relatedArticles: [],
  meta: {
    title: 'Favicon Generator — ConvertYard',
    description:
      'Generate all favicon sizes from one image. Outputs ICO, PNG variants, site.webmanifest, and HTML snippet. No uploads — runs in your browser.',
  },
}
