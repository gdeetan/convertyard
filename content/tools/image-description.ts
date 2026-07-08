import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-description',
  title: 'AI Image Description Generator',
  subtitle: 'Generate product descriptions, captions, or accessibility text from photos. Export as CSV.',
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'image/heic'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.heic'],
  outputExt: '.csv',

  convertFn: async () => [],

  faq: [
    {
      q: 'How is this different from the Alt Text Generator?',
      a: 'Alt text is short (50–100 characters) and optimized for screen readers and SEO. Image descriptions are longer (1–3 sentences), human-readable, and suited for product listings, social captions, and accessibility documentation.',
    },
    {
      q: 'Can I edit descriptions before downloading?',
      a: 'Yes. Click any description to edit it inline before exporting. The CSV download uses your edited text.',
    },
    {
      q: 'What is the best mode for Amazon or Shopify product listings?',
      a: 'Use Detailed length. It generates 2–3 sentences describing the product, color, texture, and context — a solid starting point to edit and publish.',
    },
    {
      q: 'Does it understand complex images?',
      a: 'Florence-2 handles most product photos, nature scenes, and common objects well. Very dark, abstract, or heavily text-based images may produce generic descriptions.',
    },
    {
      q: 'How many images can I process at once?',
      a: 'Up to 200 images recommended. Florence-2 is memory-efficient (~260 MB, much lighter than BLIP-large). Processing time is ~3–10 seconds per image depending on your device.',
    },
    {
      q: 'Does it work offline?',
      a: 'Yes, after the first model download (~260 MB, cached). If you have already used the Alt Text Generator, the model is already cached — no additional download needed.',
    },
  ],

  relatedTools: ['alt-text-generator', 'image-upscaler', 'background-remover'],
  relatedArticles: [],

  meta: {
    title: 'AI Image Description Generator — Batch, Free, Private — ConvertYard',
    description:
      'Generate product descriptions, captions, or accessibility text from photos. Batch process 200 images, edit inline, export as CSV. No upload.',
  },
}
