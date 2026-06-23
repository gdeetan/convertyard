import type { VerticalHubConfig } from '@/lib/types'

// Specs from SBI careers portal (sbi.co.in/careers). SBI runs its own portal entirely
// separate from IBPS CRP. Photo 200×230 px, 20–50 KB. Also requires left thumb impression
// and a hand-written declaration for PO posts. Verified June 2026.
export const sbiConfig: VerticalHubConfig = {
  slug: 'sbi',
  name: 'SBI Exams',
  fullName: 'State Bank of India — PO & Clerk Recruitment',
  country: 'India',
  category: 'exam',
  h1: 'SBI PO & Clerk 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'SBI-specific photo dimensions and KB limits. Not the same as IBPS — different specs.',
  intro:
    'SBI runs its own recruitment portal entirely separate from the IBPS Common Recruitment Process. Photo dimensions differ from IBPS PO — SBI requires a 200×230 pixel crop while IBPS uses a different aspect ratio. Using IBPS specs for SBI is one of the most common mistakes among aspirants preparing for both. SBI PO also has two additional upload steps that IBPS PO does not: a left thumb impression and a hand-written declaration.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to 200×230 px (SBI dimension)',
      notes: 'SBI requires exactly 200×230 pixels — different from IBPS. Use the custom crop option.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 20–50 KB',
      targetBytes: 50 * 1024,
      notes: 'Stay under 50 KB; SBI portal validates both dimensions and file size',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 10–20 KB',
      targetBytes: 20 * 1024,
      notes: '140×60 px, black or blue ink on white paper',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-300kb',
      label: 'Step 4: Compress supporting documents',
      targetBytes: 300 * 1024,
      notes: 'Also use compress-image for the thumb impression and hand-written declaration (JPG)',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–50 KB',
      dimensions: '200×230 pixels',
      format: 'JPG / JPEG',
      notes: 'Color, white background, clear face; taken within 6 months',
    },
    {
      documentType: 'Signature',
      size: '10–20 KB',
      dimensions: '140×60 pixels',
      format: 'JPG / JPEG',
      notes: 'Black or blue ink on plain white paper',
    },
    {
      documentType: 'Left thumb impression',
      size: '20–50 KB',
      dimensions: '240×240 pixels',
      format: 'JPG / JPEG',
      notes: 'SBI PO specific; press left thumb on ink pad, stamp on plain white paper, scan',
    },
    {
      documentType: 'Hand-written declaration (SBI PO)',
      size: '50–100 KB',
      dimensions: 'A5 or half-A4 page',
      format: 'JPG / JPEG',
      notes: 'Write the declaration text specified in the SBI notification by hand, scan as JPEG',
    },
  ],

  commonMistakes: [
    'Using IBPS PO dimensions for the SBI photo: IBPS uses 4.5cm×3.5cm (portrait 45mm tall × 35mm wide); SBI uses 200×230 px (portrait ~52mm tall × 46mm wide at 96dpi) — a different aspect ratio.',
    'Missing the left thumb impression upload: SBI PO requires a separate thumb impression scan; this step is not in IBPS PO applications and is easy to miss.',
    'Hand-written declaration photo too large: the declaration must be uploaded as a JPG under 100 KB — a photo of an A4 page at full resolution will be 3–8 MB without compression.',
    'Photo taken more than 6 months ago: SBI verifies photo recency during document verification and can reject older photos.',
  ],

  specificFaq: [
    {
      q: 'Can I use the same photo for SBI PO and IBPS PO applications?',
      a: 'No. SBI requires a 200×230 px crop and IBPS requires a different dimension. If you use the same file, one of them will fail portal dimension validation. Crop the same photograph twice to the two different dimension targets.',
    },
    {
      q: 'What are the exact pixel dimensions for the SBI Clerk photo upload?',
      a: 'SBI Clerk uses the same dimensions as SBI PO: 200 pixels wide × 230 pixels tall, JPEG, 20–50 KB. The SBI portal validates the pixel dimensions — do not just compress without cropping to the right size.',
    },
    {
      q: 'Does SBI Clerk require a hand-written declaration like SBI PO?',
      a: 'SBI PO requires the hand-written declaration; SBI Clerk typically does not. Check the current notification to confirm, as requirements can change between cycles.',
    },
    {
      q: 'How do I scan a left thumb impression that stays under 50 KB?',
      a: 'Press your left thumb onto a standard ink pad, stamp it on plain white A4 paper with firm, even pressure. Photograph or scan just the thumb print area with good lighting. A cropped 240×240 px image of a clear black ink thumbprint compresses cleanly to under 30 KB at JPEG quality 80.',
    },
    {
      q: 'Why does the SBI portal say "invalid dimensions" when my photo looks fine?',
      a: 'The portal checks actual pixel dimensions, not file size. A 50 KB photo could be 800×600 px or 200×230 px — the portal only accepts 200×230. Use the image cropper above with a custom 200×230 crop before compressing.',
    },
    {
      q: 'Can I apply for both SBI PO and SBI Clerk with the same photo in the same year?',
      a: 'Yes — the same 200×230 px JPEG compressed to 20–50 KB works for both SBI PO and SBI Clerk applications. You can reuse the same file for both.',
    },
  ],

  relatedVerticals: ['ibps-po', 'rbi-grade-b', 'insurance-exams'],
  lastUpdated: '2026-06-23',
}
