import { imageCompress } from '@/lib/converters/image-compress'
import { ImageAnalyzerPanel } from '@/components/image/ImageAnalyzerPanel'
import { ImageCompressionPreview } from '@/components/image/CompressionPreview'
import { ImagePresetBar } from '@/components/image/ImagePresetBar'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-image',
  title: 'Image Compressor',
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
        { value: '0',    label: 'Original' },
        { value: '1920', label: '1920px (Full HD)' },
        { value: '1280', label: '1280px (Web)' },
        { value: '800',  label: '800px (Thumbnail)' },
      ],
      default: '0',
      hint: 'Aspect ratio is always preserved.',
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
      a: 'By default, no. Unlike the Batch Image Resizer, this tool changes the file size by re-encoding at a lower quality setting. As long as you do not enable "Limit longest edge" in the Advanced settings, the width and height of the image will remain the same.',
    },
    {
      q: 'What quality setting should I use?',
      a: "For web use, typical values range from 75% to 85%. At 80%, you'll rarely see any difference from the original. Values below 60% will start to show compression artifacts in photographs. Values of 85% to 95% are better for logos, diagrams, and images containing text or hard edges.",
    },
    {
      q: 'Why does PNG compression look different from PNG?',
      a: "PNG is lossless and never degrades pixel information. Therefore, the quality slider for PNGs only controls how much effort the compression algorithm uses, so processing time and file size change slightly while visual quality stays nearly identical. For significant PNG size reduction, it's often more efficient to convert them to WebP.",
    },
    {
      q: 'How does target size compression work?',
      a: 'When a max file size is specified for file generation, the tool starts by reducing the image quality in steps of 10% (e.g. from the quality specified by the user to 20% and then stopping if the generated file is within the size specified by the user, otherwise it continues to reduce the quality in steps of 10% down to 20% quality and then, as long as the generated file is still too large, it reduces the image dimensions in steps of 10% down to 50% of the original size, and returns the smallest file generated even if the size specified by the user could not be exactly reached).',
    },
    {
      q: 'What is chroma subsampling, and should I change it?',
      a: "Color information can be subsampled to reduce an image's size, as most online images are cached as 4:2:0 JPEGs. The difference is invisible to 99% of online viewers, but for images with overlaid text, logos, or other graphics with sharp color transitions, 4:4:4 chroma subsampling can make a big difference and save an extra 15–25% in file size.",
    },
    {
      q: 'Why is "Strip metadata" on by default?',
      a: "Smartphone photos contain the GPS location where they were taken, the phone model, and even the settings used (e.g., whether flash was on) in their EXIF data. It's better to be safe than sorry and remove this when uploading publicly. You can switch this off in the options if you need it for archiving or other professional reasons.",
    },
    {
      q: 'Why does my image look softer at very small targets?',
      a: 'Very aggressive compression can also produce low-quality images that are smaller only in file size. This can result in visible artifacts at quality 20 and a loss of fine detail when resized to 50%. You can achieve better results by raising the target quality and accepting a larger output file, or by lowering compression and accepting a larger file size.',
    },
    {
      q: 'Are my images uploaded to your servers?',
      a: "No. The image compression runs in the browser, so nothing uploads to the server. Your file never leaves your device. Converyard delivers the tool's code through your browser.",
    },
  ],

  relatedTools: ['image-upscaler', 'image-cropper', 'image-resizer', 'jpg-to-webp', 'png-to-webp'],
  relatedArticles: ['compress-images-without-losing-quality', 'avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'Image Compressor - Compress JPG, WebP, AVIF, GIF and SVG Files for Free',
    description:
      'Compress JPG, PNG, WebP, AVIF, GIF, or SVG in batches up to 1,000 files in your browser. No signups, no uploads, no paywall.',
  },
}
