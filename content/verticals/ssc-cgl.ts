import type { VerticalHubConfig } from '@/lib/types'

// Specs sourced from compress-image-to-50kb.ts and compress-image-to-20kb.ts
// to ensure consistency across all size-target pages.
// SSC CGL 2025–26 notification: photo 20–50 KB passport format, sig 10–20 KB.
export const sscCglConfig: VerticalHubConfig = {
  slug: 'ssc-cgl',
  name: 'SSC CGL',
  fullName: 'Staff Selection Commission — Combined Graduate Level',
  country: 'India',
  category: 'exam',
  h1: 'SSC CGL Photo & Signature Size Requirements',
  subhead: 'Get your SSC CGL application photo to exactly 20–50 KB in passport format — no rejections, no retakes.',
  intro: 'SSC CGL\'s portal is strict about both file size and photo format. The photo must be a passport rectangle (taller than it is wide — 3.5×4.5 cm), not a square. Many candidates get rejected for uploading a square crop used for other exams. The signature must be on white paper in blue or black ink and compressed to 10–20 KB.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport ratio (3.5:4.5)',
      targetDimensions: { width: 413, height: 531 },
      notes: 'Select the Passport 3.5:4.5 preset. SSC requires a portrait rectangle, not a square.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 50 KB',
      targetBytes: 50 * 1024,
      notes: 'SSC CGL accepts photos from 20 KB to 50 KB. 50 KB is the safest target — maximum quality within the limit.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 20 KB',
      targetBytes: 20 * 1024,
      notes: 'SSC signature range is 10–20 KB. 20 KB is the upper limit and gives slightly better quality.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–50 KB',
      dimensions: '3.5×4.5 cm (portrait rectangle, ~413×531 px at 300 dpi)',
      format: 'JPEG / JPG only',
      notes: 'Plain white background, 80% face visible, taken recently',
    },
    {
      documentType: 'Signature',
      size: '10–20 KB',
      dimensions: 'Variable (crop tightly to signature)',
      format: 'JPEG / JPG only',
      notes: 'Blue or black ink on plain white paper, running handwriting',
    },
  ],

  commonMistakes: [
    'Uploading a square (1:1) photo — SSC CGL requires a portrait rectangle (3.5 cm wide × 4.5 cm tall). Square photos are rejected.',
    'File size above 50 KB — SSC\'s portal is strict. Even 51 KB causes an upload error.',
    'PNG instead of JPEG — SSC only accepts JPG. A PNG renamed to .jpg is detected and rejected.',
    'Signature on lined, printed, or light-blue paper — background must be plain white.',
    'Signature that fills only a tiny part of the image — crop tightly around the signature to reduce file size without losing quality.',
  ],

  specificFaq: [
    {
      q: 'Is the SSC CGL photo format the same as an ordinary passport photo?',
      a: 'Yes — it uses the same 3.5×4.5 cm passport-size rectangle used in Indian passports and most government applications. This is a portrait format, taller than it is wide. Use the Passport 3.5:4.5 preset in the crop tool.',
    },
    {
      q: 'What is the exact pixel size for an SSC CGL photo?',
      a: 'SSC does not mandate a specific pixel size — only the file size (20–50 KB) and the 3.5×4.5 cm aspect ratio. At standard DPI of 300, this is approximately 413×531 pixels. The crop tool\'s Passport preset targets these dimensions.',
    },
    {
      q: 'Can I use the same photo for SSC CGL and IBPS PO?',
      a: 'Yes. Both SSC CGL and IBPS PO require the same passport-format photo (3.5×4.5 cm) compressed to 20–50 KB in JPEG. One well-prepared photo works for both.',
    },
    {
      q: 'My photo looks good but the portal says it\'s the wrong size. What do I do?',
      a: 'Check three things: (1) Is it JPEG, not PNG? (2) Is the file size between 20 and 50 KB — not just the pixel dimensions? (3) Is the ratio closer to 3:4 portrait rather than 1:1 square? All three conditions must be met.',
    },
  ],

  relatedVerticals: ['upsc', 'ibps-po', 'neet', 'jee-main'],
  lastUpdated: '2026-06-22',
}
