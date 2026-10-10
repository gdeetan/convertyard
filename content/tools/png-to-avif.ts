import { libvipsConvert } from '@/lib/converters/libvips'
import { AvifConversionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-avif',
  title: 'PNG to AVIF Converter',
  subtitle: 'PNG to AVIF format. Get the same quality with over a 90% reduction in file size. Convert your entire library without uploading anything to an unknown server.',
  bestFor: 'Best for front-end developers replacing PNG files with AVIF to cut file size so the page loads fast in modern browsers.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.avif',
  convertFn: (files, opts, onProgress, onResult) =>
      libvipsConvert(files, 'avif', opts, onProgress, onResult),
  enablePresets: true,

  howItWorks: [
    { label: 'Drop your files', desc: 'Drag and drop, click to browse, or paste from clipboard. Up to 1,000 files at once.' },
    { label: 'Choose settings', desc: 'Adjust quality, compression effort, and other options to match your needs.' },
    { label: 'Click Convert', desc: 'Everything runs in your browser via WebAssembly. PNG to AVIF Converter happens locally — no server involved.' },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],

  previewPanel: AvifConversionPreview,

  options: [
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
      hint: '0 = no limit. AVIF iterates quality downward, then shrinks dimensions (down to 50%) if needed. Best-effort — AVIF compression is non-linear.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF and color profile metadata — slightly smaller files.',
    },
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 70,
      hint: '70 gives excellent results for photos. Use lossless mode for logos and UI assets.',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Pixel-perfect quality — larger files, ignores the quality slider. Best for screenshots, logos, and UI.',
    },
    {
      type: 'slider',
      name: 'effort',
      label: 'Compression effort',
      min: 0,
      max: 9,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 9 = smallest file (slower). AVIF encoding is thorough — larger files may take a few seconds.',
    },
    {
      type: 'toggle',
      name: 'preserveTransparency',
      label: 'Preserve transparency',
      default: true,
      hint: 'Keeps the alpha channel. Turn off to flatten transparent pixels onto a solid background colour (smaller file).',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background colour',
      default: '#ffffff',
      dependsOn: { name: 'preserveTransparency', value: 'false' },
      hint: 'Shown behind the image once transparency is removed. Visible in the preview.',
    },
    {
      type: 'number',
      name: 'customMaxDimension',
      label: 'Max width (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: '0 = keep original dimensions. Applied to the longest edge. Aspect ratio is preserved; never upscales.',
    },
  ],

  derivedOptionsFn: (_files, options) => ({
    maxDimension: (options.customMaxDimension as number) > 0 ? 'custom' : 0,
  }),

  faq: [
    {
      q: 'How much smaller will my AVIF files be compared to PNG?',
      a: 'AVIF files are significantly smaller than PNG at the same dimensions. In my tests, they were consistently over 95% smaller with the default settings. I got the biggest savings from graphic images that have transparent backgrounds. Photographs get slightly lower savings, at around 85 to 95%, and that is without resizing the photo. The ConvertYard PNG to AVIF converter shows you potential savings in the preview windows (at least for the first three images), so you know how much smaller the file can become and see a preview of how it looks in AVIF format.',
    },
    {
      q: 'Should I use lossy or lossless mode for PNG to AVIF?',
      a: 'Here’s the formal guideline: use lossless mode for images that require pixel-perfect accuracy, like logos, icons, screenshots, UI mockups, and anything with text-heavy images. Use lossy mode for photographs, illustrations with gradients, or any photographic image. But you can also use lossy mode for text-heavy images at the default quality setting, and you won’t notice any quality loss. You can also preview the image before conversion.',
    },
    {
      q: 'Does AVIF support transparency like PNG?',
      a: 'Yes. AVIF files support alpha channel transparency like PNG and these will be preserved by default when you convert your files to AVIF. Every major browser is compatible with AVIF transparency.',
    },
    {
      q: 'What browsers support AVIF?',
      a: 'Chrome (v85+), Firefox (v93+), Edge (v121+), and Safari (v16.4+). That covers over 93% of global web traffic. For maximum compatibility, use a <picture> element with AVIF as the preferred source and PNG as the fallback.',
    },
    {
      q: 'Why does AVIF encoding take longer than WebP or PNG?',
      a: 'Since AVIF uses the AV1 codec that prioritizes maximum compression over speed, encoding a large PNG file to AVIF will take longer- around 2 to 10 times longer than a WebP file. If you want to speed up the conversion, reduce the effort slider between 0 and 2. On the flip side, AVIF files decode quickly, and these images load fast in browsers, which is the main reason you want to convert PNG files to this format.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Nope. Nothing is uploaded to a server. Everything runs directly in your browser using WebAssembly. Your PNG files don’t leave your device. How many files you can convert in a batch will depend on your processor speed and memory.',
    },
  ],

  relatedTools: ['avif-to-png', 'png-to-webp', 'jpg-to-avif'],
  relatedArticles: ['avif-vs-webp-vs-jpeg-2026', 'avif-browser-support', 'lossless-vs-lossy'],

  meta: {
    title: 'PNG to AVIF Converter',
    description:
      "Convert PNG files to AVIF to significantly reduced file size if you're uploading images to a website so it loads faster. Nothing uploads and it's free.",
  },
}
