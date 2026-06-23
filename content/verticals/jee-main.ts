import type { VerticalHubConfig } from '@/lib/types'

// Specs from NTA JEE Main 2026 official notification (jeemain.nta.nic.in).
// Photo: 10–200 KB (NTA reduced max from 300 KB to 200 KB for 2026), JPEG, 3.5×4.5 cm.
// Signature: 10–100 KB (NTA increased from 50 KB to 100 KB for 2026), JPEG, 3.5×1.5 cm.
// Source: NTA JEE Main 2026 information bulletin, verified June 2026.
export const jeeMainConfig: VerticalHubConfig = {
  slug: 'jee-main',
  name: 'JEE Main',
  fullName: 'Joint Entrance Examination (Main) — NTA',
  country: 'India',
  category: 'exam',
  h1: 'JEE Main Photo & Signature Size Requirements 2026',
  subhead: 'Prepare your JEE Main 2026 application photo and signature to NTA specs — crop, compress, download.',
  intro: 'NTA updated JEE Main photo and signature limits for 2026: the photo maximum was reduced from 300 KB to 200 KB, and the signature maximum was increased to 100 KB. Both must be JPEG with a white background. The signature (3.5×1.5 cm) is a wide landscape strip — do not crop it into a square. Note: the 2026 NTA application includes an Aadhaar-linked identity verification step with live photo capture — a separate step on the NTA portal that does not require a file prepared by these tools.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport ratio (3.5:4.5)',
      targetDimensions: { width: 413, height: 531 },
      notes: 'Use the Passport 3.5:4.5 preset. JEE Main requires a portrait passport-size photo, not a square.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-100kb',
      label: 'Step 2: Compress photo to 100 KB',
      targetBytes: 100 * 1024,
      notes: 'JEE Main accepts 10–200 KB. 100 KB gives good quality with a safe buffer below the 200 KB limit.',
    },
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 3: Crop signature (wide landscape strip)',
      notes: 'The JEE Main signature is 3.5×1.5 cm — a wide rectangle, not a square. Crop tightly around the signature, including a small white margin on each side.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 4: Compress signature to 50 KB',
      targetBytes: 50 * 1024,
      notes: 'JEE Main accepts signatures from 10–100 KB. 50 KB is a safe mid-range target.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '10–200 KB',
      dimensions: '3.5×4.5 cm (portrait, ~413×531 px at 300 dpi)',
      format: 'JPEG / JPG',
      notes: 'White background, 80% face visible without mask, taken recently. Name "Photograph".',
    },
    {
      documentType: 'Signature',
      size: '10–100 KB',
      dimensions: '3.5×1.5 cm (wide landscape strip)',
      format: 'JPEG / JPG',
      notes: 'Blue or black ink on plain white paper. Full signature in running letters. File named "Signature".',
    },
  ],

  commonMistakes: [
    'Uploading a square photo — JEE Main requires the standard passport portrait (3.5×4.5 cm), not a square crop used for UPSC or CUET.',
    'Signature as a tall portrait crop — the JEE Main signature is 3.5 wide × 1.5 tall (landscape). Cropping it into a square stretches it and may cause rejection.',
    'Photo over 200 KB — NTA lowered the limit to 200 KB for 2026. Files above this fail upload validation.',
    'Using initials or block letters for the signature — NTA requires a full signature in running (cursive) letters.',
    'Scanned at too high a DPI — a 600 dpi scan produces a very large file. Scan at 200–300 dpi and compress to target.',
  ],

  specificFaq: [
    {
      q: 'Did NTA change the JEE Main photo or signature size for 2026?',
      a: 'Yes. For 2026, NTA reduced the maximum photo size from 300 KB to 200 KB (minimum stays 10 KB) and increased the maximum signature size from 50 KB to 100 KB (minimum stays 10 KB). Use the targets on this page, not older guides that reference the 300 KB photo limit.',
    },
    {
      q: 'Is the JEE Main photo format the same as NEET?',
      a: 'Yes — both use the same passport-size portrait photo (3.5×4.5 cm, 10–200 KB, JPEG, white background). If you prepared a photo for NEET, the same file works for JEE Main.',
    },
    {
      q: 'How do I get the signature dimensions right (3.5×1.5 cm)?',
      a: 'Sign in the centre of a plain white A4 sheet, leaving space around the signature. Use the crop tool to select just the signature area — keep a small white border on each side. The Passport 3.5:4.5 aspect preset won\'t work here; use Free mode and drag to a landscape ratio (wider than tall).',
    },
    {
      q: 'Can I use a digital signature for JEE Main?',
      a: 'No. NTA requires a handwritten signature scanned or photographed from paper. Digital or typed signatures are rejected. Sign with a ballpoint pen (blue or black ink) on plain white paper for the cleanest result.',
    },
  ],

  relatedVerticals: ['neet', 'upsc', 'ssc-cgl', 'ibps-po'],
  lastUpdated: '2026-06-23',
}
