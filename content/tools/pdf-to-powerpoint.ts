import { pdfToPptx } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-powerpoint',
  title: 'PDF to PowerPoint Converter',
  subtitle: 'Convert PDFs into PPTX presentations. Each page becomes a slide. Browser-only.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pptx',
  convertFn: pdfToPptx,
  limitationNote: {
    summary: 'Slides are image-based, not editable text',
    body: "Each PDF page is rendered as a high-resolution image and placed as a slide background. Text in the slides cannot be edited in PowerPoint. For editable text, use PDF to Word first, then copy into PowerPoint.",
  },
  options: [
    {
      type: 'radio',
      name: 'slideSize',
      label: 'Slide size',
      choices: [
        { value: '16:9', label: '16:9 (Widescreen — modern)' },
        { value: '4:3', label: '4:3 (Standard — legacy)' },
      ],
      default: '16:9',
    },
    {
      type: 'radio',
      name: 'dpi',
      label: 'Image quality',
      choices: [
        { value: '72', label: 'Standard (72 DPI — smaller file)' },
        { value: '150', label: 'High (150 DPI — recommended)' },
        { value: '300', label: 'Max (300 DPI — largest file)' },
      ],
      default: '150',
    },
  ],
  faq: [
    {
      q: 'Can I edit the text in the slides after conversion?',
      a: "No. Each slide is an image of your PDF page — the text is not editable. For editable text, use PDF to Word first, then copy the text into PowerPoint slides.",
    },
    {
      q: 'What DPI setting should I use?',
      a: '150 DPI is the recommended balance between file size and quality. 300 DPI produces sharper slides but very large .pptx files.',
    },
    {
      q: 'What slide size should I use?',
      a: '16:9 is the modern widescreen format used by most projectors and screens. Use 4:3 only for older projectors or legacy templates.',
    },
    {
      q: 'How many slides will the output have?',
      a: 'One slide per PDF page. A 10-page PDF becomes a 10-slide .pptx file.',
    },
    {
      q: 'Can I open the PPTX in Google Slides?',
      a: 'Yes. Upload the .pptx to Google Drive and open it in Google Slides.',
    },
    {
      q: 'Are my files uploaded anywhere?',
      a: 'Never. PDF pages are rendered using WebAssembly in your browser and the PPTX is assembled locally. Your files never leave your device.',
    },
  ],
  relatedTools: ['pdf-to-jpg', 'pdf-to-png', 'pdf-to-word', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'PDF to PowerPoint Converter — ConvertYard',
    description: 'Convert PDFs into PowerPoint PPTX presentations. Each PDF page becomes a slide. Browser-only. Batch convert up to 1,000 PDFs. No upload required.',
  },
}
