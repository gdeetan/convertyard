import { imageCompress } from '@/lib/converters/image-compress'
import { ImageAnalyzerPanel } from '@/components/image/ImageAnalyzerPanel'
import { ImageCompressionPreview } from '@/components/image/CompressionPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-png',
  title: 'Compress PNG',
  actionLabel: { verb: 'Compress', gerund: 'Compressing' },
  subtitle: 'Local-first PNG compression with a before/after slider. Batch up to 1,000 files, preserves transparency, nothing uploaded.',
  subtitlePosition: 'below-drop',
  bestFor: 'Compress screenshots, UI documentation, logos, or product PNG files before uploading to your website or CMS, or sending via email, without exposing files to a third-party server.',
  category: 'image-editing',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.png',
  convertFn: (files, opts, onProgress, onResult) => imageCompress(files, opts, onProgress, onResult),
  enablePresets: true,

  interactivePanel: ImageAnalyzerPanel,
  previewPanel: ImageCompressionPreview,

  howItWorks: [
    { label: 'Drop your files', desc: 'Open/drog and drop, click to browse, up to 1,000 files at once. For large PNG files (over 20 MB) do batches of 100 to 200.' },
    { label: 'Choose settings', desc: 'Tweak the different options like target file size, strip metadata, or turn on the palette reduction to help get the size within the upload limits.' },
    { label: 'Click Compress', desc: 'Everything runs in your browser via WebAssembly. PNG Compressor happens locally — no server involved.' },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],

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
      hint: '0 = no limit. PNG is lossless — to hit a target the tool ramps DEFLATE effort, then reduces the palette, then shrinks dimensions (down to 50%).',
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
    {
      type: 'slider',
      name: 'paletteSize',
      label: 'Palette size (colors)',
      min: 16,
      max: 256,
      step: 1,
      default: 256,
      dependsOn: { name: 'paletteReduction', value: 'true' },
      hint: 'Fewer colors = smaller file, but gradients start to band. 256 is safe for logos and complex illustrations.',
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
      max: 20000,
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
    title: 'Compress PNG Files',
    description:
      'Compress PNG files in your browser, up to 1,000 image per batch. Reduce file size by over 80% for Free.',
  },
}
