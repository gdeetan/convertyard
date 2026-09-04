import type { ToolConfig, ConversionResult } from '@/lib/types'
import { upscaleBatch, type UpscaleScale, type UpscaleOutputFormat, type ImageMode } from '@/lib/converters/image-upscaler'

export const config: ToolConfig = {
  slug: 'image-upscaler',
  title: 'AI Image Upscaler',
  subtitle:
    'Enlarge photos and illustrations 2×–8× in your browser. Logos can stay on Lanczos. No upload, no account.',
  // Long-form caveat is rendered as a collapsible "Important note" in the
  // page (see app/(tools)/image-upscaler/page.tsx) instead of the shared
  // bestFor line, so the warning icon draws the eye before the drop area.
  category: 'ai',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'],
  outputExt: '.jpg',

  convertFn: async (files, options, onProgress, onResult): Promise<ConversionResult[]> => {
    const scale = ((options.scale as string) ?? '4x') as UpscaleScale
    const outputFormat = ((options.outputFormat as string) ?? 'match') as UpscaleOutputFormat
    const imageMode = ((options.imageMode as string) ?? 'auto') as ImageMode
    return upscaleBatch(
      files,
      { scale, outputFormat, imageMode },
      () => {},
      (fileIndex: number, pct: number) => onProgress?.(fileIndex, pct),
      onResult
    )
  },
  enablePresets: true,

  warningFn: (files) => {
    if (files.length > 20) {
      return `Upscaling ${files.length} images one at a time will take a while. Large photos at 4× or 8× may run out of browser memory.`
    }
    return null
  },

  howItWorks: [
    {
      label: 'Drop your files',
      desc: 'Drag or click to open your files in the upscaler. If you’re upscaling a large file, I’d recommend doing one or two per batch so it finishes faster.',
    },
    {
      label: 'Choose settings',
      desc: 'Adjust quality, format, and other options to match your needs.',
    },
    {
      label: 'Click Convert',
      desc: 'Images upscale in the browser through WebAssembly. Nothing is uploaded.',
    },
    {
      label: 'Download',
      desc: 'Download files individually or grab all at once as a ZIP.',
    },
  ],

  limitationNote: {
    summary: 'Sharper than a normal resize — not a desktop upscaler',
    body: 'On GPU browsers, photos at 4× run Real-ESRGAN general v3 (~5 MB). Illustrations, badges, and line art use RealESR AnimeVideo v3 (~2.5 MB). Other browsers use Swin2SR for photos and Lanczos for illustrations. 2× photos always use Swin2SR. It does not denoise, recover faces, or match desktop tools such as Topaz Photo AI. Graphic / logo mode is Lanczos resize plus light sharpen — no neural net. A 4× result cannot exceed 8,192 px on a side. A 1,000×13,000 infographic is shrunk before upscaling — export those from the design file, or split them into shorter sections.',
  },

  options: [
    {
      type: 'radio',
      name: 'scale',
      label: 'Upscale factor',
      default: '4x',
      choices: [
        { value: '2x', label: '2× (fastest)' },
        { value: '3x', label: '3×' },
        { value: '4x', label: '4× (recommended)' },
        { value: '8x', label: '8× (slowest)' },
      ],
      hint: '4× is the usual pick. 8× is two model passes and uses much more memory.',
    },
    {
      type: 'radio',
      name: 'imageMode',
      label: 'Image type',
      default: 'auto',
      choices: [
        { value: 'auto', label: 'Auto-detect' },
        { value: 'photo', label: 'Photo (AI)' },
        { value: 'illustration', label: 'Illustration (AI)' },
        { value: 'graphic', label: 'Graphic / logo (Lanczos)' },
      ],
      conditionalHints: {
        auto: 'Photos use the photo model. Icons, badges, comics, and other 2D files use Illustration. Override if it guesses wrong.',
        photo: '4× uses Real-ESRGAN v3 on GPU browsers, Swin2SR otherwise. 2× always uses Swin2SR. Compressed JPEGs get a different 2× model when auto-detected.',
        illustration: 'RealESR AnimeVideo v3 on GPU browsers — linework and flat colour. Falls back to Lanczos if WebGPU is unavailable. Can halo small type.',
        graphic: 'Lanczos resize plus light sharpen. No neural net. Use for wordmarks and UI if Illustration looks wrong.',
      },
    },
    {
      type: 'dropdown',
      name: 'outputFormat',
      label: 'Output format',
      default: 'match',
      choices: [
        { value: 'match', label: 'Match input format' },
        { value: 'image/jpeg', label: 'JPEG' },
        { value: 'image/png', label: 'PNG' },
        { value: 'image/webp', label: 'WebP' },
      ],
    },
  ],

  faq: [
    {
      q: 'Are my images uploaded to run the upscaler?',
      a: 'No. Files are upscaled in your browser. Nothing is sent to a server. GPU browsers download Real-ESRGAN v3 (~5 MB) for photos and AnimeVideo v3 (~2.5 MB) for illustrations; other browsers use Swin2SR for photos and Lanczos for illustrations. Models are cached after the first load.',
    },
    {
      q: 'What do the Photo, Illustration, and Graphic actually do?',
      a: 'Photo: Runs Real-ESRGAN v3 at 4× resolution (Swin2SR 2× as a fallback). Illustration: Runs Real-ESR AnimeVideo v3 to better handle line art, badges, comics, etc. Graphic / logo: Lanczos resampling + a tiny amount of unsharp masking. Auto-detect: Sends few-color / flat-patch images to be handled by Illustration.',
    },
    {
      q: 'Is this better than a standard resize?',
      a: 'Short answer: yes. Standard upscaling will result in blurry images without the additional processing. An image upscaler reconstructs the edges. It won’t be as sharp as desktop tools that use larger models and don’t have face-recovery passes or noise-stripping.',
    },
    {
      q: 'How does this compare to Topaz or other desktop upscalers?',
      a: 'Honestly, it won’t match Topaz or any desktop upscaler, but based on my testing, it does a decent job at upscaling images and graphics without stretching and blurring them. It does not match them. Topaz Photo AI and Gigapixel run several full-precision models on your GPU — denoise, sharpen, face recovery, then upscale. Run this tool on a desktop for the best results; the mobile version has a memory limit.',
    },
    {
      q: 'Which scale should I pick?',
      a: 'The best balance would be the 4× option. If you need faster results, use the 2× mode. The 3× is slightly faster than the 4× and yields a similar result, since it uses the 4× model with Lanczos downsampling. The photo upscaler runs on Real-ESRGAN 4×. The illustration upscaler uses AnimeVideo 4×, then Lanczos, which is slower, creates larger files, and is likely to hit browser memory limits (especially on mobile).',
    },
    {
      q: 'What types of images produce poor results?',
      a: 'Typically portraits that have no recovery pass, noisy (or low-light) photographs, or old scanned pictures. Using the Illustration mode can result in a halo around logos. If that happens, switch to the graphic/logo option. Tall or wide photos or illustrations over 8,192 pixels are pre-shrunk to fit the browser canvas, resulting in a blurred output.',
    },
    {
      q: 'Can I upscale a long infographic or full-page screenshot?',
      a: 'Depends on the infographic’s size. Anything larger than 8,192 pixels will be pre-shrunk. Use images under 2,048 pixels for the best results.',
    },
    {
      q: 'What scale should I use for printing?',
      a: 'A 500 × 500-pixel image upscaled at 4× becomes 2,000 × 2,000 pixels, or around 6 × 6 inches at 300 DPI, which is good enough for a small print. This upscaler will not produce Topaz-level outputs, but I try to max out the output to get as close as possible. Let me know what your results are by emailing me at hello@convertyard.com; I’d love to hear from you.',
    },
    {
      q: 'How many files can I process at once?',
      a: 'Technically, you can do up to 1,000 files. But for the best results, and to reduce waiting time, do a batch of 10 images per to see how it comes out.',
    },
  ],

  relatedTools: ['background-remover', 'compress-image', 'alt-text-generator', 'jpg-to-png'],
  relatedArticles: [],

  meta: {
    title: 'Upscale an Image — ConvertYard',
    description:
      'Upscale photos and illustrations 2×–8× with on-device Real-ESRGAN. Runs in your browser — no upload, no account. Batch up to 1,000 files. PNG or JPG output.',
  },
}
