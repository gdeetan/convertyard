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
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.csv',
  convertFn: noop,

  faq: [
    {
      q: 'What is alt text and why does it matter?',
      a: 'Alt text (alternative text) is a short description attached to an image in HTML. Screen readers read it aloud for visually impaired users. Search engines also use it to understand image content. Good alt text describes what\'s in the image concisely — typically one sentence.',
    },
    {
      q: 'What are the EAA and ADA alt text requirements?',
      a: 'The European Accessibility Act (EAA), which took effect June 2025, requires businesses to make their digital products accessible — including providing alt text for meaningful images. In the US, the ADA has been interpreted to require web accessibility for public-facing businesses. Both standards follow WCAG 2.1 Level AA, which mandates alt text for all non-decorative images.',
    },
    {
      q: 'How accurate is the AI-generated alt text?',
      a: 'The AI produces accurate descriptions for most common image types: product photos, portraits, illustrations, and scenes. It struggles with text-heavy images (infographics, screenshots) and highly abstract art. Always review the output before publishing — the tool gives you a strong first draft, not a final answer.',
    },
    {
      q: 'Should I edit the generated alt text before publishing?',
      a: 'Yes. AI-generated alt text is a starting point. Review each description to ensure it captures the intent of the image in your context. A product photo\'s alt text should include the product name and key attributes — the AI describes what it sees, but doesn\'t know your brand terms.',
    },
    {
      q: 'How many images can I process in one batch?',
      a: 'There is no hard limit. Drop as many images as you need. Processing happens one at a time — the page shows per-image progress. For 100 images, expect 5–20 minutes depending on your device. The CSV download is available as soon as any results are ready.',
    },
    {
      q: 'How long does each image take?',
      a: 'On a modern laptop: 2–8 seconds per image. On older hardware or mobile: 10–30 seconds. The AI model (~400 MB) downloads once on first visit and is cached locally — subsequent visits start immediately.',
    },
    {
      q: 'What format is the batch CSV download?',
      a: 'The CSV has two columns: filename and alt_text. You can open it in Excel, Google Sheets, or any spreadsheet app. The filename column matches your original filenames exactly, so you can join it with your CMS or asset library data.',
    },
    {
      q: 'Are my images uploaded to any server?',
      a: 'Never. The AI model runs entirely in your browser. Your images are processed locally using WebAssembly — they never leave your device. ConvertYard\'s servers only deliver the page code and the AI model on first load.',
    },
  ],

  relatedTools: ['background-remover', 'compress-image', 'image-resizer'],
  relatedArticles: ['alt-text-guide'],

  meta: {
    title: 'Alt Text Generator — ConvertYard',
    description:
      'Generate alt text for images with AI in your browser. Batch process 100+ images, export CSV for accessibility compliance. No uploads, no account needed.',
  },
}
