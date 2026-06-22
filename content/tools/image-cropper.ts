import { imageCrop } from '@/lib/converters/image-crop'
import { CropBox } from '@/components/crop-box/crop-box'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-cropper',
  title: 'Batch Image Cropper',
  subtitle: 'Local-first image cropping. Built for batches.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '',
  convertFn: (files, opts, onProgress) => imageCrop(files, opts, onProgress),
  interactivePanel: CropBox,

  options: [
    {
      type: 'number',
      name: 'width',
      label: 'Output width (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: '0 = keep cropped size. Set to force exact output dimensions (e.g. 350 for UPSC).',
    },
    {
      type: 'number',
      name: 'height',
      label: 'Output height (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: '0 = keep cropped size.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF, GPS, and camera data',
    },
  ],

  faq: [
    {
      q: 'Does the same crop apply to every file in a batch?',
      a: 'Yes — the crop region is stored as a percentage of each image\'s dimensions, so it scales proportionally. A 1:1 crop set to 80% of the image on a 4000×3000 source produces 3000×3000 pixels, and the same region on an 800×600 source produces 480×480 pixels.',
    },
    {
      q: 'How do I get an exact output size like 350×350 pixels for UPSC?',
      a: 'Set the aspect ratio to 1:1 (Square), draw your crop region, then enter 350 in both the Output width and Output height fields. The tool crops first, then resizes the result to exactly 350×350 — regardless of the source file\'s resolution.',
    },
    {
      q: 'Which aspect ratio should I use for exam photos?',
      a: 'Use 1:1 (Square) for UPSC Civil Services, NEET, JEE Main, and GATE — these exams require square passport-format photos. Use Passport 3.5:4.5 for SSC CGL, IBPS PO, RRB, and most state PSC exams — these require a taller portrait rectangle (like a standard passport photo).',
    },
    {
      q: 'Does cropping change the file format?',
      a: 'No. A JPG stays a JPG, a PNG stays a PNG. Only the dimensions change. If you also need to convert the format or compress the file, use the relevant tool after cropping.',
    },
    {
      q: 'Can I undo a crop after clicking Convert?',
      a: 'Yes — your original files are never modified. Click "Convert more files" to start over, or simply drop the originals again and set a new crop region.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No. All cropping happens in your browser using WebAssembly. Your files never leave your device.',
    },
  ],

  relatedTools: ['image-resizer', 'compress-image', 'background-remover'],
  relatedArticles: [],

  meta: {
    title: 'Batch Image Cropper — ConvertYard',
    description:
      'Crop JPG, PNG, and WebP images in batches. Preset aspect ratios for UPSC, SSC, passport, and social media. Set exact output dimensions. All processing in your browser, no uploads.',
  },
}
