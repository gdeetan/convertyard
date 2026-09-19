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
      a: 'The default output includes all 5 sizes (16×16, 32×32, 48×48, 64×64, and 128×128 pixels). The "ICO sizes" dropdown is used to select which of these sizes will be included in the generated ICO file. Favicons for browsers are generally created in sizes of 16-48px, Windows shortcuts in sizes of 32-64px, and high-DPI displays like Macs need a 128px size for the best result.',
    },
    {
      q: 'My source PNG is not square — what happens?',
      a: 'Note that each icon size is rendered in a square canvas to ensure that the icon fills the edges of the canvas. Therefore, it is strongly recommended to first crop the original PNG file to a square before converting it to an ICO file. The ConvertYard Image Cropper tool is also available to be used as part of the conversion process to crop the original PNG file properly.',
    },
    {
      q: 'Can I use this to make a website favicon?',
      a: 'Yes, a PNG of your square logo can be easily converted and added to your website. Upload the generated favicon.ico file to the root of your website and add a reference to the favicon in your HTML files. Most browsers will then pick up the favicon. Modern browsers like Chrome, Firefox, Safari, and IE support PNG favicon sizes of 32×32 and 48×48.',
    },
    {
      q: 'Can I convert 1,000 PNG files at once?',
      a: 'Yes, you can convert up to 1,000 PNG files at once, and ConvertYard will render one ICO file with 5 different resolutions and download the files as a ZIP archive.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'Nothing is uploaded to any server since the files are converted in the browser. So it\'s safe to convert client files or any creative work.',
    },
    {
      q: 'What is the ICO format and when do I need it?',
      a: 'ICO is a Microsoft-developed file format that contains multiple resolutions of the same image. It\'s best utilized for favicons (that\'s the classic favicon.ico) or Windows software icons. It\'s basically made for anything running on Windows. If you\'re developing software for Apple or any iOS devices, PNG is the preferred format.',
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
