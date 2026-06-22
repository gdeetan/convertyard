import type { VerticalHubConfig } from '@/lib/types'

// Specs sourced from compress-image-to-50kb.ts and compress-image-to-20kb.ts
// to ensure consistency across all size-target pages.
// IBPS PO 2025–26: photo 20–50 KB passport, sig 10–20 KB, JPEG only.
export const ibpsPoConfig: VerticalHubConfig = {
  slug: 'ibps-po',
  name: 'IBPS PO',
  fullName: 'Institute of Banking Personnel Selection — Probationary Officer',
  country: 'India',
  category: 'exam',
  h1: 'IBPS PO Photo & Signature Size Requirements',
  subhead: 'Compress and crop your IBPS PO application photo to exactly 20–50 KB in passport format — all in your browser.',
  intro: 'IBPS PO uses the same photo and signature specs as SSC CGL and most other IBPS exams (RRB, Clerk, SO): a passport-format portrait photo (3.5×4.5 cm) compressed to 20–50 KB, and a signature compressed to 10–20 KB. JPEG only — PNG is not accepted. If you already have a photo prepared for SSC CGL, the same file works for IBPS PO.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport ratio (3.5:4.5)',
      targetDimensions: { width: 413, height: 531 },
      notes: 'Use the Passport 3.5:4.5 preset. IBPS requires a portrait rectangle — the same format as a standard Indian passport photo.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 50 KB',
      targetBytes: 50 * 1024,
      notes: 'IBPS accepts 20–50 KB. 50 KB maximises quality within the limit.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 20 KB',
      targetBytes: 20 * 1024,
      notes: 'IBPS signature range is 10–20 KB. 20 KB gives the best quality within the limit.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–50 KB',
      dimensions: '3.5×4.5 cm (portrait, ~413×531 px at 300 dpi)',
      format: 'JPEG / JPG only',
      notes: 'Plain white background, recent photograph, 80% face visible',
    },
    {
      documentType: 'Signature',
      size: '10–20 KB',
      dimensions: 'Variable (crop tightly to signature)',
      format: 'JPEG / JPG only',
      notes: 'Black or blue ink on plain white paper, running letters',
    },
  ],

  commonMistakes: [
    'PNG file instead of JPEG — IBPS\'s portal validates the actual file format, not just the extension. A PNG renamed to .jpg will fail.',
    'Photo above 50 KB — even 51 KB is rejected. Compress to exactly the target size.',
    'Square crop instead of portrait — IBPS requires the standard passport rectangle (taller than wide), not the square format used for UPSC.',
    'Signature on notebook paper with lines — lines add colour complexity and increase file size above the 20 KB limit.',
    'Using the same photo for thumb impression and signature slots — IBPS requires a separate scanned thumb impression upload (left thumb for most forms). Do not confuse with the signature.',
  ],

  specificFaq: [
    {
      q: 'Are the IBPS PO photo specs the same as IBPS Clerk or RRB?',
      a: 'Yes. All IBPS exams (PO, Clerk, SO, RRB Officer, RRB Office Assistant) use the same photo and signature specs: 20–50 KB passport portrait, 10–20 KB signature, JPEG only. One prepared set of files works for all IBPS applications.',
    },
    {
      q: 'Do I need to submit a thumb impression separately for IBPS?',
      a: 'Yes. In addition to the photo and signature, IBPS requires a scanned left thumb impression (10–20 KB, JPEG). This is a separate upload slot. Scan your thumb print on plain white paper in the same way you would a signature.',
    },
    {
      q: 'Can I use the same photo for IBPS PO and SSC CGL?',
      a: 'Yes — both exams require the identical format: passport portrait (3.5×4.5 cm), 20–50 KB, JPEG. One photo file works for both applications.',
    },
    {
      q: 'My photo was compressed below 20 KB. Is it acceptable?',
      a: 'No — IBPS has a minimum of 20 KB. If your photo is too small, it means either the resolution is too low or the quality was compressed too aggressively. Try re-scanning at a higher resolution or use a higher JPEG quality setting.',
    },
  ],

  relatedVerticals: ['ssc-cgl', 'upsc', 'neet', 'jee-main'],
  lastUpdated: '2026-06-22',
}
