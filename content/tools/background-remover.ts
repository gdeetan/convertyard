import { removeBackgroundBatch } from '@/lib/converters/background-remover'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'background-remover',
  title: 'AI Background Remover',
  subtitle:
    'Remove image backgrounds with AI. Batch process your whole library. Runs entirely in your browser — images never upload.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '.png',
  convertFn: removeBackgroundBatch,

  warningFn: (files) => {
    if (files.length > 10) {
      return `Processing ${files.length} images will take several minutes. Modern laptops process each image in 2–5 seconds; older devices may take longer.`
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
      hint: 'Both formats preserve transparency. PNG has wider app support; WebP is 20–30% smaller.',
    },
  ],

  faq: [
    {
      q: 'How accurate is the AI background removal?',
      a: 'The remover now routes images through different local extraction paths. Portraits and photos use AI segmentation with a refine pass for hard cases, while flatter graphics can use a color-region extraction path instead. Accuracy is strongest on clear subjects and simple graphics; complex low-contrast scenes can still need manual touch-up.',
    },
    {
      q: 'Does it work on hair, fur, and fine details?',
      a: 'Often, yes. The tool now reruns difficult images on a tighter crop around the detected subject to improve hair, fur, and thin edges. Results are still best when the subject is reasonably well-lit and not the exact same color and texture as the background.',
    },
    {
      q: 'Does it work better on logos, stickers, and simple graphics now?',
      a: 'Yes, that is one of the main improvements. Flat graphics with consistent background colors can now bypass the portrait-oriented segmentation path and use a background-color extraction route instead, which is usually more reliable for logos, icons, illustrations, and sticker-style images.',
    },
    {
      q: 'How large is the AI model? Will it slow my browser?',
      a: 'The model is about 14 MB and downloads in seconds on your first visit, then stays cached. During inference, it runs on your CPU. Modern laptops process each image in 2–5 seconds. Older devices or phones may take 10–30 seconds per image — the page shows a per-image progress bar so you always know where things stand.',
    },
    {
      q: 'How long does each image take to process?',
      a: 'On a 2020+ laptop: 2–5 seconds per image. On older hardware or mobile: 10–30 seconds. Processing happens sequentially — one image at a time — to avoid overloading your device. There is no server timeout since everything runs locally.',
    },
    {
      q: 'What output format should I choose, PNG or WebP?',
      a: 'PNG is the safest choice — every app, website, and design tool supports it. WebP is 20–30% smaller and works in all modern browsers, but older software may not support it. Use PNG if you\'re unsure; switch to WebP if file size matters.',
    },
    {
      q: 'Are my images uploaded to any server?',
      a: 'Never. The AI model runs entirely in your browser using WebAssembly and ONNX Runtime. Your images never leave your device. ConvertYard\'s servers only deliver the page code and the AI model file on first load — after that, the model is cached locally.',
    },
    {
      q: 'Can I process 100+ images in one batch?',
      a: 'Yes, there is no hard limit. Drop as many files as you need. They process one at a time and download as a ZIP when done. For very large batches (100+ images), expect 5–30 minutes depending on your device. Leave the tab open — closing it will stop processing.',
    },
  ],

  relatedTools: ['image-upscaler', 'image-description', 'compress-image', 'image-resizer', 'alt-text-generator'],
  relatedArticles: [],

  meta: {
    title: 'AI Background Remover — ConvertYard',
    description:
      'Remove image backgrounds with AI in your browser. Batch process 100+ images, no uploads, no account needed. PNG output with transparent background.',
  },
}
