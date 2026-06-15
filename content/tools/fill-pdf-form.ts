import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'fill-pdf-form',
  title: 'Fill PDF Form',
  subtitle: 'Fill any PDF form in your browser. Flatten and download.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: 'What does "flatten" mean?',
      a: 'Flattening burns your answers into the page content and removes the interactive form fields. The result looks identical but the fields can no longer be edited in a PDF reader. This is the right choice for submitting or printing a completed form. If you need the recipient to be able to edit your answers, uncheck the flatten option.',
    },
    {
      q: 'What field types are supported?',
      a: 'Text fields, checkboxes, radio buttons, and dropdown lists. Signature fields are not supported — this tool fills data fields, not cryptographic signatures.',
    },
    {
      q: 'What if my PDF is password-protected?',
      a: 'Password-protected PDFs cannot be filled here. Remove the password first using your PDF reader (File → Properties → Security, or similar), then use this tool.',
    },
    {
      q: 'Is my PDF uploaded to your server?',
      a: 'No. Everything runs in your browser using the pdf-lib library. Your file never leaves your device. The form reading and filling both happen locally.',
    },
    {
      q: 'What is the difference between filling a form and signing a PDF?',
      a: 'Filling adds text to form fields. Signing adds a cryptographic signature that proves the document has not been altered since signing. This tool fills form fields; for legal e-signatures you need a dedicated signing tool.',
    },
  ],

  relatedTools: ['redact-pdf', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Fill PDF Form — ConvertYard',
    description: 'Fill any PDF form in your browser. Supports text fields, checkboxes, dropdowns, radio buttons. Flatten to lock answers. Free, local, no upload.',
  },
}
