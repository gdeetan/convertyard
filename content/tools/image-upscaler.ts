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
    const photoEnhance = Boolean(options.photoEnhance)
    const restoreFaces = Boolean(options.restoreFaces)
    return upscaleBatch(
      files,
      { scale, outputFormat, imageMode, photoEnhance, restoreFaces },
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
    body: 'On GPU browsers, photos at 4× run Real-ESRGAN general v3 (~5 MB). Illustrations, badges, and line art use Real-ESRGAN anime 6B (~18 MB) on WebGPU or WASM. Other browsers use Swin2SR for photos if WebGPU is unavailable. 2× photos always use Swin2SR. Optional Restore faces runs GFPGAN on detected faces after the upscale. Graphic / logo mode is Lanczos resize plus light sharpen — no neural net. A 4× result cannot exceed 8,192 px on a side. A 1,000×13,000 infographic is shrunk before upscaling — export those from the design file, or split them into shorter sections.',
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
      hint: '4× is the usual pick. 8× runs the 4× model, then Lanczos to 8×, and uses much more memory.',
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
        illustration: 'Real-ESRGAN anime 6B — still line art, badges, comics. WebGPU first, WASM if the GPU path is missing. Can halo small type; use Graphic / logo if that happens.',
        graphic: 'Lanczos resize plus light sharpen. No neural net. Use for wordmarks and UI if Illustration looks wrong.',
      },
    },
    {
      type: 'toggle',
      name: 'photoEnhance',
      label: 'Enhance (photo)',
      default: false,
      hint: 'Adds local contrast and edge-aware sharpening on photos. Skin, sky, and other flat areas stay untouched — only hair, eyes, and other edges get crisper. Slower. Ignored for Illustration and Graphic modes.',
    },
    {
      type: 'toggle',
      name: 'restoreFaces',
      label: 'Restore faces (photo)',
      default: false,
      hint: 'After the upscale, detects faces and runs GFPGAN on each one. Helps selfies, IDs, and old portraits. First use downloads a large extra face model (~340 MB), then caches it. Can look plastic on already-sharp photos. Ignored for Illustration and Graphic modes.',
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
      a: 'Nope, files aren’t uploaded to a third-party server; images are upscaled in the browser. This tool uses the Real-ESRGAN v3 script (around 5 MB cost on GPU) for upscaling photos, with Swin2SR as a backup. For illustrations, it uses Real-ESRGAN anime 6B (around 18 MB) and runs on WebGPU or WASM. For portrait images, it utilizes the GFPGAN script. Once the page loads, these models are cached in the browser, so you can upscale images even without an internet connection.',
    },
    {
      q: 'What do the Photo, Illustration, and Graphic actually do?',
      a: 'Photo: Uses Real-ESRGAN v3 (4× resolution) for photos, falling back to Swin2SR 2× if needed. Illustration: Uses Real-ESRGAN anime 6B for rendering still line art, badges, and comic pages on WebGPU or WASM. Graphic / logo: Simply uses Lanczos resampling and a tiny amount of unsharp masking. Auto-detect: Sends images with few colors / flat patches to the Illustration codepath. Restore faces is an additional pass with GFPGAN on photos only.',
    },
    {
      q: 'Is this better than a standard resize?',
      a: 'In short: yes. Standard upscaling will yield heavily blurred images, whereas an image upscaler will first reconstruct the image’s edges again. While still not being able to hold a candle to a corresponding desktop application (using even larger models and additional processing passes, e.g. for face restore or for noise stripping), it’s certainly much better than just upscaling.',
    },
    {
      q: 'How does this compare to Topaz or other desktop upscalers?',
      a: 'To be honest, this won’t match Topaz or any desktop upscaler since those use AI to regenerate blurry sections of the image. Topaz Photo AI and Gigapixel run full-precision models on your GPU - denoise, sharpen, face recovery, and then upsample. However, it works well to upscale a 600-pixel landscape image to a 2,400-pixel version without blurring it. I’ve tested it extensively on various photos and illustrations, and it matches other paid image upscaling websites. It works best for upscaling illustrations or graphics without stretching or pixelating the image.',
    },
    {
      q: 'Which scale should I pick?',
      a: '4× is best balance of quality and speed, followed by 2× (faster) and 3× (slightly faster than 4×, uses same 4× model, then Lanczos downsampled to 3×). 8× mode runs the 4× model followed by Lanczos upsampling to 8×. The illustration uses the 4× still-art model, then upsamples to 2×/3×/8× using Lanczos.',
    },
    {
      q: 'What types of images produce poor results?',
      a: 'Noisy or low-light images, and portraits with Restore faces disabled. Small text and logos in illustration mode can create halos – switch to Graphic/logo mode. Tall and wide images larger than 8,192 pixels in either dimension will be pre-shrunk to fit the browser’s canvas, resulting in a soft and blurry image.',
    },
    {
      q: 'Can I upscale a long infographic or full-page screenshot?',
      a: 'This depends on the infographic’s size. It pre-shrinks anything over 8,192 pixels. For best results, use an infographic smaller than 2,048 pixels.',
    },
    {
      q: 'What scale should I use for printing?',
      a: 'For example, a 500×500 pixel image scaled up 4× would result in a 2,000×2,000 pixel image, about 6×6 inches at 300 DPI, which is suitable for low-quantity printing. Please note that this upscaler will not be as good as what you get with Topaz tools. I’ve tried to make this upscaler as good as possible, but please let me know how it performs for you and any ideas for improvement. Email me here: hello @ convertyard . com.',
    },
    {
      q: 'What does Restore faces do?',
      a: 'This setting runs an extra pass after photo upscaling, uses a small detector to find faces in the image, and then GFPGAN refines the eyes, skin, and mouth in each crop. It’s great for recent selfies, ID photos, and old, worn portraits. The only images where you’d disable this and let the image upscale as-is are already very sharp images, and this feature can make them look very plastic and fake. See also: Illustration/Graphic Modes. The first use of this feature downloads and caches a ~340MB file to the browser cache (which is then reused for subsequent uses of this feature—no images are uploaded).',
    },
    {
      q: 'How many files can I process at once?',
      a: 'For the best results, do a batch of no more than 5 for the smaller 2x to 4x upscales. If you’re upscaling 8x, it’s best to do one image at a time.',
    },
  ],

  relatedTools: ['background-remover', 'compress-image', 'alt-text-generator', 'jpg-to-png'],
  relatedArticles: [],

  meta: {
    title: 'AI Image Upscaler - Enlarge, Sharpen & Restore Images 2x-8x',
    description:
      'Upscale images 2x, 3x, 4x, or 8x and sharpen edges in photos or illustrations. Optional face restore for portraits. Nothing Uploads. No signups.',
  },
}
