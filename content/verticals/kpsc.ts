import type { VerticalHubConfig } from '@/lib/types'

// Specs from KPSC portal (kpsc.kar.nic.in). Photo 20–50 KB, signature 10–30 KB.
// Portal gives unhelpful "invalid format" errors without indicating which file failed.
// Some posts require Kannada versions of certificates. Verified June 2026.
export const kpscConfig: VerticalHubConfig = {
  slug: 'kpsc',
  name: 'KPSC',
  fullName: 'Karnataka Public Service Commission',
  country: 'India',
  category: 'exam',
  h1: 'KPSC 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'Get your KPSC photo and documents to spec. Browser-only, no file uploads to any server.',
  intro:
    'KPSC applications are submitted via kpsc.kar.nic.in. The portal has strict upload validation that rejects files outside the specified ranges, often without a helpful error message — making it hard to know which file failed. Photo requirements are consistent across Group A, B, C, and D exams, but document language requirements vary by post. Prepare all files here before opening the KPSC portal.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport size',
      notes: '3.5×4.5 cm portrait, white background, face clearly visible',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 20–50 KB',
      targetBytes: 50 * 1024,
      notes: 'Target 35–45 KB for a safe margin below the portal ceiling',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 10–30 KB',
      targetBytes: 20 * 1024,
      notes: 'Black ink on plain white paper; sign inside a visible box if required',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-300kb',
      label: 'Step 4: Compress document scans to 300 KB',
      targetBytes: 300 * 1024,
      notes: 'Upload each certificate individually — check Kannada language requirement per post',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–50 KB',
      dimensions: '3.5 cm × 4.5 cm',
      format: 'JPG / JPEG',
      notes: 'Color, white background, recent photo',
    },
    {
      documentType: 'Signature',
      size: '10–30 KB',
      dimensions: '3.5 cm × 1.5 cm',
      format: 'JPG / JPEG',
      notes: 'Black ink on plain white paper; some posts require signature inside a bordered box',
    },
    {
      documentType: 'Document scans (certificates)',
      size: 'Up to 300 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Individual upload; Kannada versions may be required for Karnataka state certificates',
    },
  ],

  commonMistakes: [
    'Uploading PNG instead of JPG: KPSC portal returns "invalid format" without specifying which file caused the issue — causing applicants to re-upload everything when only one file was wrong.',
    'Missing OBC/SC/ST certificate in Kannada: KPSC may require a Kannada-language version of caste certificates for Karnataka state-level verification at DV.',
    'Photo with off-white or cream studio background: KPSC verification checks for a white background; cream and off-white shades are sometimes rejected.',
    'Signature scan with heavy shadows or yellowish background: artificial light photography of signatures often creates a warm-toned background that compresses poorly and can be flagged.',
  ],

  specificFaq: [
    {
      q: 'Do KPSC FDA/SDA exams have the same photo requirements as KPSC Group A exams?',
      a: 'Yes — all KPSC exam applications go through kpsc.kar.nic.in with the same photo (20–50 KB, JPEG) and signature (10–30 KB, JPEG) requirements, regardless of whether the post is FDA/SDA or Group A/B.',
    },
    {
      q: 'Can I submit an English-medium caste certificate for KPSC posts?',
      a: 'English-medium certificates issued by Karnataka state authorities are generally accepted. However, for OBC/SC/ST certificates specifically, some post notifications require a certificate issued in Kannada or bilingual format. Check your specific notification.',
    },
    {
      q: 'Why is my signature being rejected when it\'s the right file size?',
      a: 'Most likely a file format issue — the portal requires JPEG, not PNG or BMP. Even if you rename a PNG to .jpg, the portal detects the true format. Use the image compressor above, which always outputs genuine JPEG files.',
    },
    {
      q: 'How do I reduce a scanned certificate from 800 KB to under 300 KB?',
      a: 'The 800 KB file was likely scanned at 300 DPI in color. Use the PDF compressor above. It reduces DPI and converts color to grayscale where safe, bringing a single-page certificate to 100–200 KB without losing readability.',
    },
    {
      q: 'Does KPSC accept photos taken on a smartphone?',
      a: 'Yes, provided the photo meets the specs: plain white background, well-lit, face clearly visible, JPEG format, 20–50 KB. Smartphone photos are typically 3–8 MB and need significant compression before uploading. Crop to passport size first, then compress.',
    },
    {
      q: 'Can I reuse my KPSC photo for multiple exam applications in the same year?',
      a: 'Yes, as long as the photo remains recent. If your first KPSC application was in January and the next is in December of the same year, the same photo file should be acceptable — but confirm the notification\'s "recent photo" clause for each exam.',
    },
  ],

  relatedVerticals: ['tnpsc', 'mpsc', 'upsc', 'ssc-cgl'],
  lastUpdated: '2026-06-23',
}
