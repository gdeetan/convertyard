import type { VerticalHubConfig } from '@/lib/types'

// Specs from BPSC official CCE notification (bpsc.bihar.gov.in). Requirements vary slightly
// between CCE and departmental exams — verify the latest notification PDF before applying.
// Photo ceiling typically 50 KB. Verified June 2026.
export const bpscConfig: VerticalHubConfig = {
  slug: 'bpsc',
  name: 'BPSC',
  fullName: 'Bihar Public Service Commission',
  country: 'India',
  category: 'exam',
  h1: 'BPSC 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'BPSC photo and signature limits in one place. Browser-only, nothing uploaded to any server.',
  intro:
    'BPSC is among the highest-applicant-volume state PSCs in India. Upload specs are set per notification and can vary between the CCE (Combined Competitive Exam) and departmental exams — always verify against the latest notification PDF from bpsc.bihar.gov.in before applying. Most rejections happen because aspirants use UPSC or IBPS specs by mistake. Prepare your files here first, then upload to the BPSC online portal.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport size',
      notes: '3.5×4.5 cm portrait, white or light background, recent photo',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 20–50 KB',
      targetBytes: 50 * 1024,
      notes: 'BPSC typically caps photos at 50 KB — do not use UPSC\'s 200 KB limit here',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 10–40 KB',
      targetBytes: 20 * 1024,
      notes: 'Black or blue ink on plain white paper; crop tightly',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-300kb',
      label: 'Step 4: Compress document scans to 300 KB',
      targetBytes: 300 * 1024,
      notes: 'Upload each certificate separately as an individual PDF',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–50 KB',
      dimensions: '3.5 cm × 4.5 cm',
      format: 'JPG / JPEG',
      notes: 'Color, white or light background, recent (within 6 months)',
    },
    {
      documentType: 'Signature',
      size: '10–40 KB',
      dimensions: '3.5 cm × 1.5 cm',
      format: 'JPG / JPEG',
      notes: 'Black or blue ink on plain white paper',
    },
    {
      documentType: 'Document scans',
      size: '50–300 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Individual upload per document — verify exact limit in the current notification',
    },
  ],

  commonMistakes: [
    'Using a photo above 50 KB: BPSC portal may accept the upload but downstream document verification flags oversized photo files.',
    'Blue background photo (passport-style from a studio): BPSC requires a white or light plain background, not the blue background common in India studio portraits.',
    'Uploading a PNG signature: some BPSC portal implementations require JPG for the signature slot; PNG uploads fail validation silently.',
    'Scanning documents on dark or shadow-heavy backgrounds: increases file size by 3× and can push a single-page certificate above 300 KB before compression.',
    'Using specs from a previous BPSC notification: BPSC updates upload requirements between CCE cycles — confirm against the latest notification PDF.',
  ],

  specificFaq: [
    {
      q: 'Does BPSC 70th CCE have the same photo requirements as BPSC 69th CCE?',
      a: 'Usually yes — BPSC photo and signature specs have been consistent across recent CCE cycles at 20–50 KB and 10–40 KB respectively. However, confirm in the notification PDF for your specific exam before uploading.',
    },
    {
      q: 'Can I apply for BPSC with the same photo I used for UPSC CSE?',
      a: 'Only if the photo is within BPSC\'s size range. UPSC allows photos up to 200 KB; BPSC typically caps at 50 KB. If your UPSC photo file is 80–200 KB, you need to re-compress it for BPSC. The cropping and composition can stay the same.',
    },
    {
      q: 'What is the maximum file size for my caste certificate on the BPSC portal?',
      a: 'BPSC generally caps individual document uploads at 300 KB. Scan in grayscale at 150 DPI, compress with the PDF tool above, and you will hit this limit cleanly for a single-page certificate.',
    },
    {
      q: 'Why does the BPSC portal show "invalid file type" when I upload my signature?',
      a: 'The BPSC portal requires JPEG format for the signature slot. If you scanned to PNG or TIFF and are uploading that, it will fail. Use the compress-image tool above — it always outputs a genuine JPEG file.',
    },
    {
      q: 'How do I compress a 600 KB scanned certificate to under 300 KB without losing text clarity?',
      a: 'Use the PDF compressor above. If your scan is 600 KB it was probably scanned at 300 DPI color. The compressor converts to grayscale and reduces DPI — a single-page A4 text certificate compresses cleanly to 100–200 KB with all printed text remaining legible.',
    },
    {
      q: 'Does BPSC accept signatures in blue ink or only black?',
      a: 'BPSC notifications typically specify black or blue ink as acceptable for signatures. Black ink scans more crisply on a white background and compresses to a smaller file; if you have a choice, use black.',
    },
  ],

  relatedVerticals: ['upsc', 'uppsc', 'mpsc', 'ssc-cgl'],
  lastUpdated: '2026-06-23',
}
