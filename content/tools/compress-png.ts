import { imageCompress } from '@/lib/converters/image-compress'
import { ImageAnalyzerPanel } from '@/components/image/ImageAnalyzerPanel'
import { ImageCompressionPreview } from '@/components/image/CompressionPreview'
import { ImagePresetBar } from '@/components/image/ImagePresetBar'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-png',
  title: 'PNG Compressor',
  actionLabel: { verb: 'Compress', gerund: 'Compressing' },
  subtitle: 'Local-first PNG compression with a before/after slider. Batch up to 1,000 files, preserves transparency, nothing uploaded.',
  subtitlePosition: 'below-drop',
  bestFor: 'Shrink screenshots, UI exports, logos, and product PNGs before uploading to a website, CMS, or email — without exposing files to a third-party server.',
  category: 'image-editing',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.png',
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
      hint: '80 is the sweet spot — near-identical output at a fraction of the size. Drag the before/after slider to compare.',
    },
    {
      type: 'number-with-chips',
      name: 'maxSizeKb',
      label: 'Max file size',
      unitChoices: ['KB', 'MB'],
      defaultUnit: 'KB',
      chips: [
        { label: '50 KB',  valueKB: 50   },
        { label: '100 KB', valueKB: 100  },
        { label: '200 KB', valueKB: 200  },
        { label: '500 KB', valueKB: 500  },
        { label: '1 MB',   valueKB: 1024 },
        { label: '2 MB',   valueKB: 2048 },
        { label: '5 MB',   valueKB: 5120 },
      ],
      min: 0,
      default: 0,
      hint: '0 = no limit. The tool iterates quality, then dimensions (down to 50%), to hit the target.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: true,
      hint: 'Removes EXIF, color profiles, and text chunks. Small extra savings and removes GPS/software fingerprints.',
    },
    {
      type: 'toggle',
      name: 'paletteReduction',
      label: 'Palette reduction (8-bit PNG)',
      default: false,
      hint: 'Converts to 256-color indexed PNG. Great for screenshots, logos, and flat illustrations — huge extra savings.',
    },
  ],

  advancedOptions: [
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
      hint: 'Aspect ratio is preserved. Images smaller than the target are left untouched.',
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
      hint: 'Applied to the longest edge. Never upscales.',
    },
    {
      type: 'section-header',
      label: 'Color',
    },
    {
      type: 'toggle',
      name: 'convertToSrgb',
      label: 'Convert to sRGB',
      default: true,
      hint: 'Converts embedded ICC profile to sRGB — safer for web display, removes large ICC data.',
    },
  ],

  faq: [
    {
      q: 'Will compression affect the transparent background?',
      a: 'Nope. Transparency will be preserved by default unless you turn it off.',
    },
    {
      q: 'Are my files uploaded to a server?',
      a: 'No, all the files are compressed in your browser, and nothing is uploaded.',
    },
    {
      q: 'What’s the maximum file size?',
      a: 'There is no maximum file size. The limit is your computer’s memory. The more memory it has, the larger the file it can compress.',
    },
    {
      q: 'Does this reduce image dimensions?',
      a: 'By default, it won’t change image dimensions unless you specify it. Use the “Limit longest edge” option in advanced settings, or run the batch through the <a href="/image-resizer/">Image Resizer</a> afterward.',
    },
    {
      q: 'Is PNG compression lossless?',
      a: 'That would depend on the type of PNG file you open. For best results, compress graphic files such as logos or screenshots. Compressing photographs like landscape shots will yield lower compression (typically 10–30%). You might want to convert any PNG photograph to a <a href="/png-to-webp/">WebP</a> or <a href="/png-to-jpg/">JPG</a> file to save more.',
    },
    {
      q: 'Can I compress PNGs on my phone?',
      a: 'Yes. This tool works on mobile devices like smartphones because it’s browser-based. The before/after preview stacks vertically on smaller screens, so you can compare the original and compressed PNG files without pinch-zooming.',
    },
    {
      q: 'What if the compressed file is bigger than the original?',
      a: 'This happens if the original file is already optimized, so compressing it further may add more bytes. You may want to consider converting it to another format — browse the full set of <a href="/images/">image converter tools</a> to pick the right target (WebP, AVIF, JPG, and more).',
    },
  ],

  relatedTools: ['compress-image', 'compress-gif', 'png-to-webp', 'png-to-avif', 'image-resizer'],
  relatedArticles: ['compress-images-without-losing-quality', 'lossless-vs-lossy', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'Compress PNG — Batch, In Your Browser (Free)',
    description:
      'Compress up to 1,000 PNG files in your browser. Live before/after preview, target-size mode, keeps transparency. Nothing uploaded.',
  },
}
