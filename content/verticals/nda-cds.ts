import type { VerticalHubConfig } from '@/lib/types'

// NDA and CDS are both UPSC-conducted and use the same upsconline.nic.in portal with the
// same specs as UPSC Civil Services. Triple-signature sheet requirement applies (2026).
// NDA requires civilian clothes in photo. Verified June 2026.
export const ndaCdsConfig: VerticalHubConfig = {
  slug: 'nda-cds',
  name: 'NDA & CDS',
  fullName: 'National Defence Academy and Combined Defence Services Examination',
  country: 'India',
  category: 'exam',
  h1: 'NDA & CDS 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'UPSC-conducted defence exams. Same portal, same specs as UPSC CSE — with a few key differences.',
  intro:
    'NDA (National Defence Academy — for class 12 students) and CDS (Combined Defence Services — for graduates) are both conducted by UPSC and use the same upsconline.nic.in portal with the same upload requirements as UPSC Civil Services. The 2026 triple-signature sheet requirement applies to both. Key differences from UPSC CSE: NDA and CDS require civilian clothing in the application photo (not uniform), and many NDA applicants are still in school when they apply.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo — face fills 3/4 of frame',
      notes: 'Civilian clothes only — no school or service uniform. Face must dominate the frame.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-100kb',
      label: 'Step 2: Compress photo to 100 KB',
      targetBytes: 100 * 1024,
      notes: 'UPSC portal allows 20–200 KB; 100 KB is the practical sweet spot for quality and upload speed',
    },
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 3: Scan and crop the triple-signature sheet',
      notes: 'Sign three times vertically on one sheet of plain white paper in black ink. Scan all three as one image.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 4: Compress signature sheet to 50 KB',
      targetBytes: 50 * 1024,
      notes: 'UPSC signature range is 20–100 KB; 50 KB is a safe mid-range target',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–200 KB',
      dimensions: 'No fixed pixel size — face must fill at least 3/4 of the frame',
      format: 'JPEG / JPG',
      notes: 'White or light background; civilian clothing; taken within 3 months; no eyeglasses',
    },
    {
      documentType: 'Signature (triple-signature sheet)',
      size: '20–100 KB',
      dimensions: '350–500 px (all three signatures on one scanned sheet)',
      format: 'JPEG / JPG',
      notes: 'Sign three times vertically (one below the other) on plain white paper in black ink; scan all three as one image',
    },
    {
      documentType: 'Supporting documents',
      size: 'Up to 500 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Individual upload per document via the UPSC portal',
    },
  ],

  commonMistakes: [
    'Photo in school uniform or service dress: NDA and CDS applications require civilian clothing — a common mistake for class 12 students who reach for their school uniform photo.',
    'Photo older than 3 months: the UPSC portal requires a recent photograph; photos taken more than 3 months before the application date are flagged at SSB.',
    'Missing the triple-signature sheet: the 2026 UPSC portal requires three signatures written vertically on one page — a single signature scan will be rejected.',
    'Eyeglasses in photo: not explicitly banned in the UPSC instructions but routinely flagged during the SSB medical examination; submit without glasses.',
  ],

  specificFaq: [
    {
      q: 'Do NDA and CDS use the same photo and signature specs?',
      a: 'Yes. Both NDA and CDS applications are submitted on the same UPSC portal (upsconline.nic.in) with identical upload requirements: photo 20–200 KB, triple-signature sheet 20–100 KB, all in JPEG format.',
    },
    {
      q: 'Can I wear sunglasses or spectacles in my NDA application photo?',
      a: 'No. The UPSC portal instructions for NDA require a clear photo without eyeglasses. Additionally, spectacles may affect your SSB medical clearance assessment — submit without glasses for both practical and medical reasons.',
    },
    {
      q: 'What is the triple-signature sheet required by the 2026 UPSC portal?',
      a: 'Sign your full signature three times in a vertical column on one plain white A4 sheet using black ink. Leave a small gap between each signature. Scan or photograph all three together as one image, then crop tightly around the column. Upload the single image (20–100 KB, JPEG) as your signature upload.',
    },
    {
      q: 'Can I use my school uniform photo for NDA since I\'m still in class 12?',
      a: 'No. UPSC NDA instructions specifically require civilian clothing — ordinary everyday clothes, not a school uniform, service dress, or any uniform. Take a fresh photo in civilian clothes before applying.',
    },
    {
      q: 'What is the maximum file size for the Medical Certificate upload in CDS?',
      a: 'CDS document uploads through the UPSC portal are capped at 500 KB per file. A medical certificate is typically one page; scan in grayscale at 150 DPI and compress if needed to stay well under 500 KB.',
    },
    {
      q: 'Is NDA registration and CDS registration separate, or do they share a UPSC account?',
      a: 'Both NDA and CDS are registered on the same UPSC One Time Registration (OTR) account at upsconline.nic.in. You create one UPSC OTR profile and use it for NDA, CDS, and UPSC Civil Services applications. Photo and signature uploaded during OTR registration are reused across all UPSC exams.',
    },
  ],

  relatedVerticals: ['upsc', 'capf-ssc-gd', 'ssc-cgl'],
  lastUpdated: '2026-06-23',
}
