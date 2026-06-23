import type { VerticalHubConfig } from '@/lib/types'

// Specs from UPPSC official notifications (uppsc.up.nic.in). Photo ceiling 50 KB is tighter
// than UPSC's 200 KB — a common trap for aspirants applying to both. Verified June 2026.
export const uppscConfig: VerticalHubConfig = {
  slug: 'uppsc',
  name: 'UPPSC',
  fullName: 'Uttar Pradesh Public Service Commission',
  country: 'India',
  category: 'exam',
  h1: 'UPPSC 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'Hit the exact KB limits UPPSC requires. Everything in your browser. No uploads to anyone.',
  intro:
    'UPPSC conducts PCS, RO/ARO, Lower Subordinate, and dozens more exams each year. All share the same photo and signature upload ranges, but the KB ceilings are tighter than UPSC. Most rejections at the upload stage happen because aspirants use UPSC specs — 200 KB photo — instead of UPPSC\'s 50 KB ceiling. Prepare your files here first, then upload directly to the UPPSC portal at uppsc.up.nic.in.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport size',
      notes: '3.5×4.5 cm portrait, white background, face fills 2/3 of the frame',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 20–50 KB',
      targetBytes: 50 * 1024,
      notes: 'Stay under 50 KB; 30–40 KB is the sweet spot for UPPSC',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 5–30 KB',
      targetBytes: 20 * 1024,
      notes: 'Black ink on plain white paper; 3.5×1.5 cm crop',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-300kb',
      label: 'Step 4: Compress document scans to 300 KB',
      targetBytes: 300 * 1024,
      notes: 'Each certificate uploaded separately — do not merge into one PDF',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–50 KB',
      dimensions: '3.5 cm × 4.5 cm',
      format: 'JPG / JPEG',
      notes: 'Color photo, white background, recent (within 6 months)',
    },
    {
      documentType: 'Signature',
      size: '5–30 KB',
      dimensions: '3.5 cm × 1.5 cm',
      format: 'JPG / JPEG',
      notes: 'Black ink on plain white paper',
    },
    {
      documentType: 'Document scans (certificates, marksheets)',
      size: 'Up to 300 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Individual upload per document type — do not merge',
    },
  ],

  commonMistakes: [
    'Photo over 50 KB: the UPPSC portal accepts the upload but shows a broken thumbnail in the final application preview — discovered too late to fix.',
    'Using UPSC photo specs (200 KB): a common mistake for aspirants applying to both; UPPSC\'s ceiling is 50 KB, not 200 KB.',
    'Signature in pencil or light ink: visible at magnification during document verification; some District Service Selection Boards reject it at interview.',
    'Non-white background on photo: silently rejected at document verification, not at upload — you won\'t find out until DV day.',
    'Merging multiple certificates into one PDF: UPPSC requires individual uploads per document; combined PDFs are rejected at the portal level.',
  ],

  specificFaq: [
    {
      q: 'What is the photo size limit for UPPSC — is it 50 KB or 200 KB?',
      a: 'UPPSC\'s photo limit is 20–50 KB. This is tighter than UPSC\'s 20–200 KB range. If you have been using your UPSC photo file (which can be up to 200 KB), it will likely be rejected by the UPPSC portal. Compress to 30–40 KB for a comfortable margin.',
    },
    {
      q: 'What\'s the difference between UPPSC PCS and UPSC Civil Services upload requirements?',
      a: 'Both require a JPEG passport photo and a handwritten signature, but UPPSC caps the photo at 50 KB while UPSC allows up to 200 KB. UPPSC also uses the uppsc.up.nic.in portal separately from UPSC\'s upsconline.nic.in — you need to upload fresh files for each.',
    },
    {
      q: 'Can I use the same photo for UPPSC PCS prelims and mains registration?',
      a: 'Yes, provided the photo is still recent when you register for mains. UPPSC requires a recent photograph — if more than 6 months have passed since your prelims registration, take a new photo for mains.',
    },
    {
      q: 'How do I scan my EWS or caste certificate to stay under 300 KB?',
      a: 'Scan in grayscale at 150 DPI rather than 300 DPI color. A single A4 page scanned at 150 DPI grayscale typically comes out at 80–150 KB before compression. Then run it through the PDF compressor to hit under 300 KB.',
    },
    {
      q: 'Which image format does UPPSC accept for photo and signature uploads?',
      a: 'UPPSC accepts JPG/JPEG only. PNG files — even if renamed to .jpg — will fail portal validation. The tools on this page always output genuine JPEG files.',
    },
    {
      q: 'My signature scan keeps coming out above 30 KB. How do I reduce it?',
      a: 'Sign on plain white A4 paper with black ballpoint pen, then photograph or scan just the signature area — do not leave large white margins. Crop tightly before compressing. A clean black-on-white signature crops to roughly 400×150 pixels, which compresses cleanly to under 20 KB at JPEG quality 80.',
    },
  ],

  relatedVerticals: ['upsc', 'bpsc', 'mpsc', 'ssc-cgl'],
  lastUpdated: '2026-06-23',
}
