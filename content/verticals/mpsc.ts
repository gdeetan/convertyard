import type { VerticalHubConfig } from '@/lib/types'

// Specs from MPSC Online portal (mahampsc.mahaonline.gov.in). MPSC requires thumb impression
// scan for some posts — an easy-to-miss upload step. Verified June 2026.
export const mpscConfig: VerticalHubConfig = {
  slug: 'mpsc',
  name: 'MPSC',
  fullName: 'Maharashtra Public Service Commission',
  country: 'India',
  category: 'exam',
  h1: 'MPSC 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'MPSC-exact photo, signature, and thumb impression specs. Works offline in your browser.',
  intro:
    'MPSC applications go through the dedicated MPSC Online portal at mahampsc.mahaonline.gov.in. Photo and signature requirements are similar to UPSC but with different KB ceilings. The portal also requires a separate thumb impression scan for some post categories — an upload step that catches many first-time applicants off guard. Prepare all files here before opening the MPSC portal.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport size',
      notes: '3.5×4.5 cm portrait, plain white or light background',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 20–50 KB',
      targetBytes: 50 * 1024,
      notes: 'Target 35–45 KB for a safe margin — the portal is strict at 50 KB',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 10–30 KB',
      targetBytes: 20 * 1024,
      notes: 'Black ink, white paper; also use this step for the thumb impression (10–30 KB)',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-300kb',
      label: 'Step 4: Compress document scans to 300 KB',
      targetBytes: 300 * 1024,
      notes: 'Individual PDF per document — do not merge certificates',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–50 KB',
      dimensions: '3.5 cm × 4.5 cm',
      format: 'JPG / JPEG',
      notes: 'Color, plain white or light background; avoid studio gradient backgrounds',
    },
    {
      documentType: 'Signature',
      size: '10–30 KB',
      dimensions: '3.5 cm × 1.5 cm',
      format: 'JPG / JPEG',
      notes: 'Black ink on plain white paper',
    },
    {
      documentType: 'Thumb impression',
      size: '10–30 KB',
      dimensions: 'Small square crop',
      format: 'JPG / JPEG',
      notes: 'Left thumb on plain white paper; required for some MPSC post categories',
    },
    {
      documentType: 'Document scans (certificates)',
      size: 'Up to 300 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Individual upload per document type',
    },
  ],

  commonMistakes: [
    'Missing the thumb impression upload: required for specific MPSC posts but easy to overlook — the field appears midway through the application form.',
    'Photo with busy studio background (gradient, bokeh): MPSC document verification rejects non-plain backgrounds even if the upload succeeds.',
    'File size just over 50 KB: MPSC portal shows "invalid file size" with no further detail — compress to 40–45 KB to stay well within range.',
    'Uploading English-only documents for Marathi-language-required fields: some MPSC posts require Marathi versions of certain certificates for state-level verification.',
    'Using the same photo as UPSC (200 KB): MPSC\'s ceiling is 50 KB, four times lower than UPSC\'s limit.',
  ],

  specificFaq: [
    {
      q: 'What is the thumb impression size requirement for MPSC applications?',
      a: 'For posts that require it, the left thumb impression must be scanned on plain white paper as a JPEG image within 10–30 KB. Press your thumb onto a plain ink pad, stamp it cleanly on white A4 paper, and photograph or scan the impression. Crop tightly and compress with the image compressor above.',
    },
    {
      q: 'Can I upload English-medium certificates for MPSC state service exams?',
      a: 'English-medium education certificates (10th, 12th, degree) are generally accepted. However, domicile, caste, and some other government certificates may need to be in Marathi or bilingual format for MPSC verification. Check your specific certificate requirements in the notification.',
    },
    {
      q: 'Do MPSC Rajyaseva and MPSC Combined exams have the same photo upload specs?',
      a: 'Yes — both use the MPSC Online portal with the same 20–50 KB photo and 10–30 KB signature requirements. The document upload requirements may differ slightly between post categories.',
    },
    {
      q: 'My photo is 51 KB — will it get rejected by the MPSC portal?',
      a: 'Very likely yes. MPSC portal validation is strict at the 50 KB ceiling. Compress to 40–45 KB to stay safely within range. The quality difference between 45 KB and 51 KB is not visible to the naked eye.',
    },
    {
      q: 'How do I compress a scanned Domicile Certificate to under 300 KB?',
      a: 'Scan in grayscale at 150 DPI rather than 300 DPI color. A single A4 page at 150 DPI grayscale typically results in a 100–200 KB PDF after compression. Run it through the PDF compressor above to confirm it lands under 300 KB.',
    },
    {
      q: 'Can I use the same photo for MPSC and UPSC applications?',
      a: 'You can use the same photograph composition (same physical photo), but you will need two separate file versions: one compressed to under 50 KB for MPSC and one within 20–200 KB for UPSC. The portrait, background, and face framing can be identical.',
    },
  ],

  relatedVerticals: ['upsc', 'uppsc', 'tnpsc', 'kpsc'],
  lastUpdated: '2026-06-23',
}
