import type { VerticalHubConfig } from '@/lib/types'

// SSC CGL 2026 uses live photo capture (webcam or mobile) during OTR registration —
// there is no passport photo file to upload at the registration stage.
// Signature is still a file upload: 10–20 KB, JPEG, blue or black ink.
// Source: SSC CGL 2026 official notification (ssc.gov.in, released 21 May 2026),
// confirmed via multiple OTR portal walkthroughs. Verified June 2026.
export const sscCglConfig: VerticalHubConfig = {
  slug: 'ssc-cgl',
  name: 'SSC CGL',
  fullName: 'Staff Selection Commission — Combined Graduate Level',
  country: 'India',
  category: 'exam',
  h1: 'SSC CGL Photo & Signature Size Requirements 2026',
  subhead: 'Prepare your SSC CGL signature to spec and understand the 2026 live photo capture process.',
  intro: 'SSC CGL 2026 changed how photos are submitted: there is no passport photo file to upload during OTR registration. Instead, the portal captures a live photo via your webcam or mobile camera during the application. Make sure you are in a well-lit area with a plain background, no cap or glasses, and that your webcam or phone camera is working before you open the portal. The signature is still a file upload — prepare that below. If you need a passport photo for a later stage (document verification or admit card), the crop and compress steps are still useful — label that file for the correct purpose, not for OTR registration.',

  toolPresets: [
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 1: Compress signature to 20 KB',
      targetBytes: 20 * 1024,
      notes: 'SSC CGL signature range is 10–20 KB. 20 KB is the upper limit and gives the best quality within the range.',
    },
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Optional: Crop passport photo for document verification',
      targetDimensions: { width: 413, height: 531 },
      notes: 'The OTR portal does not accept a pre-prepared photo file — it captures live via webcam. If you need a passport photo for document verification or admit card at a later stage, use the Passport 3.5:4.5 preset here.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Optional: Compress that photo to 50 KB',
      targetBytes: 50 * 1024,
      notes: 'Only if preparing a passport photo for document verification — not for OTR registration.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph (OTR registration)',
      size: 'N/A — live capture only',
      dimensions: 'Captured via webcam or mobile during application',
      format: 'Captured in-portal',
      notes: 'Plain background, no cap/glasses, face fully visible, good lighting. No pre-prepared file needed.',
    },
    {
      documentType: 'Signature',
      size: '10–20 KB',
      dimensions: 'Variable (crop tightly to signature)',
      format: 'JPEG / JPG only',
      notes: 'Blue or black ink on plain white paper, running handwriting, not capital letters',
    },
  ],

  commonMistakes: [
    'Preparing a passport photo file to upload during registration — SSC CGL 2026 uses live webcam capture at OTR registration. Have your webcam or mobile camera ready when you open the portal instead.',
    'Poor lighting or cluttered background during live capture — the portal rejects photos where the face is obscured or the background is busy. Sit facing a window or lamp before opening the form.',
    'Wearing glasses or a cap during live capture — SSC requires the face to be fully visible with no accessories during the live photo step.',
    'PNG instead of JPEG for the signature — SSC only accepts JPG. A PNG renamed to .jpg is detected and rejected.',
    'Signature on lined, printed, or light-blue paper — background must be plain white.',
  ],

  specificFaq: [
    {
      q: 'Does SSC CGL 2026 still require uploading a passport photo file?',
      a: 'No — SSC CGL 2026 replaced the file upload with live photo capture during OTR registration. The portal will activate your webcam or provide a QR code for your phone. You do not need to crop or compress a photo file for this step.',
    },
    {
      q: 'What is the exact pixel size for an SSC CGL photo?',
      a: 'For the 2026 live capture process, there are no file dimensions to prepare — the portal captures the photo directly. If a passport photo file is needed for a later stage (admit card, document verification), the standard is approximately 413×531 px (3.5×4.5 cm at 300 dpi).',
    },
    {
      q: 'Can I use the same signature file for SSC CGL and IBPS PO?',
      a: 'Yes. Both require the same format: a JPEG signature on white paper, 10–20 KB. One prepared signature file works for both applications.',
    },
    {
      q: 'My signature upload shows "wrong file size". What do I check?',
      a: 'Confirm three things: (1) Is the file JPEG, not PNG? (2) Is the size between 10 KB and 20 KB — not just the pixel dimensions? (3) Is the background plain white with no lines? All three conditions must be met for the signature upload to pass.',
    },
  ],

  relatedVerticals: ['upsc', 'ibps-po', 'neet', 'jee-main'],
  lastUpdated: '2026-06-23',
}
