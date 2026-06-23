import type { VerticalHubConfig } from '@/lib/types'

// Specs from TNPSC OTR portal (tnpscexams.net). Photo ceiling 40 KB — stricter than most
// state PSCs. Document ceiling 200 KB. Some certificates require Tamil language versions.
// Verified June 2026.
export const tnpscConfig: VerticalHubConfig = {
  slug: 'tnpsc',
  name: 'TNPSC',
  fullName: 'Tamil Nadu Public Service Commission',
  country: 'India',
  category: 'exam',
  h1: 'TNPSC 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'TNPSC photo, signature, and document specs — including the strict 40 KB photo ceiling. Processed locally, nothing sent anywhere.',
  intro:
    'TNPSC applications go through the TNPSC One Time Registration (OTR) portal at tnpscexams.net. Photo specs are slightly stricter than most state PSCs — the 40 KB photo ceiling catches many aspirants who apply to both TNPSC and UPSC or SSC and assume the limits are the same. TNPSC also has stricter document size limits (200 KB) and may require Tamil-language versions of some certificates.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport size',
      notes: '3.5×4.5 cm portrait, light background, recent (within 3 months for TNPSC)',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 2: Compress photo to 20–40 KB',
      targetBytes: 20 * 1024,
      notes: 'TNPSC ceiling is 40 KB — target 25–35 KB for a safe margin',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 10–20 KB',
      targetBytes: 20 * 1024,
      notes: 'Black ink on plain white paper; 3.5×1.5 cm crop',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-200kb',
      label: 'Step 4: Compress document scans to 200 KB',
      targetBytes: 200 * 1024,
      notes: 'TNPSC document limit is 200 KB — stricter than most state PSCs',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–40 KB',
      dimensions: '3.5 cm × 4.5 cm',
      format: 'JPG / JPEG',
      notes: 'Color, light background, recent (within 3 months)',
    },
    {
      documentType: 'Signature',
      size: '10–20 KB',
      dimensions: '3.5 cm × 1.5 cm',
      format: 'JPG / JPEG',
      notes: 'Black ink on plain white paper',
    },
    {
      documentType: 'Document scans (certificates)',
      size: 'Up to 200 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Stricter than most state PSCs — scan at 100–150 DPI grayscale to hit this limit',
    },
  ],

  commonMistakes: [
    'Photo over 40 KB: TNPSC\'s ceiling is 40 KB, not the 50 KB used by UPPSC/BPSC or the 200 KB used by UPSC — a very common mistake for aspirants applying to multiple exams.',
    'Old photo (more than 3 months): TNPSC explicitly specifies a recent photograph; older photos may be flagged at interview or document verification.',
    'Document scans above 200 KB: TNPSC\'s document ceiling is 200 KB, stricter than UPSC and most northern state PSCs — run your certificate through the PDF compressor.',
    'Missing Tamil-language certificate version: some certificates (community, nativity) require a Tamil version for Tamil Nadu government verification at the DV stage.',
  ],

  specificFaq: [
    {
      q: 'What is the exact photo size limit for TNPSC in KB?',
      a: 'TNPSC allows photos between 20 KB and 40 KB. This is stricter than the 50 KB limit used by UPPSC, BPSC, and SSC. If you are applying to multiple exams and only have a 45 KB photo, compress a fresh copy to 30–35 KB specifically for TNPSC.',
    },
    {
      q: 'Does TNPSC Group 1 and Group 2 have the same photo requirements?',
      a: 'Yes — both Group 1 (State Services) and Group 2 (Sub-ordinate Services) applications go through the same TNPSC OTR portal and use the same photo (20–40 KB) and signature (10–20 KB) specifications.',
    },
    {
      q: 'How do I get my certificates scanned to under 200 KB in PDF format?',
      a: 'Scan in grayscale at 100–150 DPI. A single A4 page scanned at 150 DPI grayscale usually produces a 70–150 KB JPEG before converting to PDF. Avoid scanning at 300 DPI color — that produces 2–4 MB files that require aggressive compression.',
    },
    {
      q: 'Can I use a color printout of my community certificate for TNPSC?',
      a: 'Original or attested photocopies are what you bring to DV. For the online upload, a clean black-and-white scan is preferred — it compresses much better and keeps the 200 KB limit achievable without quality loss on the printed text.',
    },
    {
      q: 'Why does TNPSC reject my signature even when it\'s under 20 KB?',
      a: 'The most common reason is file format — TNPSC requires JPEG, not PNG or BMP. The compressor above always outputs genuine JPEG files. Another cause is the signature appearing faint or unclear: sign in black ballpoint on white paper with firm pressure.',
    },
    {
      q: 'Is a standard passport-size photo acceptable for TNPSC applications?',
      a: 'Yes, provided it meets TNPSC\'s specs: 3.5×4.5 cm, JPG, 20–40 KB, recent, light background. Standard passport photos from studios often come out as 100–300 KB JPEG files, which you will need to compress before uploading.',
    },
  ],

  relatedVerticals: ['kpsc', 'mpsc', 'upsc', 'ssc-cgl'],
  lastUpdated: '2026-06-23',
}
