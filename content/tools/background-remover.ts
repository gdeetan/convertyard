import { removeBackgroundBatch } from '@/lib/converters/background-remover'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'background-remover',
  title: 'AI Background Remover',
  subtitle:
    'Remove image backgrounds with AI. Runs locally in your browser — images never upload.',
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
      q: 'How accurate is the AI background removal?',
      a: 'It works best when the foreground subject has a clear boundary from the background. Cluttered scenes, glass, smoke, motion blur, shadows, and low-contrast edges may still need cleanup.',
    },
    {
      q: 'Does it only work on portraits?',
      a: 'No. The v1 workflow is designed for people, products, vehicles, animals, buildings, signs, and other clear foreground subjects. Portrait-specialized segmentation is kept as a fallback path.',
    },
    {
      q: 'Can I choose the subject manually?',
      a: 'Not in v1. The tool automatically chooses the likely foreground and shows confidence warnings when a scene has several possible subjects.',
    },
    {
      q: 'How large is the AI model? Will it slow my browser?',
      a: 'The model loads only when you use the remover and is reused for the current browser session. Processing happens locally with WebAssembly/ONNX, so images never upload to our servers.',
    },
    {
      q: 'How long does each image take to process?',
      a: 'Clear images usually finish in a few seconds on a modern laptop. Older hardware, mobile browsers, and large images can take longer. Very large images may be rejected to avoid browser memory crashes.',
    },
    {
      q: 'What output format does it create?',
      a: 'The v1 tool exports PNG with an alpha channel so transparency works in design tools, websites, and common image editors.',
    },
    {
      q: 'Are my images uploaded to any server?',
      a: 'Never. The AI model runs in your browser. ConvertYard only serves the page and model files; your selected images stay on your device.',
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
