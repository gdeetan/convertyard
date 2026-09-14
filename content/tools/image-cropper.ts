import { imageCrop } from '@/lib/converters/image-crop'
import { CropBox } from '@/components/crop-box/crop-box'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'image-cropper',
  title: 'Batch Image Cropper',
  actionLabel: { verb: 'Crop', gerund: 'Cropping' },
  maxFiles: 20,
  subtitle: 'All images can be cropped individually. You can set pixel values exactly or select one of the predefined aspect ratios. I’ve limited the batches to 20 to prevent mobile devices from crashing when trying to crop a large 100+ image batch.',
  bestFor: 'Crop Individual Images – for small batches of product images or even exam specifications that require individual photos to be cropped differently.',
  category: 'image-editing',
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  acceptsExt: ['.jpg', '.jpeg', '.png', '.webp'],
  outputExt: '',
  convertFn: (files, opts, onProgress) => imageCrop(files, opts, onProgress),
  enablePresets: true,
  interactivePanel: CropBox,

  options: [
    {
      type: 'number',
      name: 'width',
      label: 'Output width (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: '0 = keep cropped size. Set to force exact output dimensions (e.g. 350 for UPSC).',
    },
    {
      type: 'number',
      name: 'height',
      label: 'Output height (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: '0 = keep cropped size.',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF, GPS, and camera data',
    },
  ],

  faq: [
    {
      q: 'Can I set a different crop for each image?',
      a: 'Yes. You can process up to 20 images in one batch. Each file will have its own crop area, which will be saved until you hit the Crop button. You can then process more files and even go back to previous files using the Prev / Next buttons above the crop area.',
    },
    {
      q: 'Why is the batch capped at 20 files?',
      a: 'Every image is cropped individually, so you have to actually see and frame every file. You can crop up to 20 images, but it would be a hassle to apply the same crop to hundreds of images. A special workflow for this would be nice, though.',
    },
    {
      q: 'How do I get an exact output size like 350×350 pixels for UPSC?',
      a: 'Set the aspect ratio to 1:1 (Square), then set the crop, and set the output dimensions to 350 in both the width and height fields. This resizes the cropped image to 350×350 pixels, regardless of the original image resolution. This is how you would crop and resize multiple UPSC Civil Services, NEET, JEE Main, or GATE photos.',
    },
    {
      q: 'Which aspect ratio should I use for exam photos?',
      a: 'Use 1:1 (Square) for UPSC Civil Services, NEET, JEE Main, and GATE exams, which require square passport-size photos. Use 3.5:4.5 for SSC CGL, IBPS PO, RRB, and most of the state PSC exams, which require a taller portrait passport-size photo (like a standard passport-size photo).',
    },
    {
      q: 'Does cropping change the file format?',
      a: 'JPGs remain as JPGs, PNGs remain as PNGs – only the dimensions will change. If you need to change to a completely different file format or compress after cropping, you can use the corresponding tool.',
    },
    {
      q: 'Can I undo a crop after clicking Crop?',
      a: 'NO! The original file remains unchanged, and you can crop it further. If you want to start over, you can click “Crop more files” or upload new originals and start cropping again. Even if you switch between files using “Prev” and “Next”, all previous crop settings will remain intact until you “Convert file”.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'No, nothing is uploaded on a server. Everything is processed inside the browser using WebAssembly. So you can crop photos with your face or private documents without risking theft or leaks.',
    },
  ],

  howItWorks: [
    {
      label: 'Drop your images',
      desc: 'Drag and drop, click to browse, or paste from clipboard. Up to 20 images per batch (JPG, PNG, or WebP).',
    },
    {
      label: 'Frame each file',
      desc: 'Use the Prev / Next buttons above the crop area to step through your images. Drag the box (or its edges and corners) to set a different crop for every file. Pick an aspect ratio preset if you need one.',
    },
    {
      label: 'Set output size (optional)',
      desc: 'Enter exact width and height in pixels to force a final size like 350×350 for UPSC. Leave both at 0 to keep the cropped dimensions.',
    },
    {
      label: 'Click Crop',
      desc: 'Everything runs in your browser via WebAssembly. Your files never leave your device.',
    },
    {
      label: 'Download',
      desc: 'Grab files individually or download the whole batch as a ZIP.',
    },
  ],

  relatedTools: ['image-resizer', 'compress-image', 'background-remover'],
  relatedArticles: [],

  meta: {
    title: 'Image Cropper - Crop Images Fast with this Free Tool',
    description:
      'Crop images free in your browser. Set a different crop for each file, or apply a preset aspect ratio. Handles up to 20 JPG, PNG, or WebP images per batch.',
  },
}
