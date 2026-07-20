import { pdfToPptx } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'pdf-to-powerpoint',
  title: 'PDF to PowerPoint Converter',
  subtitle: 'Convert PDFs into PPTX presentations. Each page becomes a slide. Browser-only.',
  bestFor: 'Best for repurposing a PDF report into a slide deck you can present from PowerPoint.',
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
      q: 'Are my PDFs uploaded to a server during conversion?',
      a: 'No. PDF pages are rendered using WebAssembly in your browser and the PPTX is assembled locally. Your files never leave your device.',
    },
    {
      q: 'Can I edit the text in the slides after conversion?',
      a: 'No. Each slide is an image of your PDF page — the text is not editable in PowerPoint. For editable text, use PDF to Word first, then copy the content into PowerPoint slides manually.',
    },
    {
      q: 'Why are the slides images instead of editable text?',
      a: 'Converting PDF content to native PowerPoint objects (editable text boxes, shapes) requires reconstructing the document structure from scratch, which is unreliable for complex layouts. The image approach guarantees the slide looks exactly like the original PDF page.',
    },
    {
      q: 'What slide size should I use?',
      a: '16:9 is the modern widescreen format used by most projectors and screens. 4:3 is the legacy format — use it only if the venue requires it or you are inserting slides into an existing 4:3 presentation.',
    },
    {
      q: 'Why is my PPTX file very large?',
      a: 'Each slide embeds a full-resolution image of a PDF page. At 300 DPI, a single A4 page renders to roughly 2–5 MB as a JPEG. A 20-page PDF at 300 DPI produces a 40–100 MB .pptx file. Use 150 DPI to keep file sizes manageable for most presentations.',
    },
    {
      q: 'Can I open the PPTX in Google Slides?',
      a: 'Yes. Upload the .pptx to Google Drive and open it with Google Slides. The image slides are fully supported.',
    },
  ],
  relatedTools: ['pdf-to-jpg', 'pdf-to-png', 'pdf-to-word', 'merge-pdf'],
  relatedArticles: [],
  meta: {
    title: 'PDF to PowerPoint Converter — ConvertYard',
    description: 'Convert PDFs into PowerPoint PPTX presentations. Each PDF page becomes a slide. Browser-only. Batch convert up to 1,000 PDFs. No upload required.',
  },
}
