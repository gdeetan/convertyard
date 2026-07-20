import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'og-image-generator',
  title: 'OG Image Generator',
  subtitle:
    'Create a 1200x630 Open Graph image for social previews. Add your title, brand colors, logo, and export locally with no watermark.',
  bestFor: 'Best for marketers and developers creating shareable link previews for blog posts, product pages, or social campaigns.',
  category: 'web',
  accepts: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
  acceptsExt: ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
  outputExt: '.png',
  convertFn: async () => [],
  faq: [
    {
      q: 'What size should an OG image be?',
      a: 'Use 1200x630 pixels for the broadest compatibility. That 1.91:1 ratio works well for Facebook, LinkedIn, Slack, Discord, WhatsApp, and X summary_large_image cards.',
    },
    {
      q: 'Does this OG image generator upload my logo or text?',
      a: 'No. The editor renders everything in your browser with Canvas. Your title, brand colors, logo, and exported image are not uploaded to ConvertYard.',
    },
    {
      q: 'Which export format should I use?',
      a: 'PNG is the safest default for crisp text and logos. JPEG is smaller for photo-heavy cards. WebP is useful when your site pipeline already serves WebP assets.',
    },
    {
      q: 'How do I add the generated image to my site?',
      a: 'Download the image, host it on your site or CDN, then paste the generated og:image and twitter:image tags into your HTML head or framework metadata config.',
    },
    {
      q: 'Can I use the generated image commercially?',
      a: 'Yes. ConvertYard adds no watermark and claims no rights to your exported image. Make sure any uploaded logo, photo, or background asset is yours to use.',
    },
    {
      q: 'Why include text safe areas?',
      a: 'Social apps crop previews differently. Keeping important text away from the outer edge reduces clipping in compact previews, notifications, and embeds.',
    },
  ],
  relatedTools: ['favicon-generator', 'qr-code-generator', 'gradient-generator', 'color-picker', 'image-resizer'],
  relatedArticles: [],
  meta: {
    title: 'OG Image Generator — ConvertYard',
    description:
      'Create 1200x630 Open Graph images in your browser. Add brand colors, logo, templates, and copy-ready meta tags. No uploads.',
  },
}
