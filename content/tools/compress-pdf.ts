import { compressPDF } from '@/lib/converters/pdf'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
  slug: 'compress-pdf',
  title: 'Compress PDF',
  subtitle: 'Reduce PDF file size for email and sharing. Built for batches.',
  category: 'pdf',
  accepts: ['application/pdf'],
  acceptsExt: ['.pdf'],
  outputExt: '.pdf',
  convertFn: compressPDF,

  options: [
    {
      type: 'radio',
      name: 'level',
      label: 'Compression level',
      choices: [
        { value: 'low', label: 'Low (better quality)' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High (smallest files)' },
      ],
      default: 'medium',
    },
  ],

  faq: [
    {
      q: 'What gets removed or changed during compression?',
      a: 'At Medium and High levels, document metadata is stripped — title, author, subject, keywords, producer, and creator fields. The internal object structure is also rewritten using more efficient cross-reference streams. At Low level, only the structure is optimised; metadata is kept.',
    },
    {
      q: 'Will text and images inside my PDF look different after compression?',
      a: 'Text is never affected — it is lossless. Images embedded in your PDF are not re-rendered or re-compressed by this tool, so image quality is preserved exactly. The savings come from structural overhead, not pixel data.',
    },
    {
      q: 'How much smaller will my PDF get?',
      a: 'Results vary by document. PDFs heavy in structural overhead (many small objects, rich metadata) can shrink 10–30%. PDFs that are mostly scanned images may see little or no reduction because the image data itself is already compressed. For maximum compression of image-heavy PDFs, consider reducing image quality in the original before converting to PDF.',
    },
    {
      q: 'What is the email attachment size limit I should target?',
      a: 'Most email providers accept attachments up to 10MB (Gmail, Outlook) or 25MB (some others). If your PDF is still too large after compression, try splitting it into smaller sections first using Split PDF.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: 'Never. Compression runs entirely in your browser. Your PDFs never leave your device.',
    },
    {
      q: 'Can I compress a batch of PDFs at once?',
      a: 'Yes. Drop multiple PDFs at once and they are all compressed using the same settings. Each compressed PDF downloads individually or you can grab all of them as a ZIP.',
    },
  ],

  relatedTools: ['merge-pdf', 'pdf-to-jpg', 'split-pdf'],
  relatedArticles: [],

  meta: {
    title: 'Compress PDF — ConvertYard',
    description:
      'Compress PDF files for email and sharing in your browser. Batch up to 1,000 files — no uploads, no account. Choose Low, Medium, or High compression.',
  },
}
