import type { ToolConfig } from '@/lib/types'

const noop = async (): Promise<[]> => []

export const config: ToolConfig = {
  slug: 'fill-pdf-form',
  title: 'Fill PDF Form',
  subtitle: 'Fill any PDF form in your browser. Flatten and download.',
  bestFor: 'Best for completing government or HR forms you received as a PDF.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: noop,

  faq: [
    {
      q: 'Does filling a PDF form upload it to a server?',
      a: 'No. Everything runs in your browser using the pdf-lib library. Your file — and anything you type into the fields — never leaves your device.',
    },
    {
      q: 'What does "flatten" mean and should I use it?',
      a: 'Flattening burns your answers into the page content and removes the interactive form fields. The result looks identical but the fields can no longer be edited. Use it when submitting or archiving a completed form. Leave it off if the recipient needs to edit your answers.',
    },
    {
      q: 'What field types are supported?',
      a: 'Text fields, checkboxes, radio buttons, and dropdown lists. Signature fields are not supported — this tool fills data fields, not cryptographic signatures.',
    },
    {
      q: 'What if my PDF has no fillable fields?',
      a: 'If the PDF was not created with interactive form fields — for example, it is a scanned image of a form — there are no fields to fill. You would need to use a drawing or annotation tool to place text on top of the image instead.',
    },
    {
      q: 'What if my PDF is password-protected?',
      a: 'Password-protected PDFs cannot be opened or filled here. Remove the password first using the Unlock PDF tool, then return to fill the form.',
    },
    {
      q: 'What is the difference between filling a form and signing a PDF?',
      a: 'Filling adds text to form fields. Signing adds a cryptographic signature that proves the document has not been altered since signing. This tool only fills data fields; legal e-signatures require a dedicated signing service.',
    },
  ],

  relatedTools: ['redact-pdf', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Fill PDF Form — ConvertYard',
    description: 'Fill any PDF form in your browser. Supports text fields, checkboxes, dropdowns, radio buttons. Flatten to lock answers. Free, local, no upload.',
  },
}
