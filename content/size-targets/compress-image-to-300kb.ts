import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 300 * 1024,
  targetLabel: '300 KB',
  slug: 'to-300kb',
  h1: 'Compress Image to 300 KB',
  subhead:
    'UPSC document photo upper limit and a comfortable size for scanned A4 documents.',
  intro:
    "300 KB is the maximum allowed photo size on the UPSC online portal and a practical upper limit for scanned A4 document uploads on state recruitment sites. For photos, 300 KB is generous: even a high-quality passport portrait at 350×450 pixels compresses to well under 300 KB, so you are unlikely to need compression for photos destined for UPSC. Where 300 KB comes up as a real constraint is scanned certificates and mark sheets — a two-page colour scan can easily exceed this limit before compression. This compressor targets 270–300 KB, leaving a small buffer against portal-side rounding while maximising quality.",
  useCases: [
    {
      label: 'UPSC document photo upload (maximum)',
      description:
        'UPSC Civil Services and other UPSC recruitments accept candidate photos up to 300 KB. Uploading at or near the ceiling maximises photo clarity for hall ticket printing.',
    },
    {
      label: 'Scanned educational certificates',
      description:
        'Degree certificates, diplomas, and provisional certificates scanned for state PSC or central government portal uploads. A single A4 page scanned at 200 dpi in colour typically starts above 300 KB before compression.',
    },
    {
      label: 'Marksheet uploads',
      description:
        "Board marksheets and semester grade cards uploaded during UPSC and state government application verification stages. 300 KB preserves printed marks and college seals legibly.",
    },
    {
      label: 'Identity document uploads',
      description:
        'Scanned copies of Aadhaar, PAN card, voter ID, or driving licence uploaded to government portals for identity verification. 300 KB provides ample clarity for text and QR codes.',
    },
  ],
  specificFaq: [
    {
      q: 'My UPSC photo is only 80 KB. Should I not compress it at all?',
      a: "Correct — do not compress a photo that is already within the portal's range. Compressing an 80 KB photo to hit 300 KB would require adding data rather than removing it, which is impossible without artificially degrading then recompressing. Upload the 80 KB file as-is.",
    },
    {
      q: 'What is the difference between 200 KB and 300 KB for a scanned certificate?',
      a: "At 200 KB, small printed text (8pt font, footnotes, serial numbers) may show light JPEG ringing. At 300 KB, the same text is typically clean and sharp. If the certificate contains fine print that needs to be readable — caste certificate serial numbers, marks in individual subjects — target 300 KB.",
    },
    {
      q: 'Can I compress a two-page document into one image at 300 KB?',
      a: "You can, but small text becomes difficult to read when two A4 pages are combined into a single image at 300 KB. Most portals expect one document page per upload slot. Use ConvertYard's Merge PDF tool if the portal requires a single file, and compress each page separately if it accepts multiple uploads.",
    },
    {
      q: 'UPPSC requires documents under 300 KB. Does exactly 300 KB pass?',
      a: 'Most portals implement "under 300 KB" as ≤ 307,200 bytes (300 × 1024). The compressor targets 270–300 KB — below the ceiling — so output files pass portal validation. If a portal enforces a strict less-than check, the 270 KB target still clears it.',
    },
  ],
  relatedSizes: ['to-200kb', 'to-500kb', 'to-1mb'],
  relatedVerticals: ['upsc', 'state-psc'],
}
