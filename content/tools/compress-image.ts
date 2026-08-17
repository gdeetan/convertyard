import { imageCompress } from '@/lib/converters/image-compress'
import { ImageAnalyzerPanel } from '@/components/image/ImageAnalyzerPanel'
import { ImageCompressionPreview } from '@/components/image/CompressionPreview'
import { ImagePresetBar } from '@/components/image/ImagePresetBar'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-image',
  title: 'Image Compressor',
  subtitle: 'Compress JPG, PNG, and WebP with a live before/after preview. Set an exact size target per file.',
  bestFor: 'Best for reducing image weight before publishing to a website, CMS, or email without touching the design team.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
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
      a: 'No by default. This tool only changes file size by re-encoding at a lower quality level. Width and height stay the same unless you enable "Limit longest edge" in Advanced settings. For specific pixel dimensions, use the Batch Image Resizer.',
    },
    {
      q: 'What quality setting should I use?',
      a: 'For web images, 75–85 is the standard range. At 80, most viewers cannot see a difference from the original. Below 60, compression artifacts become visible in photos. For logos, diagrams, and images with text or sharp edges, use 85–95.',
    },
    {
      q: 'Why does PNG compression look different from JPG?',
      a: "PNG is a lossless format — it never degrades pixel data. The quality slider for PNGs controls the compression algorithm's effort level, not visual quality. A PNG at \"quality 50\" looks identical to one at \"quality 100\" — only the processing time and file size differ slightly. For significant PNG size reduction, consider converting to WebP.",
    },
    {
      q: 'How does target-size compression work?',
      a: 'When a max file size is set, the tool first reduces quality in steps of 10 (from your chosen quality down to 20). If the file is still over target at quality 20, it then reduces the image dimensions by 10% per step, stopping at 50% of the original size. The smallest file achieved is returned — even if the target could not be fully reached.',
    },
    {
      q: 'What is chroma subsampling and should I change it?',
      a: 'Chroma subsampling reduces colour detail to save space. 4:2:0 (the default) is used in 99% of JPEG images on the web and is invisible to most viewers. 4:4:4 preserves sharper colour edges, which matters for text overlaid on images, logos, or graphics with vivid colour transitions. The difference in file size is typically 15–25%.',
    },
    {
      q: 'Why is "Strip metadata" on by default?',
      a: 'Smartphone photos typically embed GPS coordinates, device model, and shooting conditions in EXIF data. When you share images publicly, this metadata travels with the file. Stripping it is the safer default. Turn it off in options if you need to preserve metadata for archival or professional workflows.',
    },
    {
      q: 'Why does my image look softer at very small targets?',
      a: 'Very aggressive compression requires both lower quality and smaller dimensions. At quality 20 the encoder introduces visible artifacts, and at 50% dimensions fine detail is lost. If sharpness matters more than file size, raise the target or accept a larger output file.',
    },
    {
      q: 'Are my images uploaded to your servers?',
      a: "Never. All compression runs entirely in your browser using WebAssembly. Your files never leave your device. ConvertYard's servers only deliver the tool's code — they never see your images.",
    },
  ],

  relatedTools: ['image-upscaler', 'image-cropper', 'image-resizer', 'jpg-to-webp', 'png-to-webp'],
  relatedArticles: ['compress-images-without-losing-quality', 'avif-vs-webp-vs-jpeg-2026', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'Compress Images — ConvertYard',
    description:
      'Compress JPG, PNG, and WebP images in bulk. Set quality or target file size. Batch up to 1,000 files — all processing in your browser, no uploads, no account.',
  },
}
