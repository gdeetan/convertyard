import type { VerticalHubConfig } from '@/lib/types'

// Specs from US Department of State travel.state.gov. Square photo (600×600–1200×1200 px),
// max 240 KB, JPG only. Eyeglasses banned per 2023 update. India is the largest source
// of US visa applicants. Verified June 2026.
export const usDs160VisaConfig: VerticalHubConfig = {
  slug: 'us-ds-160-visa',
  name: 'US DS-160 Visa',
  fullName: 'United States Nonimmigrant Visa Application (DS-160)',
  country: 'United States',
  category: 'visa',
  h1: 'US DS-160 Visa Photo — Get the Exact Spec Right',
  subhead:
    'US Embassy photo requirements are strict. Wrong specs mean rejection at the consulate window, not just at upload.',
  intro:
    'The DS-160 is the US nonimmigrant visa application form used for B1/B2 tourist visas, F1 student visas, H1B, L1, and other categories. Photo requirements are set by the US Department of State and are more exacting than most Indian government portals. A wrong photo — wrong background, wrong shape, or over 240 KB — can cause the consular officer to reject your application after you have already paid the visa fee and travelled to the embassy. India is the largest source of US visa applicants globally, making this the most consequential document upload many applicants will face.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop to square — face fills 50–69% of the frame',
      notes: 'DS-160 requires a square photo. Use the 1:1 crop in the cropper. Face from top of head to chin should occupy 50–69% of the photo height.',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-200kb',
      label: 'Step 2: Compress to under 240 KB (JPG)',
      targetBytes: 200 * 1024,
      notes: 'US portal max is 240 KB — target 200 KB for a safe margin. JPG format only.',
    },
  ],

  officialSpecs: [
    {
      documentType: 'DS-160 Visa Photo',
      size: 'Max 240 KB',
      dimensions: '600×600 px minimum, 1200×1200 px maximum (square)',
      format: 'JPG only',
      notes: 'Color, neutral expression, mouth closed, white or off-white background, no glasses, no head covering (except religious), taken within 6 months',
    },
  ],

  commonMistakes: [
    'Wearing glasses: per a 2023 US Department of State update, no glasses are permitted in DS-160 photos — including prescription glasses. This was previously allowed. The portal may accept the upload but the consular officer will reject the application.',
    'Non-square crop: DS-160 requires a square (1:1) photo. A standard portrait passport photo with a 3:4 or 2:3 ratio will fail the State Department\'s photo processing tool even if the upload succeeds.',
    'Grey or studio-gradient background: the US standard specifies white or off-white only. Light grey studio backgrounds — common in India studios — are rejected.',
    'File over 240 KB: the DS-160 portal accepts the upload but the photo processing tool rejects it downstream and shows an error on the next page. Target 200 KB to stay safely under.',
    'Photo older than 6 months: consular officers verify photo recency against your current appearance at the interview window. Submit a recent photo.',
    'Head covering without a religious exemption statement: any head covering (including a dupatta or scarf) requires a separate written statement of religious necessity submitted with the application.',
  ],

  specificFaq: [
    {
      q: 'Can I wear glasses in my DS-160 visa photo?',
      a: 'No. As of a 2023 US Department of State update, eyeglasses are no longer permitted in US visa photos — including prescription glasses. If your current passport photo has glasses, take a new photo without them for the DS-160 application.',
    },
    {
      q: 'Does DS-160 require a square photo or a standard passport photo?',
      a: 'DS-160 requires a square (1:1) photo, not a standard rectangular passport photo. The photo must be between 600×600 and 1200×1200 pixels. A rectangular passport crop will fail the State Department\'s automated photo check.',
    },
    {
      q: 'What background color is acceptable for a DS-160 visa photo?',
      a: 'White or off-white only. A pure white background is always safe. Light cream is usually acceptable. Light grey (common in Indian photo studios) is not acceptable. Avoid any background with patterns, colors, or gradients.',
    },
    {
      q: 'My DS-160 photo upload succeeded but the application shows a photo error — what happened?',
      a: 'The DS-160 upload step and the photo validation step are separate. The portal accepts any JPEG file during upload, but a second automated check validates size, dimensions, background, and face position. If you see an error after upload, the most common causes are: file over 240 KB, non-square crop, or a grey background.',
    },
    {
      q: 'Can I use the same photo for a DS-160 and a Canadian visa application?',
      a: 'Likely not. Canadian visa photos follow ICAO standards (35×45 mm rectangular, different face-fill percentage). DS-160 requires a square crop. Take two separate crops from the same photograph — one square for DS-160, one portrait for Canadian applications.',
    },
    {
      q: 'What is the difference between DS-160 and DS-260 photo requirements?',
      a: 'DS-260 is the immigrant visa application (green card). Both DS-160 and DS-260 follow the same US photo standards: square, 600×600 to 1200×1200 px, white background, no glasses, max 240 KB. The difference is the visa category, not the photo spec.',
    },
  ],

  relatedVerticals: ['us-college-application'],
  lastUpdated: '2026-06-23',
}
