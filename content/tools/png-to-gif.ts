import { gifConvert } from '@/lib/converters/gif-convert'
import { PngToGifPreview } from '@/components/tools/png-to-gif-preview'
import { PngToGifExplainer } from '@/components/png-to-gif/explainer'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-gif',
  title: 'PNG or (Animated) APNG to GIF Converter',
  subtitle: 'Convert static PNG files, Animated PNG files (or APNG) to a more webfriendly GIF format. It auto-detects animation and previews before conversion.',
  bestFor: 'Best for converting PNG or Animated PNG (or APNG) to more shareable GIF files. It auto-detects the animation before conversion.',
  category: 'images',
  accepts: ['image/png', 'image/apng', 'image/vnd.mozilla.apng'],
  acceptsExt: ['.png', '.apng'],
  outputExt: '.gif',
  resultMode: 'combined-output',
  convertFn: (files, opts, onProgress, onResult) => gifConvert(files, opts, onProgress, onResult),
  interactivePanel: PngToGifPreview,
  enablePresets: true,
  limitationNote: {
    summary: 'PNG transparency becomes binary in GIF',
    body: 'PNG supports full alpha transparency; GIF supports only binary transparency. Semi-transparent edges from anti-aliasing will be thresholded — logos on solid backgrounds convert cleanly, but soft shadows will have hard edges.',
  },
  options: [
    {
      type: 'slider',
      name: 'framerate',
      label: 'Frame rate (fps)',
      min: 1,
      max: 30,
      step: 1,
      default: 10,
      hint: 'For animated GIFs from multiple PNGs.',
    },
    {
      type: 'number',
      name: 'outputWidth',
      label: 'Output width (px)',
      min: 0,
      max: 1920,
      step: 1,
      default: 0,
      hint: '0 = keep original size.',
    },
    {
      type: 'number',
      name: 'loop',
      label: 'Loop count',
      min: 0,
      max: 100,
      step: 1,
      default: 0,
      hint: '0 = infinite loop.',
    },
    {
      type: 'slider',
      name: 'maxColors',
      label: 'Number of colours',
      min: 4,
      max: 256,
      step: 4,
      default: 256,
      hint: 'Smaller palette = smaller file, more banding. GIF max is 256.',
    },
  ],
  faq: [
    {
      q: 'Are my PNG files uploaded to convert them?',
      a: 'No. Conversion runs via ffmpeg.wasm entirely in your browser. Your files never leave your device.',
    },
    {
      q: 'What happens to PNG colours when converting to GIF?',
      a: 'GIF supports a <strong>maximum of 256 colors per frame</strong>, while PNG files often contain <strong>millions of colors</strong>. So we calculate a good 256-color palette for you and then use <strong>dithering</strong> to approximate the missing colors. <strong>Flat colored graphics and icons</strong> will look good. <strong>Photos and gradients</strong> will have visible banding.',
    },
    {
      q: 'Does GIF support transparency from PNG?',
      a: 'The GIF file can only have <strong>binary transparency</strong> (i.e., pixels are either fully transparent or fully opaque). PNG files contain <strong>full alpha channels</strong>, which are thresholded during conversion; thus, <strong>anti-aliased edges</strong> are converted to either fully transparent or fully opaque pixels. <strong>Clean solid-background logos</strong> are converted well, but <strong>soft shadows have harsh edges</strong>.',
    },
    {
      q: 'Can I create an animated GIF from multiple PNGs?',
      a: 'Yes. To create an <strong>animated GIF from PNG files</strong>, simply drop the PNGs on the GIF button <strong>in the order you want them to appear</strong>, and they will be played back as an animation, with each file as a <strong>single frame at the frame rate specified</strong>. Files are <strong>sorted alphabetically by name</strong>, so it&rsquo;s best to name the files in sequence (e.g., frame-001.png, frame-002.png, etc.).',
    },
    {
      q: 'Why is my GIF file larger than the original PNGs?',
      a: 'GIF uses the old <strong>LZW compression</strong>, which is a lot less efficient than PNG compression, especially for <strong>smooth gradients in high-resolution images with lots of color</strong>. To keep the GIF output within a reasonable size, <strong>reduce the output width or frame rate</strong>.',
    },
  ],
  howItWorks: [
    { label: 'Drop your files', desc: 'Drop and drop, click to browse, or paste from clipboard. Convert up to 1,000 per batch.' },
    { label: 'Choose settings', desc: 'Adjust frame rate (fps), output width, loop count, and number of colors' },
    { label: 'Click Convert', desc: 'Everything runs in your browser via WebAssembly. PNG or (Animated) APNG to GIF Converter happens locally — no server involved.' },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],
  relatedTools: ['jpg-to-gif', 'webp-to-gif', 'png-to-webp'],
  relatedArticles: [],
  meta: {
    title: 'Convert PNG or (Animated) APNG files to GIF - Nothing Uploads',
    description: 'Convert static PNGs or animated APNG files to GIF in your browser. Auto-detects animation, live preview, batch up to 1000 files. Nothing uploads.',
  },
  explainer: PngToGifExplainer,
}
