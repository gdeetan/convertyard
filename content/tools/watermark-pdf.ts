import { watermarkPdf } from '@/lib/converters/pdf'
import { WatermarkPreview } from '@/components/watermark-preview/watermark-preview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'watermark-pdf',
  title: 'Watermark PDF',
  subtitle: 'Add text or image watermarks to PDFs. Live preview. Browser-only.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: watermarkPdf,
  previewPanel: WatermarkPreview,
  options: [
    {
      type: 'radio',
      name: 'watermarkType',
      label: 'Watermark type',
      choices: [
        { value: 'text', label: 'Text' },
        { value: 'image', label: 'Image' },
      ],
      default: 'text',
    },
    {
      type: 'radio',
      name: 'watermarkText',
      label: 'Text',
      choices: [
        { value: 'CONFIDENTIAL', label: 'CONFIDENTIAL' },
        { value: 'DRAFT', label: 'DRAFT' },
        { value: 'SAMPLE', label: 'SAMPLE' },
        { value: 'DO NOT COPY', label: 'DO NOT COPY' },
      ],
      default: 'CONFIDENTIAL',
      dependsOn: { name: 'watermarkType', value: 'text' },
    },
    {
      type: 'color-picker',
      name: 'textColor',
      label: 'Color',
      default: '#cc0000',
      dependsOn: { name: 'watermarkType', value: 'text' },
    },
    {
      type: 'radio',
      name: 'fontSize',
      label: 'Size',
      choices: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
      default: 'medium',
      dependsOn: { name: 'watermarkType', value: 'text' },
    },
    {
      type: 'image-upload',
      name: 'watermarkImage',
      label: 'Watermark image (PNG or JPG)',
      default: null,
      dependsOn: { name: 'watermarkType', value: 'image' },
    },
    {
      type: 'slider',
      name: 'opacity',
      label: 'Opacity',
      min: 5,
      max: 100,
      step: 5,
      default: 30,
      hint: 'Lower values make the watermark more subtle.',
    },
    {
      type: 'slider',
      name: 'rotation',
      label: 'Rotation (degrees)',
      min: 0,
      max: 90,
      step: 15,
      default: 45,
    },
    {
      type: 'radio',
      name: 'position',
      label: 'Position',
      choices: [
        { value: 'top-left', label: 'Top left' },
        { value: 'top-right', label: 'Top right' },
        { value: 'center', label: 'Center' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom-right', label: 'Bottom right' },
      ],
      default: 'center',
    },
    {
      type: 'radio',
      name: 'applyTo',
      label: 'Apply to',
      choices: [
        { value: 'all', label: 'All pages' },
        { value: 'first', label: 'First page only' },
      ],
      default: 'all',
    },
    {
      type: 'radio',
      name: 'layer',
      label: 'Layer',
      choices: [
        { value: 'above', label: 'Above content (visible)' },
        { value: 'behind', label: 'Behind content (subtle)' },
      ],
      default: 'above',
    },
  ],
  faq: [
    {
      q: 'What is the difference between text and image watermarks?',
      a: 'Text watermarks use a built-in font and let you set the color, size, and rotation. Image watermarks use a PNG or JPG you upload — PNGs with transparency work well for logos.',
    },
    {
      q: 'Can I use a logo as a watermark?',
      a: 'Yes. Upload a PNG file with a transparent background as the image watermark. The transparency is respected in the output PDF.',
    },
    {
      q: 'What does "Above content" vs "Behind content" do?',
      a: '"Above content" places the watermark on top of the page — always visible. "Behind content" places it underneath, so it shows in empty areas but may be obscured by existing page content.',
    },
    {
      q: 'Can I apply the watermark to only specific pages?',
      a: 'Currently you can apply to all pages or the first page only. Per-page range selection is on the roadmap.',
    },
    {
      q: 'Will the watermark affect text searchability?',
      a: 'No. The watermark is added as a visual layer. Existing text in the PDF remains fully searchable.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'Never. All watermarking runs in your browser using WebAssembly. Your PDFs never leave your device.',
    },
  ],
  relatedTools: ['protect-pdf', 'merge-pdf', 'compress-pdf', 'redact-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Watermark PDF — Add Text or Image Watermarks — ConvertYard',
    description: 'Add text or image watermarks to PDFs. Set position, opacity, rotation. Live preview. Batch process up to 1,000 PDFs in your browser. No upload required.',
  },
}
