import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 20 * 1024 * 1024,
  targetLabel: '20 MB',
  slug: 'to-20mb',
  h1: 'Compress PDF to 20 MB',
  subhead:
    'Hit the corporate Outlook ceiling and meet government tender document upload limits.',
  intro:
    "20 MB is the most common raised corporate Outlook limit and marks the upper boundary of what most recipients consider email-safe. Government tender portals (GeM, CPPP, state e-procurement) often set 20 MB per document as the ceiling for bid submissions. Large scanned legal documents — property records, court filings, multi-party contracts — frequently need to come down from 50–200 MB to a transmittable size, and 20 MB represents the upper boundary of what most email servers and portals accept without complaint.",
  useCases: [
    {
      label: 'Corporate Outlook with raised 20 MB limit',
      description:
        'Many organisations upgrade Exchange or M365 attachment limits to 20 MB. This is the most common non-default corporate email attachment ceiling.',
    },
    {
      label: 'Government tender and procurement document submissions',
      description:
        "India's GeM (Government e-Marketplace) and state e-procurement portals typically allow bid documents up to 20 MB per upload.",
    },
    {
      label: 'Large scanned legal documents',
      description:
        'Property registration documents, multi-party agreements, and court filings scanned at 300 dpi from thick paper files routinely exceed 100 MB and need to be compressed for portal submission.',
    },
    {
      label: 'Architectural and engineering drawings',
      description:
        'PDF exports of AutoCAD drawings, building plans, and engineering schematics with embedded raster content often need to stay under 20 MB for submission to regulatory portals.',
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
