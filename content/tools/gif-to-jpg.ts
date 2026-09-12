import { gifToJpgConvert } from '@/lib/converters/gif-frames'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'gif-to-jpg',
  title: 'GIF to JPG Converter',
  subtitle: 'Convert static or animated GIFs to JPG. Extract the first frame or every frame. Drop 1,000 at once.',
  bestFor: 'Best for pulling a static thumbnail from an animated GIF, or extracting every frame as JPG stills.',
  category: 'images',
  accepts: ['image/gif'],
  acceptsExt: ['.gif'],
  outputExt: '.jpg',
  convertFn: (files, opts, onProgress, onResult) =>
      gifToJpgConvert(files, opts, onProgress, onResult),
  enablePresets: true,

  options: [
    {
      type: 'radio',
      name: 'frameMode',
      label: 'Frames to extract',
      choices: [
        { value: 'first', label: 'First frame only' },
        { value: 'all', label: 'All frames' },
      ],
      default: 'first',
      conditionalHints: {
        first: 'Outputs one JPG per GIF using the first frame. Static GIFs behave the same way.',
        all: 'Outputs every frame as a separate JPG, packaged as a ZIP per GIF (e.g. dance-frames.zip → frame-001.jpg, frame-002.jpg…).',
      },
    },
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1,
      max: 100,
      step: 1,
      default: 85,
      hint: '85 gives excellent quality — GIF first frames typically produce JPGs 5–20x smaller than the source GIF',
    },
    {
      type: 'color-picker',
      name: 'bgColor',
      label: 'Background color',
      default: '#ffffff',
      hint: 'GIF transparency is filled with this color in the output JPG',
    },
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: 'Downscales the longer edge. 0 = keep original size. Never upscales.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes any embedded metadata from the output JPG',
    },
  ],

  faq: [
    {
      q: 'Are my GIF files uploaded to convert them?',
      a: 'No. Conversion runs entirely in your browser using WebAssembly. Your files never leave your device.',
    },
    {
      q: 'Does this convert the whole animation or just one frame?',
      a: 'Both — you choose. "First frame only" outputs one JPG per GIF. "All frames" extracts every frame as a separate JPG and packages them into a ZIP per GIF (named like dance-frames.zip). JPG cannot store animation, so if you want the animation preserved as a single file, use the GIF to WebP tool instead.',
    },
    {
      q: 'How are the extracted frames named?',
      a: 'Each frame is saved as frame-001.jpg, frame-002.jpg, and so on inside a ZIP named after the source GIF (e.g. dance.gif produces dance-frames.zip). The numbers are zero-padded so the files sort in playback order in any file manager.',
    },
    {
      q: 'If I convert multiple GIFs with "All frames", how do I download the results?',
      a: 'Each GIF produces its own ZIP of frames. When you click Download all, ConvertYard bundles those per-GIF ZIPs into one master ZIP. Unzip the master to see one ZIP per source GIF, then unzip each to reach the individual JPG frames.',
    },
    {
      q: 'What happens to GIF transparency in the JPG output?',
      a: 'JPG does not support transparency. Any transparent areas in the GIF are filled with the background color you choose in the options — white by default. If your GIF has a transparent background, set the color that matches your use case before converting.',
    },
    {
      q: 'Why do GIF photos look worse than the original?',
      a: 'GIF is limited to 256 colors per frame. Photographs that start as GIFs already have significant color banding built in. Converting that first frame to JPG captures exactly what was in the GIF — including that banding. If the source GIF looks poor, the JPG will too.',
    },
    {
      q: 'Can I convert 1,000 GIF files at once?',
      a: 'Yes. Drop them all in and ConvertYard processes each one in your browser — no uploads, no server. Each GIF produces one JPG from its first frame. Download all results as a single ZIP.',
    },
  ],

  relatedTools: ['gif-to-webp', 'gif-to-mp4', 'gif-to-png', 'compress-image'],
  relatedArticles: ['compress-images-without-losing-quality', 'exif-data-whats-hiding-in-your-photo'],

  meta: {
    title: 'Convert  GIF to JPG - Batch up to 1,000 Files for Free',
    description:
      'Convert static or animated GIF to JPG file. Extract one frame or all the frames. Nothing uploads. No Signups. No Paywall.',
  },
}
