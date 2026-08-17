import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-description',
  title: 'AI Image Description Generator',
  subtitle: 'Generate product descriptions, captions, or accessibility text from photos. Export as CSV.',
  bestFor: 'Best for e-commerce teams writing product copy, social media managers captioning image batches, or docs teams needing image descriptions at scale.',
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'image/heic'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.heic'],
  outputExt: '.csv',

  convertFn: async () => [],

  faq: [
    {
      q: 'Are my images uploaded to generate descriptions?',
      a: 'No. The Florence-2 model runs locally in your browser via transformers.js. Your images are never sent to a server — all processing happens on your device.',
    },
    {
      q: 'How is this different from the Alt Text Generator?',
      a: 'Alt text is short (50–100 characters) and optimised for screen readers and SEO. Image descriptions are longer (1–3 sentences), human-readable, and suited for product listings, social captions, and accessibility documentation.',
    },
    {
      q: 'What is the best mode for Amazon or Shopify product listings?',
      a: 'Use Detailed length. It generates 2–3 sentences describing the product, colour, texture, and context — a solid starting point to edit before publishing.',
    },
    {
      q: 'What kinds of images produce poor descriptions?',
      a: 'Very dark images, images dominated by text (infographics, screenshots), abstract art, and images with multiple equal-prominence subjects tend to produce generic or inaccurate descriptions. The model describes visual content, not meaning — it cannot infer brand context.',
    },
    {
      q: 'How many images can I process at once?',
      a: 'Up to 200 images recommended. Florence-2 is memory-efficient (~260 MB). Processing is sequential — one image at a time — at roughly 3–10 seconds per image on a modern laptop.',
    },
    {
      q: 'Can I edit descriptions before exporting?',
      a: 'Yes. Click any description to edit it inline. The CSV download uses your edited text, not the original AI output.',
    },
  ],

  relatedTools: ['alt-text-generator', 'image-upscaler', 'background-remover'],
  relatedArticles: [],

  meta: {
    title: 'Describe an Image — ConvertYard',
    description:
      'Generate product descriptions, captions, or accessibility text from photos. Batch process 200 images, edit inline, export as CSV. No upload.',
  },
}
