import type { VerticalHubConfig } from '@/lib/types'

// Covers LIC AAO, NIACL AO, NICL AO, GIC Scale Officer. All run separate portals with
// nearly identical upload specs. LIC specifies dimensions in cm; NIACL/GIC specify in pixels
// — different aspect ratios, a common trap for aspirants preparing for all four simultaneously.
// Verified June 2026.
export const insuranceExamsConfig: VerticalHubConfig = {
  slug: 'insurance-exams',
  name: 'Insurance Sector Exams',
  fullName: 'LIC AAO, NIACL AO, NICL AO & GIC Scale Officer Recruitment',
  country: 'India',
  category: 'exam',
  h1: 'Insurance Exam 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'LIC AAO, NIACL, NICL, GIC — photo and document specs for all four in one place.',
  intro:
    'Insurance sector recruitment exams — LIC AAO, NIACL AO, NICL AO, and GIC Scale Officer — run on separate portals but share nearly identical upload requirements. Many aspirants prepare for all four simultaneously. This hub covers all of them so you can prepare your files once and use them across every application. Note: LIC specifies photo dimensions in centimetres while NIACL and GIC specify in pixels — they have slightly different aspect ratios, so check which exam you are applying to before cropping.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport size',
      notes: 'Use 4.5cm×3.5cm for LIC AAO; 200×230 px for NIACL/GIC (slight aspect ratio difference)',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 20–50 KB',
      targetBytes: 50 * 1024,
      notes: 'All four insurance portals use the same 20–50 KB photo range',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 10–20 KB',
      targetBytes: 20 * 1024,
      notes: 'Black or blue ink on plain white paper',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-500kb',
      label: 'Step 4: Compress documents to 500 KB',
      targetBytes: 500 * 1024,
      notes: 'Insurance portals have stricter document limits than most banking portals — target under 500 KB per file',
    },
  ],

  officialSpecs: [
    {
      documentType: 'LIC AAO — Photograph',
      size: '20–50 KB',
      dimensions: '4.5 cm × 3.5 cm',
      format: 'JPG / JPEG',
      notes: 'LIC specifies dimensions in cm (landscape-ish); white background',
    },
    {
      documentType: 'LIC AAO — Signature',
      size: '10–20 KB',
      dimensions: '3.5 cm × 1.5 cm',
      format: 'JPG / JPEG',
      notes: 'Black or blue ink on white paper',
    },
    {
      documentType: 'NIACL AO / GIC Scale Officer — Photograph',
      size: '20–50 KB',
      dimensions: '200×230 pixels',
      format: 'JPG / JPEG',
      notes: 'NIACL and GIC specify pixels (portrait); white background',
    },
    {
      documentType: 'NIACL AO / GIC Scale Officer — Signature',
      size: '10–20 KB',
      dimensions: '140×60 pixels',
      format: 'JPG / JPEG',
      notes: 'Black or blue ink on white paper',
    },
    {
      documentType: 'NICL AO — Photograph',
      size: '20–50 KB',
      dimensions: '3.5 cm × 4.5 cm',
      format: 'JPG / JPEG',
      notes: 'Portrait format (same as state PSCs); white background',
    },
    {
      documentType: 'All portals — Document scans',
      size: 'Up to 500 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Individual upload per document; insurance portals cap stricter than banking portals',
    },
  ],

  commonMistakes: [
    'Using LIC photo dimensions for NIACL: LIC specifies 4.5cm×3.5cm (roughly landscape); NIACL specifies 200×230 px (portrait) — different aspect ratios that require different crops.',
    'Reusing the same photo file for all four exams without checking dimensions: LIC and NIACL have different aspect ratios; prepare two separate crops from the same photograph.',
    'Certificate PDFs above 500 KB: insurance portals have stricter document limits than most banking portals — run every certificate through the PDF compressor.',
    'Missing the category/caste certificate for reserved category benefits: each portal requires a fresh upload even if you uploaded the same document for another insurance exam.',
  ],

  specificFaq: [
    {
      q: 'Are LIC AAO and NIACL AO photo requirements the same?',
      a: 'Similar but not identical. Both require JPEG, 20–50 KB, white background. However, LIC specifies 4.5cm×3.5cm dimensions while NIACL specifies 200×230 px — those are different aspect ratios. Crop two separate versions from the same photograph for each.',
    },
    {
      q: 'Can I use one set of photos for all insurance sector exam applications?',
      a: 'One photo composition (same physical photograph, same background, same shot) can serve all four exams, but you will need to crop it to two different sizes: once to LIC\'s 4.5×3.5 cm for LIC AAO, and once to 200×230 px for NIACL AO and GIC Scale Officer. The NICL AO crop is 3.5×4.5 cm.',
    },
    {
      q: 'What is the document upload limit for LIC AAO?',
      a: 'LIC AAO typically caps supporting document uploads at 500 KB per file. This is stricter than IBPS PO (300 KB for some slots) in some cycles but more generous in others — verify the current LIC AAO notification for the exact limit.',
    },
    {
      q: 'How do I compress a 2 MB experience certificate to under 500 KB?',
      a: 'Use the PDF compressor above. A 2 MB experience certificate (typically one scanned page) compresses cleanly to 100–300 KB when you convert to grayscale and reduce DPI. All text will remain clearly readable.',
    },
    {
      q: 'Does NICL AO require a thumb impression separate from the photo?',
      a: 'NICL AO typically requires only photo and signature uploads — no separate thumb impression. LIC AAO may also require a thumb impression for certain stages. Check the latest notification for your specific exam.',
    },
    {
      q: 'Which insurance exam portal has the strictest file size limits?',
      a: 'LIC AAO and GIC Scale Officer portals have historically been the strictest with 500 KB document ceilings. NIACL AO portals have sometimes allowed larger uploads. Since requirements change by cycle, verify the current notification — but 500 KB is a safe universal target for all four.',
    },
  ],

  relatedVerticals: ['ibps-po', 'sbi', 'rbi-grade-b'],
  lastUpdated: '2026-06-23',
}
