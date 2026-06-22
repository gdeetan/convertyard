import type { VerticalHubConfig } from '@/lib/types'

// Specs from NTA NEET UG 2026 official notification.
// Photo: 10–200 KB, passport 3.5×4.5 cm, JPEG, white background.
// Signature: 4–30 KB, JPEG. (Some 2026 sources list up to 50 KB — using conservative 30 KB.)
// Source: NTA NEET UG 2026 information bulletin, verified June 2026.
export const neetConfig: VerticalHubConfig = {
  slug: 'neet',
  name: 'NEET',
  fullName: 'National Eligibility cum Entrance Test (UG) — NTA',
  country: 'India',
  category: 'exam',
  h1: 'NEET UG Photo & Signature Size Requirements 2026',
  subhead: 'Prepare your NEET UG application photo and signature to NTA specifications — crop, resize, and compress in your browser.',
  intro: 'NTA\'s NEET UG 2026 application requires two types of photographs: a passport-size (3.5×4.5 cm) and a postcard-size (4"×6"). Both must be JPEG, 10–200 KB, with at least 80% face coverage against a white background. The signature must be in blue or black ink on white paper, compressed to under 30 KB. The portal rejects files outside these limits.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop passport photo (3.5:4.5)',
      targetDimensions: { width: 413, height: 531 },
      notes: 'Use the Passport 3.5:4.5 preset for the passport-size photo. NEET requires both passport and postcard photos — prepare the passport one first.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-100kb',
      label: 'Step 2: Compress passport photo to 100 KB',
      targetBytes: 100 * 1024,
      notes: '100 KB is a comfortable mid-range within the 10–200 KB NEET limit — good quality with a safe margin.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 20 KB',
      targetBytes: 20 * 1024,
      notes: 'NEET signature limit is 4–30 KB. 20 KB gives readable quality within the safe range.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Passport-size photograph',
      size: '10–200 KB',
      dimensions: '3.5×4.5 cm (portrait, ~413×531 px at 300 dpi)',
      format: 'JPEG / JPG',
      notes: 'White background, 80% face, name + date printed at bottom recommended, taken after 01 Jan 2026',
    },
    {
      documentType: 'Postcard-size photograph',
      size: '10–200 KB',
      dimensions: '4" × 6" (landscape, ~1200×1800 px at 300 dpi)',
      format: 'JPEG / JPG',
      notes: 'Same photo session as passport size. NTA requires 4–6 copies for admit card use.',
    },
    {
      documentType: 'Signature',
      size: '4–30 KB',
      dimensions: 'Variable (crop tightly)',
      format: 'JPEG / JPG',
      notes: 'Blue or black ink, running letters, on plain white paper',
    },
  ],

  commonMistakes: [
    'Uploading the wrong photo format for the wrong slot — NEET requires both a passport photo AND a postcard photo uploaded to separate slots. Don\'t mix them up.',
    'PNG instead of JPEG — NTA\'s portal validates MIME type, not just extension. A renamed PNG will fail.',
    'Photo with glasses, mask, or cap — NTA requires 80% face visibility with ears showing. Accessories that obscure the face cause rejection.',
    'Signature on ruled or graph paper — the lines dramatically increase file size and may cause the signature to appear unclear.',
    'Using a photo taken more than 6 months ago — NTA specifies the photo must be taken on or after 01 January 2026 for the 2026 cycle.',
  ],

  specificFaq: [
    {
      q: 'What is the difference between the passport photo and postcard photo for NEET?',
      a: 'The passport photo is a standard portrait format (3.5×4.5 cm) uploaded during registration. The postcard photo is a larger landscape format (4"×6") that NTA uses to verify identity at the exam hall. Both must be from the same photo session — same face, same background, same clothes.',
    },
    {
      q: 'Is the NEET photo size different from UPSC?',
      a: 'Yes. NEET uses a standard passport-size rectangle (3.5×4.5 cm portrait), while UPSC requires a square crop. Use the Passport 3.5:4.5 preset for NEET and the 1:1 preset for UPSC.',
    },
    {
      q: 'The NEET portal is showing "file too large" but my photo is under 200 KB. What do I check?',
      a: 'Confirm the format is JPEG (not PNG or HEIC). Some photo apps save files with the .jpg extension but in a non-JPEG format. Use the compress tool to re-encode the photo as a genuine JPEG even if it\'s already under 200 KB.',
    },
    {
      q: 'Can I print my own postcard photos at home for the NEET exam hall?',
      a: 'NTA requires you to bring printouts of the postcard-size photo to the examination centre. You can print at any photo studio or on a colour printer at home — the key requirement is that it matches the uploaded photo exactly.',
    },
  ],

  relatedVerticals: ['upsc', 'jee-main', 'ssc-cgl', 'ibps-po'],
  lastUpdated: '2026-06-22',
}
