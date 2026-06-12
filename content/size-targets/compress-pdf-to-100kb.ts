import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 100 * 1024,
  targetLabel: '100 KB',
  slug: 'to-100kb',
  h1: 'Compress PDF to 100 KB',
  subhead:
    'Hit the exact 100 KB target most government and exam portals require. Entirely in your browser.',
  intro:
    "Many Indian government recruitment portals — UPSC, SSC, IBPS, NEET, JEE — accept document uploads only up to 100 KB. Generic compressors give you 'small' or 'medium' presets that often miss the mark. This page targets 100 KB exactly: the compressor runs iterative passes on your file until the output is between 90 KB and 100 KB, then stops. If your PDF can't be squeezed that small without breaking text, you'll see the closest achievable size and a clear note explaining why.",
  useCases: [
    {
      label: 'UPSC Civil Services application',
      description:
        'Photo and signature upload slots on the UPSC online recruitment portal are capped at 100 KB.',
    },
    {
      label: 'SSC CGL / CHSL application documents',
      description:
        'Scanned supporting documents attached during SSC form-filling must meet the 100 KB ceiling.',
    },
    {
      label: 'IBPS PO and Clerk application uploads',
      description:
        'IBPS bank exam forms require candidate photos and signature PDFs within a 100 KB limit.',
    },
    {
      label: 'NEET 2026 application certificate uploads',
      description:
        "NTA's NEET portal enforces strict per-document size caps, including the 100 KB threshold for scanned certificates.",
    },
    {
      label: 'Bank account opening via NSDL e-KYC',
      description:
        "NSDL's online e-KYC flow rejects document uploads above 100 KB at the browser validation step.",
    },
  ],
  specificFaq: [
    {
      q: 'Why do so many Indian portals require exactly 100 KB?',
      a: 'The 100 KB limit is a legacy threshold set when broadband speeds were inconsistent across India. Portals adopted it to ensure uploads completed reliably on slow connections and to constrain server storage costs. The limit has stuck because changing it would require re-testing every upload flow — so most portals simply keep it.',
    },
    {
      q: 'What happens if my PDF is already smaller than 100 KB?',
      a: 'The compressor detects this immediately and returns your original file untouched. Reprocessing a file that already meets the limit can only reduce quality without benefit.',
    },
    {
      q: 'My compressed file came out at 102 KB — will the portal still accept it?',
      a: 'Most portals check exact byte counts. 102 KB is 2% over the limit and will typically be rejected. Try enabling Aggressive compression mode and reducing image resolution. If the PDF is a scanned document, re-scanning at 150 dpi before compressing usually gets you under 100 KB.',
    },
    {
      q: 'Will compressing a PDF to 100 KB make the text unreadable?',
      a: 'Text in PDFs is vector data — it does not degrade under compression. Only embedded images (photos, scanned pages) lose quality. For a purely text-based PDF, 100 KB compression is lossless. For scanned documents, readability depends on original scan quality.',
    },
  ],
  relatedSizes: ['to-50kb', 'to-200kb', 'to-300kb', 'to-500kb'],
  relatedVerticals: ['upsc', 'ssc-cgl', 'ibps-po', 'neet'],
}
