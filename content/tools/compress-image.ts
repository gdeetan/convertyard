import { imageCompress } from '@/lib/converters/image-compress'
import { ImageAnalyzerPanel } from '@/components/image/ImageAnalyzerPanel'
import { ImageCompressionPreview } from '@/components/image/CompressionPreview'
import { ImagePresetBar } from '@/components/image/ImagePresetBar'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-image',
  title: 'Image Compressor',
  actionLabel: { verb: 'Compress', gerund: 'Compressing' },
  subtitle: 'Batch compress JPG, PNG, WebP, AVIF, GIF, and SVG image files with a live before/after slider that shows real-time comparisons of file-size savings and quality differences. Multiple image compression options, including quality, auto-orientation, and even an exact-size target per batch.',
  subtitlePosition: 'below-drop',
  bestFor: 'Reduce image size before publishing photos on a website, CMS, or email without opening a third-party application or paying for a subscription-based photo editor, saving you time and money.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg'],
  outputExt: '',
  convertFn: (files, opts, onProgress, onResult) => imageCompress(files, opts, onProgress, onResult),
  enablePresets: true,

  interactivePanel: ImageAnalyzerPanel,
  previewPanel: ImageCompressionPreview,
  presetBar: ImagePresetBar,

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: '80 is the sweet spot — visually identical at a fraction of the size. For PNG, this controls compression level.',
    },
    {
      type: 'number-with-chips',
      name: 'maxSizeKb',
      label: 'Max file size',
      unitChoices: ['KB', 'MB'],
      defaultUnit: 'KB',
      chips: [
        { label: '20 KB',  valueKB: 20   },
        { label: '50 KB',  valueKB: 50   },
        { label: '100 KB', valueKB: 100  },
        { label: '200 KB', valueKB: 200  },
        { label: '500 KB', valueKB: 500  },
        { label: '1 MB',   valueKB: 1024 },
        { label: '2 MB',   valueKB: 2048 },
      ],
      min: 0,
      default: 0,
      hint: '0 = no limit. Quality is reduced first; if still over target, dimensions shrink up to 50%.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: true,
      hint: 'On by default — most photos carry GPS location data you probably don\'t want to share publicly.',
    },
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Fixes rotation on phone photos using EXIF data.',
    },
  ],

  advancedOptions: [
    {
      type: 'section-header',
      label: 'Format',
    },
    {
      type: 'dropdown',
      name: 'chromaSubsampling',
      label: 'Chroma subsampling',
      choices: [
        { value: 'auto',  label: 'Auto (4:2:0 for photos)' },
        { value: '4:4:4', label: '4:4:4 — full colour detail' },
        { value: '4:2:0', label: '4:2:0 — smaller files (standard)' },
      ],
      default: 'auto',
      hint: 'JPEG only. 4:4:4 preserves sharp colour edges; 4:2:0 is the web standard and noticeably smaller.',
    },
    {
      type: 'toggle',
      name: 'progressive',
      label: 'Progressive encoding',
      default: false,
      hint: 'JPEG only. Images load blurry then sharpen — better perceived speed on slow connections.',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless',
      default: false,
      hint: 'WebP/AVIF only. Exact pixel reproduction — larger files, zero quality loss.',
    },
    {
      type: 'toggle',
      name: 'paletteReduction',
      label: 'Palette reduction',
      default: false,
      hint: 'PNG only. Reduces to 256-colour indexed mode — best for screenshots and diagrams with few colours.',
    },
    {
      type: 'section-header',
      label: 'Resize on compress',
    },
    {
      type: 'radio',
      name: 'maxDimension',
      label: 'Limit longest edge',
      choices: [
        { value: '0',      label: 'Original' },
        { value: '1920',   label: '1920px (Full HD)' },
        { value: '1280',   label: '1280px (Web)' },
        { value: '800',    label: '800px (Thumbnail)' },
        { value: 'custom', label: 'Custom width' },
      ],
      default: '0',
      hint: 'Aspect ratio is always preserved. Images smaller than the target are left untouched.',
    },
    {
      type: 'number',
      name: 'customMaxDimension',
      label: 'Custom width (px)',
      min: 1,
      max: 20000,
      step: 1,
      default: 1600,
      dependsOn: { name: 'maxDimension', value: 'custom' },
      hint: 'Applied to the longest edge, so portraits scale by height. Never upscales.',
    },
    {
      type: 'section-header',
      label: 'Metadata & colour',
    },
    {
      type: 'toggle',
      name: 'convertToSrgb',
      label: 'Convert to sRGB',
      default: true,
      hint: 'Converts embedded ICC colour profile to sRGB — safer for web display, removes large ICC data.',
    },
  ],

  faq: [
    {
      q: 'Does compression reduce image dimensions?',
      a: 'By default, it does not reduce image dimensions. This tool reduces the image size by re-encoding it at a lower quality. But I’ve added a feature that lets users resize the whole batch using a preset (limit longest side) or enter a custom width (height adjusts automatically), which streamlines the workflow since you don’t have to open a separate tool for this task.',
    },
    {
      q: 'What quality setting should I use?',
      a: 'For most web use cases, the acceptable range is between 75% and 85% before there’s noticeable degradation in image clarity. At 80%, there’s hardly any difference from the original image. If you’re trying to compress a file directly from a DSLR camera, you could resize it to get more savings. For certain lossless formats like PNG or WebP, you could compress it between 85 and 95% without much quality degradation, but always check the output first.',
    },
    {
      q: 'Why doesn’t PNG compression change how the image looks?',
      a: 'One reason is that PNG is a lossless format, meaning pixels can’t be altered during compression, so the output stays unchanged. I’ve tried lowering the quality to as low as 20%, and the image still doesn’t change much. Another downside of just compressing a PNG file is that there’s a cap on how many bytes you can shave off. The range (based on my tests) for savings is between 25% and 50%. Now, if you want a larger reduction, consider converting that PNG file into another, more web-friendly format like WebP or AVIF, which can lower the file size by over 90% (over 100% if you reduced the dimensions).',
    },
    {
      q: 'How does target size compression work?',
      a: 'If a maximum file size for file generation is specified, the tool first reduces the image quality in steps of 10% (e.g., from the quality specified by the user down to 20%). If the generated file is within the size limit, it stops there. Otherwise, it continues reducing quality in steps of 10% down to 20%, and then continues reducing the image dimensions in steps of 10% down to 50% of the original size, and returns the smallest generated file even if the specified size cannot be reached exactly.',
    },
    {
      q: 'What is chroma subsampling, and should I change it?',
      a: 'Subsampling color information is another method to reduce image size. The large majority of online images are cached as 4:2:0 JPEGs. To the eyes of 99% of online viewers, the difference is invisible. For images with overlaid text or logos and sharp color transitions, 4:4:4 chroma subsampling makes a huge difference and saves an additional 15–25% in file size.',
    },
    {
      q: 'Why is "Strip metadata" on by default?',
      a: 'The reason is two-fold. First, it reduces file size because the data stored in the EXIF file adds to it. The second reason is security. Photos taken with smartphones like the iPhone contain GPS location data, so if these photos are downloaded with the EXIF data intact, the individual who downloads it can run it through an <a href="/exif-viewer/">EXIF reader</a> and know where the photo was taken, the phone model, and other details that you may not want to be there online. One reason to keep the ‘metadata’ is if you want to keep the optimized photos locally in a personal archive.',
    },
    {
      q: 'Why does my image look softer at very small targets?',
      a: 'Pushing the quality slider lower or setting a small max file size makes the encoder throw away a lot of pixel data to hit the target. This shows up in two ways: smudged artifacts on the edges and text, and a loss of detail (meaning it looks blurred), making the image look soft.',
    },
    {
      q: 'Are my images uploaded to your servers?',
      a: 'Nope. The image compression process is done in the browser. So I can’t see them, store them, or access them in any way. Your files never leave your device — ConvertYard only delivers the tool’s code to your browser.',
    },
  ],

  relatedTools: ['image-upscaler', 'image-cropper', 'image-resizer', 'jpg-to-webp', 'png-to-webp'],
  relatedArticles: ['compress-images-without-losing-quality', 'avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'Image Compressor - JPG, PNG, WebP, AVIF, GIF, SVG (Free)',
    description:
      'Compress JPG, PNG, WebP, AVIF, GIF, or SVG in batches up to 1,000 files in your browser. No sign ups, nothing uploads, no paywall, no free tier limits.',
  },
}
