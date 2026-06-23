import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 200 * 1024,
  targetLabel: '200 KB',
  slug: 'to-200kb',
  h1: 'Compress Image to 200 KB',
  subhead:
    'Upper photo limit for UPSC and many state-level exams. Also suits scanned single-page documents.',
  intro:
    "200 KB sits at the upper end of the photo range accepted by UPSC and several state-level Public Service Commissions. It also works well for scanned single-page documents — a mark sheet, a certificate, or an identity card — where you want enough quality to keep small printed text legible. At 200 KB, a standard passport-format JPEG photo looks indistinguishable from the original to most exam portal reviewers. For scanned A4 documents, 200 KB comfortably preserves printed text at 150 dpi. This compressor targets 180–200 KB for maximum quality at the threshold.",
  useCases: [
    {
      label: 'UPSC photo upload (higher quality option)',
      description:
        'UPSC allows photos up to 300 KB. Uploading at 200 KB gives noticeably better quality than 100 KB with a meaningful safety margin below the ceiling.',
    },
    {
      label: 'Scanned mark sheets',
      description:
        'Scanned mark sheets uploaded to state recruitment portals typically need to stay under 200 KB. A single A4 page scanned at 150 dpi usually lands near this target.',
    },
    {
      label: 'Certificate image uploads',
      description:
        'Educational and professional certificate scans — degree certificates, caste certificates, domicile certificates — for state PSC and university admissions portals.',
    },
    {
      label: 'ID proof scans',
      description:
        'Aadhaar, PAN card, or voter ID scans uploaded as part of online application or KYC processes. 200 KB preserves text clarity on ID documents.',
    },
  ],
  specificFaq: [
    {
      q: 'What scan resolution should I use to get a readable document at 200 KB?',
      a: 'Scan text documents at 150 dpi — this gives clean, readable text in a JPEG that compresses well to 200 KB for a single A4 page. 200 dpi gives slightly sharper text but often produces a file that needs more aggressive compression to hit 200 KB. Avoid 300 dpi for document scans destined for portal uploads; the extra detail gets lost in compression.',
    },
    {
      q: 'Should I scan in colour or grayscale for a 200 KB document upload?',
      a: 'Grayscale for documents with no colour content (printed text, black-and-white certificates). Grayscale encodes as roughly one-third the data of colour and results in a noticeably sharper document at any given file size. Use colour only if the document contains colour elements that matter — seals, coloured text, photos embedded in the certificate.',
    },
    {
      q: 'My certificate is two pages. Can both fit under 200 KB?',
      a: "Not easily at readable quality. A two-page certificate compressed as a single JPEG would need to halve the quality of each page to stay under 200 KB. Instead, split into two separate files and upload each under 200 KB. Use ConvertYard's PDF tools if the portal requires a single file.",
    },
    {
      q: 'Is 200 KB enough for an Aadhaar card scan to remain readable?',
      a: 'Yes. An Aadhaar card is small — roughly A6 size — with large, clear text. At 200 KB the QR code and all printed information remain clearly legible. Scan the card flat on a white background to avoid shadow interference.',
    },
  ],
  relatedSizes: ['to-100kb', 'to-300kb', 'to-500kb'],
  relatedVerticals: ['upsc', 'state-psc', 'us-ds-160-visa'],
}
