import { watermarkPdf } from '@/lib/converters/pdf'
import { WatermarkPreview } from '@/components/watermark-preview/watermark-preview'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'watermark-pdf',
  title: 'Watermark PDF',
  subtitle: 'Add text or image watermarks to PDFs. Live preview. Browser-only.',
  bestFor: 'Best for marking draft, sample, or confidential PDFs before distributing them.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: watermarkPdf,
  enablePresets: true,
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
      q: 'Are my PDFs uploaded to your servers during watermarking?',
      a: 'Never. All watermarking runs in your browser using WebAssembly. Your PDFs never leave your device.',
    },
    {
      q: 'Can someone remove the watermark from the output PDF?',
      a: 'A text watermark added above content can be removed by someone with PDF editing software, just like any PDF element. Watermarking is a deterrent, not a technical lock. For sensitive documents, combine watermarking with password protection.',
    },
    {
      q: 'What does "Above content" vs "Behind content" do?',
      a: '"Above content" places the watermark on top of the page — always visible regardless of what is on the page. "Behind content" places it underneath, so it appears in blank areas but is obscured by existing text and images.',
    },
    {
      q: 'Will the watermark make the PDF text unsearchable?',
      a: 'No. The watermark is added as a visual layer on top of the page. Existing text in the PDF remains fully searchable and selectable.',
    },
    {
      q: 'Can I use a company logo as a watermark?',
      a: 'Yes. Upload a PNG with a transparent background as the image watermark. The transparency is respected in the output PDF so the logo blends with the page content.',
    },
    {
      q: 'Can I apply the watermark to only specific pages?',
      a: 'Currently you can apply to all pages or the first page only. Per-page range selection is not yet available.',
    },
  ],
  relatedTools: ['protect-pdf', 'merge-pdf', 'compress-pdf', 'redact-pdf'],
  relatedArticles: [],
  meta: {
    title: 'Watermark PDF — Add Text or Image Watermarks — ConvertYard',
    description: 'Add text or image watermarks to PDFs. Set position, opacity, rotation. Live preview. Batch process up to 1,000 PDFs in your browser. No upload required.',
  },
}
