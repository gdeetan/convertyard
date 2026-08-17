// This config is used for meta/FAQ/relatedTools only.
// The page uses a custom UI (not ToolShell) — see app/(tools)/alt-text-generator/page.tsx.
import type { ToolConfig } from '@/lib/types'

// Placeholder convertFn — never called (custom page handles inference directly)
const noop = async (): Promise<never[]> => []

export const config: ToolConfig = {
  slug: 'alt-text-generator',
  title: 'Alt Text Generator',
  subtitle:
    'Generate alt text for images with AI. Batch process 100+ images for accessibility compliance. Runs entirely in your browser.',
  bestFor: 'Best for accessibility audits, CMS batch uploads, or marketplaces that require alt text on every image.',
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.csv',
  convertFn: noop,

  faq: [
    {
      q: 'Are my images sent to an AI API to generate alt text?',
      a: 'No. The vision model runs locally in your browser using transformers.js. Your images never leave your device — not even on first load, once the model file has downloaded.',
    },
    {
      q: 'How accurate is the generated alt text?',
      a: 'The model describes what it sees — objects, scenes, and dominant colours — but it does not know your brand context or image intent. It struggles with text-heavy images like infographics and screenshots, and with abstract art. Always review generated alt text before publishing, especially for product images that need item names or SKU references.',
    },
    {
      q: 'Why does the first image take much longer than the rest?',
      a: 'The vision model (~100 MB) downloads on first use and is cached in your browser. Subsequent images in the same session run immediately from the cached model. On a modern laptop, each image takes 2–8 seconds after loading.',
    },
    {
      q: 'Can I batch-generate alt text for 100 images at once?',
      a: 'Yes. Drop all images and the tool processes them sequentially — one at a time, not in parallel. For 100 images, expect 5–20 minutes depending on your device. The CSV is downloadable as soon as the first results appear.',
    },
    {
      q: 'What format is the batch CSV export?',
      a: 'Two columns: filename and alt_text. The filename matches your original file names exactly, so you can join the CSV with your CMS or asset library to import alt text in bulk.',
    },
  ],

  relatedTools: ['image-description', 'background-remover', 'compress-image', 'image-resizer', 'transcription'],
  relatedArticles: ['alt-text-guide', 'import-alt-text-csv-to-cms'],

  meta: {
    title: 'Alt Text Generator — ConvertYard',
    description:
      'Generate alt text for images with AI in your browser. Batch process 100+ images, export CSV for accessibility compliance. No uploads, no account needed.',
  },
}
