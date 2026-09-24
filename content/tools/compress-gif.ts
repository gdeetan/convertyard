import { gifCompress } from '@/lib/converters/gif-compress'
import { GifCompressionPreview } from '@/components/gif/GifCompressionPreview'
import { GifInputPreview } from '@/components/gif/GifInputPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-gif',
  title: 'GIF Compressor',
  actionLabel: { verb: 'Compress', gerund: 'Compressing' },
  subtitle: 'Browser-based GIF Compressor. Nothing Uploads',
  subtitlePosition: 'below-drop',
  bestFor: 'Shrink animated or static GIFs to fit Slack, Discord, email, or CMS limits without uploading them to a third-party server.',
  category: 'image-editing',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.gif',
  convertFn: (files, opts, onProgress, onResult) => gifCompress(files, opts, onProgress, onResult),

  previewPanel: GifCompressionPreview,
  interactivePanel: GifInputPreview,

  howItWorks: [
    { label: 'Drop your files', desc: 'Drag and drop, click to browse, or paste from clipboard. Up to 1,000 files at once.' },
    { label: 'Choose settings', desc: 'Choose compression level, or a target size. If you need more control, use the advanced settings for more control.' },
    { label: 'Click Compress', desc: 'Everything runs in your browser via WebAssembly. GIF Compressor happens locally — nothing is uploaded.' },
    { label: 'Download', desc: 'Download files individually or grab all at once as a ZIP.' },
  ],

  options: [
    {
      type: 'radio',
      name: 'preset',
      label: 'Compression',
      choices: [
        { value: 'light',    label: 'Light — barely visible loss' },
        { value: 'balanced', label: 'Balanced — recommended default' },
        { value: 'strong',   label: 'Strong — 128-color palette' },
        { value: 'extreme',  label: 'Extreme — drops every other frame' },
      ],
      default: 'balanced',
      hint: 'Extreme changes the animation timing by dropping frames — check the preview.',
    },
    {
      type: 'number-with-chips',
      name: 'maxSizeKb',
      label: 'Or target file size',
      unitChoices: ['KB', 'MB'],
      defaultUnit: 'KB',
      chips: [
        { label: '256 KB', valueKB: 256  },
        { label: '512 KB', valueKB: 512  },
        { label: '1 MB',   valueKB: 1024 },
        { label: '2 MB',   valueKB: 2048 },
        { label: '5 MB',   valueKB: 5120 },
        { label: '8 MB',   valueKB: 8192 },
      ],
      min: 0,
      default: 0,
      hint: '0 = no limit. Binary-searches the lossy level over up to 6 passes to hit within 5% of target.',
    },
  ],

  advancedOptions: [
    {
      type: 'section-header',
      label: 'Manual controls',
    },
    {
      type: 'toggle',
      name: 'advanced',
      label: 'Use manual settings',
      default: false,
      hint: 'When on, the preset above is ignored — the sliders and dropdowns below take over.',
    },
    {
      type: 'slider',
      name: 'lossy',
      label: 'Lossy level',
      min: 0,
      max: 200,
      step: 5,
      default: 80,
      hint: '0 = lossless. 80 is the balanced default. Above 140 shows visible artifacts on gradients.',
    },
    {
      type: 'dropdown',
      name: 'colors',
      label: 'Palette size',
      choices: [
        { value: '256', label: '256 colors (full palette)' },
        { value: '128', label: '128 colors' },
        { value: '64',  label: '64 colors' },
        { value: '32',  label: '32 colors (posterized)' },
      ],
      default: '256',
      hint: 'Fewer colors means smaller files but visible banding on gradients.',
    },
    {
      type: 'radio',
      name: 'frameStride',
      label: 'Frame drop',
      choices: [
        { value: '1', label: 'Keep every frame' },
        { value: '2', label: 'Keep every 2nd frame (halves size)' },
        { value: '3', label: 'Keep every 3rd frame (thirds size)' },
      ],
      default: '1',
      hint: 'Drops frames evenly. Animation speed stays the same; motion looks choppier.',
    },
    {
      type: 'toggle',
      name: 'dither',
      label: 'Dither',
      default: false,
      hint: 'Adds noise to hide banding when using a reduced palette. Slightly larger files, smoother gradients.',
    },
  ],

  faq: [
    {
      q: 'What’s the difference between lossy, palette size, and frame drop?',
      a: 'Lossy compression removes visually similar pixel data across frames — the workhorse setting, and the one that produces the biggest savings with the least visible loss. Palette size reduces the total colors used across the whole GIF; lower counts make files smaller but cause banding on gradients. Frame drop removes evenly-spaced frames, which halves or thirds the file size at the cost of choppier motion. The Balanced preset uses lossy=80 with the full 256-color palette and no frame drop — the sweet spot for most GIFs.',
    },
    {
      q: 'Will my GIF still animate after compression?',
      a: 'Yes. Compression preserves all animation timing, loop count, and disposal methods. The output plays back at exactly the same speed as the original. The only preset that changes motion is Extreme, which drops every other frame to shave file size — that trade-off is called out in the interface before you compress.',
    },
    {
      q: 'How much smaller will my GIFs get?',
      a: 'For animated GIFs at the Balanced preset, expect 40–70% file-size reduction with no visible quality difference. Static GIFs (single-frame) usually reduce 15–35%. Strong and Extreme presets can hit 80–90% but the loss becomes visible on gradients and skin tones. If you need more than 90% savings on an animated GIF, convert it to MP4 or WebP — those formats are 10–20× more efficient than the GIF container itself.',
    },
    {
      q: 'How many GIFs can I compress at once, and what’s the max size?',
      a: 'Up to 1,000 files per batch. Individual file size is limited only by your browser’s memory — in practice, GIFs above 200 MB may run slowly or fail on lower-end laptops. Files are processed in parallel up to your device’s CPU count (capped at 4 concurrent) to keep memory usage predictable.',
    },
    {
      q: 'Should I use MP4 instead of a compressed GIF?',
      a: 'If you’re embedding on a website or in an app that plays video, yes — MP4 is roughly 10× smaller than an optimized GIF at the same visual quality. The only reasons to keep the .gif extension are platform requirements (some chat apps, older CMSes, or email clients that don’t autoplay video). If either works, use the <a href="/gif-to-mp4/">GIF to MP4</a> tool instead of this one — the file will load faster and look better.',
    },
    {
      q: 'Why does my GIF look grainy after strong compression?',
      a: 'Two things cause visible artifacts: high lossy values (over 140) throw away too much inter-frame detail, so gradients get blocky. Small palette sizes (under 128 colors) cause color banding — smooth transitions turn into visible steps. Turning on Dither adds subtle noise that hides banding at the cost of a slightly larger file. Drop to a lower preset or reduce the lossy slider by 20–40 to fix the graininess.',
    },
    {
      q: 'Can I compress static (non-animated) GIFs?',
      a: 'Yes. Static GIFs use the same lossy and palette-reduction settings and typically shrink by 15–35%. Compression is less dramatic than for animated GIFs because there’s no cross-frame redundancy to exploit. If the static GIF has photographic content, converting to <a href="/gif-to-webp/">WebP</a> or JPG will produce much smaller files than keeping it as a GIF.',
    },
    {
      q: 'Are my GIFs uploaded to your servers?',
      a: 'No. Compression runs entirely in your browser using a WebAssembly build of gifsicle — the same tool most command-line optimizers use. Files never leave your device; the server delivers the tool’s code and nothing else. ConvertYard has no upload endpoint, no queue, and no way to store what you compress.',
    },
  ],

  relatedTools: ['gif-to-mp4', 'gif-to-webp', 'gif-to-png', 'compress-image', 'video-to-gif'],
  relatedArticles: ['compress-images-without-losing-quality', 'lossless-vs-lossy', 'how-browser-based-file-conversion-works'],

  meta: {
    title: 'Compress Animated GIF and Static GIF (Free)',
    description: 'Compress and optimize animated GIFs in your browser. Up to 1,000 files per batch. Lossy, color reduction, frame drop.',
  },
}
