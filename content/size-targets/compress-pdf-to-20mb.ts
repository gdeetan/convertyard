import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 20 * 1024 * 1024,
  targetLabel: '20 MB',
  slug: 'to-20mb',
  h1: 'Compress PDF to 20 MB',
  subhead:
    'Hit the corporate Outlook ceiling and meet government tender document upload limits.',
  intro: [
    'Microsoft Outlook and most email applications allow users to send a 20 MB file attachment without issues. Some companies may increase that maximum file size by upgrading to a corporate account, but most will not upgrade due to the additional costs.',
    'Government websites that allow companies to submit documents usually set a 20 MB file size limit. Scanned documents like property deeds, court documents, and long contracts, depending on their resolution and the volume of images included, will easily exceed this limit.',
    'These files need to be reduced to 20MB or less to send via email. Files less than 20MB in size will almost always reach their destination, while files larger than this will get blocked by email servers.',
  ],
  useCases: [
    {
      description:
        '**Corporate Outlook with a raised 20 MB limit.** The most common non-default corporate email attachment limit for Exchange or M365 accounts is 20 MB.',
    },
    {
      description:
        "**Submitting documents to Government portals.** India's GeM (Government e-Marketplace) and state e-procurement portals usually allow documents up to 20 MB to be uploaded for 'tender' submissions. These are documents that private firms submit for bidding.",
    },
    {
      description:
        '**Scanned documents (300 dpi)** that go over this threshold, like property registration documents, court filings, etc.',
    },
    {
      description:
        '**Architectural and engineering drawings:** PDF versions of AutoCAD drawings, building plans and design schematics often contain embedded raster images. These must be compressed to below 20MB in order to be uploaded to online regulatory portals.',
    },
  ],
  specificFaq: [
    {
      q: 'What is the difference between the 10 MB and 20 MB pages?',
      a: "They target different corporate email configurations. The 10 MB page targets the Microsoft Exchange default; the 20 MB page targets the most common raised limit. Use 10 MB if you don't know your recipient's mail server configuration. Use 20 MB if you know the recipient has raised their limit or you're submitting to a portal with an explicit 20 MB cap.",
    },
    {
      q: 'I need to submit to GeM but my document is 80 MB of scanned pages. Will 20 MB preserve readable detail?',
      a: 'For A4 text pages, yes — 80 MB compressed to 20 MB means roughly 75% reduction, achievable by reducing DPI from 600 to 150. Text remains clearly legible. Photographs and hand-drawn diagrams will be noticeably lower quality but still identifiable.',
    },
    {
      q: "Do I need to compress below 20 MB if I'm using a cloud sharing link instead of email?",
      a: 'No — cloud sharing (Google Drive, OneDrive, Dropbox links) has no practical file size limit for PDFs. The 20 MB target only matters when attaching the file directly to an email or a portal upload field with a stated limit.',
    },
  ],
  relatedSizes: ['to-10mb', 'to-25mb'],
  relatedVerticals: [],
}
