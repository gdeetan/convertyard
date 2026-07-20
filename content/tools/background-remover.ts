import { removeBackgroundBatch } from '@/lib/converters/background-remover'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'background-remover',
  title: 'AI Background Remover',
  subtitle:
    'Remove image backgrounds with AI. Runs locally in your browser — images never upload.',
  bestFor: 'Best for product photographers, e-commerce sellers, and designers who need transparent-background images in bulk.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.png',
  convertFn: removeBackgroundBatch,

  warningFn: (files) => {
    if (files.length > 10) {
      return `Processing ${files.length} images will take several minutes. Large images may be rejected to protect browser memory.`
    }
    return null
  },

  options: [
    {
      type: 'radio',
      name: 'outputFormat',
      label: 'Output format',
      choices: [
        { value: 'png', label: 'PNG (transparent)' },
        { value: 'webp', label: 'WebP (transparent)' },
      ],
      default: 'png',
      hint: 'Both formats preserve transparency. The dedicated v1 UI exports PNG.',
    },
  ],

  faq: [
    {
      q: 'Are my images uploaded for background removal?',
      a: 'No. The segmentation model runs locally in your browser using WebAssembly/ONNX. Your images never leave your device — ConvertYard only serves the page and model files.',
    },
    {
      q: 'How accurate is the AI background removal?',
      a: 'It works best when the foreground subject has a clear, high-contrast boundary from the background. Subjects with fine hair, fur, translucent edges, glass, or smoke are harder to segment cleanly and may need manual cleanup in an image editor after export.',
    },
    {
      q: 'Does it only work on portraits?',
      a: 'No. The model handles people, products, vehicles, animals, buildings, and other clear foreground subjects. Portrait-specialised segmentation is kept as a fallback for close-up face shots.',
    },
    {
      q: 'What output format does it produce?',
      a: 'Always PNG or WebP — both support an alpha channel (transparency). JPEG does not support transparency, so it is not offered as an output format.',
    },
    {
      q: 'Why was my image rejected?',
      a: 'Very large images (typically above 4000×4000 px) may be rejected to prevent browser memory crashes. Resize the image first using the Batch Image Resizer, then remove the background.',
    },
  ],

  relatedTools: ['image-upscaler', 'image-description', 'compress-image', 'image-resizer', 'alt-text-generator'],
  relatedArticles: [],

  meta: {
    title: 'AI Background Remover — ConvertYard',
    description:
      'Remove image backgrounds with AI in your browser. No uploads, no account needed. PNG output with transparent background.',
  },
}
