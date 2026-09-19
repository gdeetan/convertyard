import { pngToIco } from '@/lib/converters/ico'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'png-to-ico',
  title: 'PNG to ICO Converter',
  subtitle: 'Generate ICO favicons from PNG — choose which sizes to pack (16, 32, 48, 64, 128 px). No upload.',
  bestFor: 'Best for developers creating a favicon.ico from a square logo PNG.',
  category: 'images',
  accepts: ['image/png'],
  acceptsExt: ['.png'],
  outputExt: '.ico',
  convertFn: (files, opts, onProgress, onResult) => pngToIco(files, opts, onProgress, onResult),

  options: [
    {
      type: 'dropdown',
      name: 'sizes',
      label: 'ICO sizes',
      choices: [
        { value: '16,32,48,64,128', label: 'Full set (16–128 px)' },
        { value: '16,32,48',        label: 'Web favicon (16–48 px)' },
        { value: '32,64',           label: 'App shortcut (32, 64 px)' },
        { value: '128',             label: 'Large only (128 px)' },
      ],
      default: '16,32,48,64,128',
      hint: 'Choose which pixel sizes to pack into the ICO container.',
    },
  ],

  howItWorks: [
    {
      label: 'Drop your files',
      desc: 'Drag and drop, click to browse, or paste from clipboard. Up to 1,000 files at once.',
    },
    {
      label: 'Choose settings',
      desc: 'Choose an ICO size option that will match your needs.',
    },
    {
      label: 'Click Convert',
      desc: 'Files are converted in your browser and not uploaded to a server. So your PNG files are converted to ICO files locally.',
    },
    {
      label: 'Download',
      desc: 'Download files individually or grab all at once as a ZIP.',
    },
  ],

  faq: [
    {
      q: 'What sizes does the ICO file include?',
      a: 'The default output ICO contains all 5 sizes: 16×16, 32×32, 48×48, 64×64, and 128×128. You can control which sizes are included in the ICO file using the "ICO sizes" dropdown. Browser favicons are typically 16- 48px, Windows shortcuts are 32- 64px, and high-DPI displays, such as Macs, benefit from a 128px size.',
    },
    {
      q: 'My source PNG is not square — what happens?',
      a: 'Each size is rendered within a square canvas so the end result fills the edges of that canvas. So, for the best results, we highly recommend cropping your original PNG to a square before converting it to an ICO. The ConvertYard Image Cropper tool does a great job of this too and can be run as part of a single conversion process.',
    },
    {
      q: 'Can I use this to make a website favicon?',
      a: 'Yes. Just drop your square logo PNG into ConvertYard and then upload the generated favicon.ico to your website\'s root. As long as you also add a reference to the favicon in your HTML, most browsers will then pick up the favicon. For modern browsers, a 32×32 or 48×48 PNG favicon is also widely supported.',
    },
    {
      q: 'Can I convert 1,000 PNG files at once?',
      a: 'Yes. Just upload the different PNG versions for one icon, and ConvertYard will render one ICO file containing all 5 different resolutions for you. You can then download all results as a ZIP archive.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'Nothing uploads to any server. Everything is done locally in your browser, so nothing leaves your computer.',
    },
    {
      q: 'What is the ICO format and when do I need it?',
      a: 'ICO is a Microsoft container format that holds multiple resolutions of the same image. You need it for: website favicons (the classic favicon.ico), Windows application icons, and Windows shortcut icons. For Apple app icons or Android adaptive icons, PNG is typically preferred over ICO.',
    },
  ],

  relatedTools: ['ico-to-png', 'image-resizer', 'image-cropper', 'compress-image'],
  relatedArticles: ['how-browser-based-file-conversion-works', 'compress-images-without-losing-quality'],

  meta: {
    title: 'PNG to ICO Converter - Up to 1,000 per Batch',
    description:
      'Convert PNG files to ICO. Choose between a full ICO set (16 to 128 px), web favicons (16 to 48 px), app shortcut (32, 64 px), or large only (128 px). Nothing uploads. 100% Free.',
  },
}
