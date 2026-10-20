import Link from 'next/link'
import { gifConvert, isAnimatedAvif } from '@/lib/converters/gif-convert'
import { GifCompressionPreview } from '@/components/gif/GifCompressionPreview'
import { AvifInputPreview } from '@/components/avif-to-gif/AvifInputPreview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'avif-to-gif',
  title: 'AVIF to GIF Converter',
  subtitle:
    'Convert animated AVIF to a looping GIF — frame rate, width, and custom loop count. Convert batches of up to 1,000 files in your browser. Nothing uploads to an unknown server.',
  bestFor:
    'Best for sharing short animated AVIFs in Slack, GitHub, email, or anywhere GIF is still the defacto option.',
  category: 'images',
  accepts: ['image/avif'],
  acceptsExt: ['.avif'],
  outputExt: '.gif',
  convertFn: (files, opts, onProgress, onResult) => gifConvert(files, opts, onProgress, onResult),
  enablePresets: true,

  previewPanel: GifCompressionPreview,
  interactivePanel: AvifInputPreview,

  limitationNote: {
    summary: 'GIF is much larger than AVIF',
    body: 'GIF is capped at 256 colors per frame and uses an older compression scheme. Expect the output to be several times larger than the source AVIF. Lower the frame rate or output width to keep file sizes manageable.',
  },

  asyncWarningFn: async (files) => {
    const checks = await Promise.all(
      files.map(async (f) => ({ name: f.name, animated: await isAnimatedAvif(f) })),
    )
    const staticCount = checks.filter((c) => !c.animated).length
    if (staticCount === 0) return null
    const label =
      staticCount === files.length
        ? staticCount === 1
          ? 'This AVIF is a still image, not animated.'
          : `All ${staticCount} files are still AVIFs, not animated.`
        : `${staticCount} of ${files.length} files are still AVIFs, not animated.`
    return (
      <span>
        {label} A one-frame GIF is almost always larger and lower quality than the equivalent PNG or JPG. Try{' '}
        <Link href="/avif-to-png/" className="underline">AVIF to PNG</Link>
        {' or '}
        <Link href="/avif-to-jpg/" className="underline">AVIF to JPG</Link>
        {' instead.'}
      </span>
    )
  },

  options: [
    {
      type: 'slider',
      name: 'framerate',
      label: 'Frame rate (fps)',
      min: 5,
      max: 30,
      step: 1,
      default: 15,
      hint: '15fps is a good default. Lower = smaller file.',
    },
    {
      type: 'number',
      name: 'outputWidth',
      label: 'Output width (px)',
      min: 0,
      max: 1920,
      step: 1,
      default: 0,
      hint: '0 = keep original size. Smaller widths reduce GIF size quickly.',
    },
    {
      type: 'number',
      name: 'loop',
      label: 'Loop count',
      min: 0,
      max: 100,
      step: 1,
      default: 0,
      hint: '0 = infinite loop. 1 = play once.',
    },
  ],

  faq: [
    {
      q: 'Are my AVIF files uploaded to convert them?',
      a: "Nope, the conversion happens inside your browser through WebAssembly, so your files aren't uploaded to an unknown server. You can convert client files without the risk of a data breach.",
    },
    {
      q: 'Does this work for static (non-animated) AVIF files?',
      a: "Yes, it will work, but GIF files aren't the best for static graphic files. But if you proceed with the conversion, the AVIF becomes a single-frame GIF file. A better option would be to use an AVIF-to-PNG or AVIF-to-JPG converter instead.",
    },
    {
      q: 'Why is my GIF so much larger than the AVIF?',
      a: "It's because GIF uses an older compression method and is limited to 256 colors per frame, so how it's encoded is less efficient than an AVIF file. For example, an animated AVIF image that's 500 KB can balloon to a 5 MB GIF file. One way to reduce file size is to reduce the width, drop the frame rate to 10–12 FPS, or trim the loop count.",
    },
    {
      q: 'Why does my GIF look dithered or banded compared to the AVIF?',
      a: "The biggest issue is that GIF supports only 256 colors per frame, so if the animation has gradients, skin tones, or a lot of photographic imagery, there will be visible dithering or banding. The more modern AVIF format supports 10- and 12-bit color with wide gamuts (Display P3, REC 2020), but this won't transfer when it's converted to a GIF format. If color fidelity is a high priority, you can try converting to an animated WebP instead.",
    },
    {
      q: 'GIF vs animated WebP — which should I choose?',
      a: "An Animated WebP file is around 25 to 35% smaller than a GIF file, assuming that you use the same animation, and it supports full colors and isn't limited to 256 colors per frame. One advantage of GIF is its wider support if you need to upload animations to Slack, GitHub, or older email clients. WebP is the better option if you're uploading the animation to your own website, since it's much smaller and loads faster.",
    },
    {
      q: 'How many frames does the GIF keep?',
      a: 'It will keep all of them. Every frame you see in the animated AVIF file will be decoded and re-encoded to the GIF at the frame rate you set. If you set it at 60 FPS, the GIF file will be at 60 FPS.',
    },
  ],

  relatedTools: ['avif-to-png', 'avif-to-jpg', 'webp-to-gif', 'gif-to-mp4'],
  relatedArticles: [],

  meta: {
    title: 'AVIF to GIF Converter — ConvertYard',
    description:
      'Convert animated AVIF files to GIF in your browser. Set frame rate, width, and loop count. Nothing is uploaded. Convert batches of up to 1,000 files. 100% Free. No sign-up needed.',
  },
}
