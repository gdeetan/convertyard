import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 2 * 1024 * 1024,
  targetLabel: '2 MB',
  slug: 'to-2mb',
  h1: 'Compress PDF to 2 MB',
  subhead:
    'Compress multi-page scanned documents, academic submissions, and design portfolios to email-friendly size.',
  intro:
    "2 MB suits multi-page scanned documents that need to stay readable while being shareable by email or through academic portals. Thesis chapter submissions, loan application bundles, design portfolio PDFs, and insurance claim packages regularly need to stay under 2 MB. At this size, the compressor applies mild downsampling — enough to shed excess bulk from 300 dpi scans without degrading the visual quality you'd notice on screen or print.",
  useCases: [
    {
      label: 'Multi-page scanned document bundles',
      description:
        'Scanning a set of related documents (payslips, bank statements, certificates) into one PDF often results in 5–20 MB — compress the bundle to 2 MB for email or portal upload.',
    },
    {
      label: 'Academic thesis chapter submissions',
      description:
        'University research portals and supervisor email inboxes often have a 2 MB per-attachment limit for draft chapters submitted for review.',
    },
    {
      label: 'Portfolio uploads for design positions',
      description:
        'Design job applications often request portfolios as PDFs; hiring managers on Behance, LinkedIn, and email expect files under 2 MB for quick preview.',
    },
    {
      label: 'Loan application document package',
      description:
        'Home loan and vehicle loan applications require income proof, bank statements, and property documents — the full package is typically expected under 2 MB per document category.',
    },
    {
      label: 'Insurance claim submissions',
      description:
        'Online insurance portals for health, motor, and home insurance typically cap claim document uploads at 2 MB per file.',
    },
  ],
  specificFaq: [
    {
      q: 'Can a 20-page scanned document reach 2 MB without losing readability?',
      a: 'Yes, if the pages are text-heavy (printed text, typed forms). The compressor typically reduces 300 dpi scans to 150 dpi, which is still fully readable on screen and in print. Pages containing photographs or technical diagrams will be noticeably lower quality at this size.',
    },
    {
      q: 'I have a design portfolio with full-bleed images. Will 2 MB look acceptable?',
      a: 'For a portfolio viewed on screen, 2 MB spread across 8–12 design pages gives roughly 150–200 KB per image — enough for clear but not print-quality rendering. For digital review (not printing), this is generally acceptable.',
    },
    {
      q: 'Is there a difference between compressing from the main Compress PDF page vs. this page?',
      a: 'The underlying engine is identical. This page pre-fills the target size field with 2 MB and selects the most appropriate quality preset automatically. You could achieve the same result on the main Compress PDF page by entering 2048 KB manually.',
    },
  ],
  relatedSizes: ['to-1mb', 'to-5mb'],
  relatedVerticals: [],
}
