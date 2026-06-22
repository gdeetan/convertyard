import type { VerticalHubConfig } from '@/lib/types'

// Specs sourced from compress-image-to-100kb.ts and compress-image-to-20kb.ts
// to ensure consistency across all size-target pages.
// UPSC CSE Notification 2025–26 cycle: photo 20–300 KB square, sig 1–40 KB.
export const upscConfig: VerticalHubConfig = {
  slug: 'upsc',
  name: 'UPSC',
  fullName: 'Union Public Service Commission',
  country: 'India',
  category: 'exam',
  h1: 'UPSC Photo & Signature Size Requirements',
  subhead: 'Crop, resize, and compress your UPSC Civil Services application photo to exact portal specs — in your browser.',
  intro: 'The UPSC online application portal rejects photos that are the wrong size, wrong shape, or exceed 300 KB. The two most common mistakes are submitting a rectangular passport photo instead of a square one, and submitting a PNG instead of a JPEG. Use the tools below in order: crop to square first, then compress.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to square (1:1)',
      targetDimensions: { width: 350, height: 350 },
      notes: 'Select the 1:1 aspect ratio preset, then set Output width and height to 350. UPSC requires a square photo — a standard passport rectangle will be rejected.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-100kb',
      label: 'Step 2: Compress photo to 100 KB',
      targetBytes: 100 * 1024,
      notes: '100 KB sits comfortably within the 20–300 KB range and gives a good quality–size balance.',
    },
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 3: Crop signature to landscape',
      notes: 'Sign on plain white paper in black or blue ink. Crop tightly around the signature — no blank margins.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 4: Compress signature to 20 KB',
      targetBytes: 20 * 1024,
      notes: '20 KB is the safe middle of the 1–40 KB UPSC signature range.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–300 KB',
      dimensions: 'Square (approx. 350×350 px)',
      format: 'JPEG / JPG',
      notes: 'White or light background, taken within the last 6 months, 80% face visible',
    },
    {
      documentType: 'Signature',
      size: '1–40 KB',
      dimensions: 'Variable (crop tightly)',
      format: 'JPEG / JPG',
      notes: 'Black or blue ink on plain white paper, full signature in running letters',
    },
  ],

  commonMistakes: [
    'Submitting a rectangular passport photo (3.5×4.5 cm) instead of a square — UPSC requires a square crop.',
    'Uploading a PNG file — the portal accepts JPEG only. Even if renamed to .jpg, a PNG will fail validation.',
    'File size over 300 KB — even 301 KB causes an upload error. Stay below 300 KB.',
    'EXIF orientation not applied — the photo appears rotated sideways on the portal. Enable auto-orient before uploading.',
    'Signature on lined or coloured paper — only plain white is accepted. Paper texture also increases file size.',
  ],

  specificFaq: [
    {
      q: 'Does UPSC require a square photo or a passport-size photo?',
      a: 'Square. UPSC\'s online application form requires a square photograph — not the standard 3.5×4.5 cm passport rectangle used by SSC or IBPS. Use the 1:1 aspect ratio preset in the crop tool.',
    },
    {
      q: 'What exact pixel size should my UPSC photo be?',
      a: 'UPSC does not specify an exact pixel size — only the file size (20–300 KB) and the square crop. A 350×350 px JPEG compressed to around 100 KB is a widely used standard that passes every UPSC application portal.',
    },
    {
      q: 'Can I use the same photo for UPSC and NEET?',
      a: 'Yes, if you took a square crop of your photo. Both exams require a square passport-format photo with similar size limits. Take one good square photo and use it for both UPSC and NTA exams.',
    },
    {
      q: 'What colour background is required for the UPSC photo?',
      a: 'A white or very light plain background. Avoid coloured, patterned, or outdoor backgrounds. The background must be uncluttered and free of shadows.',
    },
    {
      q: 'My signature is slightly over 40 KB after compressing. What should I try?',
      a: 'Scan or re-photograph the signature against a plain white background — paper texture and slight colour variation dramatically increase file size. If still over, lower the JPEG quality further (try 60–70) or trim the image even closer to the signature boundary.',
    },
  ],

  relatedVerticals: ['ssc-cgl', 'neet', 'jee-main', 'ibps-po'],
  lastUpdated: '2026-06-22',
}
