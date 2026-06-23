import type { VerticalHubConfig } from '@/lib/types'

// Specs from official UPSC PDF "Instructions for Uploading the Photo & Signature"
// (upsconline.nic.in). Photo: 20–200 KB, face must fill 3/4 of frame (no fixed aspect ratio).
// Signature: sign 3× vertically on one sheet, 20–100 KB, 350–500 px. Verified June 2026.
export const upscConfig: VerticalHubConfig = {
  slug: 'upsc',
  name: 'UPSC',
  fullName: 'Union Public Service Commission',
  country: 'India',
  category: 'exam',
  h1: 'UPSC Photo & Signature Size Requirements',
  subhead: 'Crop, resize, and compress your UPSC Civil Services application photo to exact portal specs — in your browser.',
  intro: 'The UPSC online application portal requires a JPEG photo between 20–200 KB where your face fills at least 3/4 of the frame — this is a framing and composition rule, not a fixed aspect ratio. Use a Free or Passport crop preset and position the photo so the face is large in the frame. The signature requirement changed for 2026: you must sign three times vertically (one below the other) on a single sheet of plain white paper in black ink, then scan all three as one image. Note: UPSC also requires a live photo capture via webcam or mobile during the application — matched against your uploaded photo. That live-capture step happens on the UPSC portal and cannot be prepared with file tools.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo — face fills 3/4 of frame',
      notes: 'Use Free mode or the Passport preset. Position and crop so your face (forehead to chin) occupies roughly 3/4 of the photo area. A face that is too small or centred in too much background will be rejected.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-100kb',
      label: 'Step 2: Compress photo to 100 KB',
      targetBytes: 100 * 1024,
      notes: '100 KB is a comfortable mid-range within the 20–200 KB UPSC limit — good quality with a safe margin below the ceiling.',
    },
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 3: Scan and crop the triple-signature sheet',
      notes: 'Sign three times vertically (one below the other) on plain white paper in black ink. Scan or photograph all three together as one image. Crop tightly around the full column of three signatures, leaving only a small white border. Do not scan just one signature.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 4: Compress signature sheet to 50 KB',
      targetBytes: 50 * 1024,
      notes: 'UPSC signature range is 20–100 KB. 50 KB is a safe mid-range target — readable quality within the limit.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–200 KB',
      dimensions: 'No fixed pixel size — face must fill at least 3/4 of the frame',
      format: 'JPEG / JPG',
      notes: 'White or light background, taken within the last 6 months, 80% face visible, no cap or glasses',
    },
    {
      documentType: 'Signature',
      size: '20–100 KB',
      dimensions: '350–500 px (all three signatures on one sheet)',
      format: 'JPEG / JPG',
      notes: 'Sign three times vertically on one plain white sheet in black ink. Scan all three as a single image.',
    },
  ],

  commonMistakes: [
    'Cropping too loosely — UPSC requires the face to fill at least 3/4 of the photo area. A face that is small relative to a large background will be rejected.',
    'Uploading a PNG file — the portal accepts JPEG only. Even if renamed to .jpg, a PNG will fail validation.',
    'File size over 200 KB — even 201 KB causes an upload error. Stay below 200 KB.',
    'EXIF orientation not applied — the photo appears rotated sideways on the portal. Enable auto-orient before uploading.',
    'Signature on lined or coloured paper — only plain white is accepted. Paper texture also increases file size.',
    'Signing only once — UPSC 2026 requires three signatures written vertically one below the other on the same sheet. A single signature will be rejected.',
  ],

  specificFaq: [
    {
      q: 'Does UPSC require a square photo or a passport-size photo?',
      a: 'Neither is mandated. UPSC\'s official instructions specify that your face must cover at least 3/4 of the photo area — this is a framing rule, not an aspect ratio requirement. You can use a passport rectangle or a square crop, as long as the face is large in the frame. Avoid wide-angle or full-body shots.',
    },
    {
      q: 'What exact pixel size should my UPSC photo be?',
      a: 'UPSC does not specify an exact pixel dimension — only the file size (20–200 KB) and that the face fills at least 3/4 of the frame. Crop to your preference (portrait or square), ensure the face is prominent, and compress to around 100 KB.',
    },
    {
      q: 'Can I use the same photo for UPSC and NEET?',
      a: 'Possibly, but check the framing. NEET requires a standard passport-size portrait (3.5×4.5 cm). UPSC does not fix the aspect ratio but requires the face to fill 3/4 of the frame. A well-framed passport photo where the face is prominent will usually satisfy both, but crop a separate copy if needed.',
    },
    {
      q: 'What colour background is required for the UPSC photo?',
      a: 'A white or very light plain background. Avoid coloured, patterned, or outdoor backgrounds. The background must be uncluttered and free of shadows.',
    },
    {
      q: 'How do I prepare the triple-signature sheet for UPSC?',
      a: 'Sign your full signature three times in a vertical column on a plain white A4 sheet using black ink. Leave a small gap between each signature. Scan or photograph the entire column, then crop tightly around all three signatures. The final image should show all three together in one file (20–100 KB, JPEG).',
    },
    {
      q: 'Do I still need to upload a photo file if UPSC now uses live capture?',
      a: 'Yes — UPSC requires both a scanned passport photo file upload (20–200 KB) AND a live photo capture via webcam or mobile during the application process, matched against the uploaded photo. The tools on this page help you prepare the file upload; the live capture step happens directly on the UPSC portal and does not require a file prepared in advance.',
    },
  ],

  relatedVerticals: ['ssc-cgl', 'neet', 'jee-main', 'ibps-po'],
  lastUpdated: '2026-06-23',
}
