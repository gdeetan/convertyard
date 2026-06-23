import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 300 * 1024,
  targetLabel: '300 KB',
  slug: 'to-300kb',
  h1: 'Compress PDF to 300 KB',
  subhead:
    'Meet the document upload limit for state PSC and banking exam portals. No server upload required.',
  intro:
    '300 KB is the cutoff for several state-level recruitment portals — UPPSC, BPSC, MPSC — and a number of banking exam certificate upload screens. It sits in a useful middle range: strict enough to require compression on most multi-page scans, but generous enough to preserve clean text and readable photographs. The compressor targets 270–300 KB, giving you a small buffer against portal-side rounding.',
  useCases: [
    {
      label: 'UPPSC exam application',
      description:
        'Uttar Pradesh Public Service Commission requires uploaded certificates and photo ID within 300 KB per document.',
    },
    {
      label: 'BPSC application document upload',
      description:
        "Bihar PSC's portal enforces the 300 KB cap on scanned educational certificates at time of registration.",
    },
    {
      label: 'MPSC document submissions',
      description:
        'Maharashtra PSC online applications cap supporting document uploads at 300 KB each.',
    },
    {
      label: 'Banking exam mark sheet uploads',
      description:
        'Post-IBPS-result document verification portals for some banks set 300 KB as the per-file ceiling.',
    },
    {
      label: 'College admission portal scanned transcripts',
      description:
        'Several state university and affiliated college admission portals require uploaded transcripts under 300 KB.',
    },
  ],
  specificFaq: [
    {
      q: 'Which specific state PSC portals require documents under 300 KB?',
      a: 'UPPSC, BPSC, MPSC, RPSC (Rajasthan), and MPPSC (Madhya Pradesh) have all used 300 KB limits at various stages. Limits vary by recruitment cycle, so always verify the current notification before applying.',
    },
    {
      q: 'My PDF has 5 pages and is originally 2 MB. Can it realistically reach 300 KB?',
      a: 'Yes, if the pages are scanned text documents. The compressor reduces image DPI, converts color pages to grayscale where helpful, and removes metadata. Five A4 text pages typically compress to under 300 KB without losing readability. Five pages of color photographs may not compress cleanly this small.',
    },
    {
      q: 'Can I merge multiple certificates into one PDF and still hit 300 KB?',
      a: "Two to three scanned A4 pages generally fit under 300 KB. Use ConvertYard's Merge PDF tool first, then compress the merged file to 300 KB here.",
    },
  ],
  relatedSizes: ['to-200kb', 'to-500kb'],
  relatedVerticals: ['uppsc', 'bpsc', 'mpsc', 'tnpsc', 'kpsc', 'nda-cds', 'capf-ssc-gd'],
}
