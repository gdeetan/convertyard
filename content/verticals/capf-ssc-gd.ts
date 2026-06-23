import type { VerticalHubConfig } from '@/lib/types'

// Two tracks: SSC GD Constable (ssc.nic.in OTR portal, 20–50 KB photo) and UPSC CAPF AC
// (upsconline.nic.in, 20–200 KB photo). Specs differ significantly — mixing them up is
// the most common mistake for aspirants applying to both. Verified June 2026.
export const capfSscGdConfig: VerticalHubConfig = {
  slug: 'capf-ssc-gd',
  name: 'CAPF & SSC GD',
  fullName: 'Central Armed Police Forces (AC) and SSC GD Constable Recruitment',
  country: 'India',
  category: 'exam',
  h1: 'CAPF & SSC GD 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'CRPF, BSF, ITBP, CISF, SSB, AR — get your files to spec for both SSC GD and CAPF AC portals.',
  intro:
    'Paramilitary recruitment runs through two separate tracks: SSC GD Constable (for Constable posts in CRPF, BSF, ITBP, CISF, SSB, and AR) via the ssc.nic.in OTR portal, and UPSC CAPF AC (for Assistant Commandant posts in all forces) via upsconline.nic.in. The upload specs differ significantly between the two tracks — SSC GD allows only 50 KB for photos while CAPF AC allows 200 KB. Many aspirants who apply to both mix up the specs. This hub covers both.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport size',
      notes: 'Civilian clothes for both SSC GD and CAPF AC — no uniform in the application photo',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo for SSC GD (20–50 KB)',
      targetBytes: 50 * 1024,
      notes: 'SSC GD OTR portal accepts only up to 50 KB — do not use CAPF specs here',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-100kb',
      label: 'Step 3: Compress photo for CAPF AC (20–200 KB)',
      targetBytes: 100 * 1024,
      notes: 'UPSC CAPF portal allows up to 200 KB; 100 KB is the practical sweet spot',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-300kb',
      label: 'Step 4: Compress documents (300–500 KB per file)',
      targetBytes: 300 * 1024,
      notes: 'SSC GD: 300 KB per document. CAPF AC: 500 KB per document via UPSC portal.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'SSC GD Constable — Photograph',
      size: '20–50 KB',
      dimensions: 'Passport size (3.5 cm × 4.5 cm)',
      format: 'JPG / JPEG',
      notes: 'Via ssc.nic.in OTR; civilian clothing; white background',
    },
    {
      documentType: 'SSC GD Constable — Signature',
      size: '10–20 KB',
      dimensions: '3.5 cm × 1.5 cm',
      format: 'JPG / JPEG',
      notes: 'Black ink on plain white paper',
    },
    {
      documentType: 'UPSC CAPF AC — Photograph',
      size: '20–200 KB',
      dimensions: 'Face must fill at least 3/4 of frame',
      format: 'JPEG / JPG',
      notes: 'Via upsconline.nic.in; same specs as UPSC Civil Services; civilian clothing',
    },
    {
      documentType: 'UPSC CAPF AC — Signature (triple-signature sheet)',
      size: '20–100 KB',
      dimensions: '350–500 px (three signatures on one sheet)',
      format: 'JPEG / JPG',
      notes: 'Same 2026 triple-signature requirement as UPSC Civil Services',
    },
    {
      documentType: 'SSC GD — Document scans',
      size: 'Up to 300 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Individual upload; includes Education, Domicile, Caste certificates',
    },
    {
      documentType: 'CAPF AC — Document scans',
      size: 'Up to 500 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Via UPSC portal; higher limit than SSC GD',
    },
  ],

  commonMistakes: [
    'Using CAPF AC specs for SSC GD upload: CAPF AC allows 200 KB photos; SSC GD only allows 50 KB. A 150 KB photo will be rejected by the SSC GD OTR portal.',
    'Uploading a combined PDF of all certificates: both SSC GD and CAPF AC portals require individual document uploads — one PDF per certificate type.',
    'Photo in uniform: both SSC GD and CAPF AC require civilian clothing in the application photo, regardless of any prior military or paramilitary service.',
    'Forgetting SSC GD OTR registration: SSC GD requires a one-time registration on ssc.nic.in before you can apply for GD Constable — both steps have upload requirements.',
  ],

  specificFaq: [
    {
      q: 'What is the difference between CAPF AC and SSC GD photo upload requirements?',
      a: 'SSC GD Constable (ssc.nic.in) allows photos up to 50 KB. UPSC CAPF AC (upsconline.nic.in) allows photos up to 200 KB. If you apply to both, you need two separately compressed versions of the same photograph.',
    },
    {
      q: 'Do I need a separate photo for SSC GD OTR and the actual exam application?',
      a: 'The photo you upload during SSC OTR registration is used for all SSC exams going forward, including SSC GD. If you have already registered for OTR and your photo is on file, you do not re-upload for each exam. If you are registering for the first time, prepare one 20–50 KB photo for OTR.',
    },
    {
      q: 'Can I wear my Army or Navy uniform in a CAPF AC application photo?',
      a: 'No. UPSC instructions for CAPF AC (like all UPSC exams) require civilian clothing. If you are serving personnel applying for CAPF AC, take a fresh photo in civilian dress for the application.',
    },
    {
      q: 'What is the maximum file size for character certificates in SSC GD?',
      a: 'SSC GD document uploads are capped at 300 KB per file. Scan certificates in grayscale at 150 DPI and compress with the PDF tool above — a single A4 certificate compresses cleanly to under 150 KB.',
    },
    {
      q: 'Does CRPF, BSF, and CISF each have different document requirements, or do they use the same SSC GD form?',
      a: 'All paramilitary forces (CRPF, BSF, ITBP, CISF, SSB, AR) under the SSC GD Constable recruitment use the same SSC GD online application form and the same document requirements via ssc.nic.in. There is no separate form per force — you rank your preferences during the application.',
    },
    {
      q: 'Can I use the same photo for SSC GD and SSC CGL applications in the same year?',
      a: 'If both applications are within 6 months and the photo meets the specs for both, yes. SSC GD and SSC CGL both use 20–50 KB photos uploaded via the SSC OTR system. The same OTR registration photo is used for all SSC exams.',
    },
  ],

  relatedVerticals: ['ssc-cgl', 'nda-cds', 'upsc'],
  lastUpdated: '2026-06-23',
}
