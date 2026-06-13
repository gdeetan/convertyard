import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 50 * 1024,
  targetLabel: '50 KB',
  slug: 'to-50kb',
  h1: 'Compress Image to 50 KB',
  subhead:
    'Standard passport-photo size for SSC CGL, IBPS, RRB, and state PSC exam uploads.',
  intro:
    "50 KB is the standard cap for passport-format photos on Indian government exam application forms. SSC CGL accepts photos between 20 KB and 50 KB; IBPS PO and Clerk portals use the same range; Railway RRB and most state PSC forms follow suit. The reasoning is practical: a 3.5×4.5 cm passport photo scanned at 200 dpi, saved as JPEG at around 80% quality, comes out close to 50 KB. Anything larger suggests the candidate scanned at too high a resolution or used PNG format — both common mistakes that cause upload rejections. This compressor targets 45–50 KB to give you maximum quality at the ceiling.",
  useCases: [
    {
      label: 'SSC CGL photo upload (20–50 KB)',
      description:
        'Staff Selection Commission Combined Graduate Level exam forms require a recent passport-format photograph between 20 KB and 50 KB in JPEG format.',
    },
    {
      label: 'IBPS PO / Clerk photo upload',
      description:
        'IBPS bank exam portals require candidate photos in the 20–50 KB range. The same limit applies to IBPS Specialist Officer and RRB Office Assistant exams.',
    },
    {
      label: 'Railway RRB application photo',
      description:
        'Railway Recruitment Board online applications require a passport-size photo between 20 KB and 50 KB. The photo must have a plain white or light background.',
    },
    {
      label: 'Various state PSC exam photo uploads',
      description:
        'UPPSC, BPSC, MPSC, RPSC, and most other state Public Service Commission portals follow the same 20–50 KB photo limit as their central government counterparts.',
    },
  ],
  specificFaq: [
    {
      q: 'What are the correct dimensions for a passport photo on Indian exam forms?',
      a: 'Standard dimensions are 3.5 cm wide × 4.5 cm tall (approximately 413×531 pixels at 300 dpi). Most portals accept a slight variation — 35×45 mm is the exact standard. Do not crop to a square; passport photos are portrait-oriented rectangles.',
    },
    {
      q: 'My photo is 4 MB from my phone camera. Will it compress cleanly to 50 KB?',
      a: 'Yes. A modern phone photo is typically 12–48 megapixels; a passport photo needs roughly 0.2 megapixels. The compressor will resize the image to appropriate dimensions first, then apply JPEG quality reduction to hit 50 KB. The result will be sharp and clear for a passport-format portrait.',
    },
    {
      q: 'The portal says JPEG only. Can I upload a PNG compressed to 50 KB?',
      a: 'No. Many portals validate the file extension and MIME type. Upload a file that claims to be PNG and it will be rejected even if the byte count is correct. This compressor outputs a genuine JPEG file. If you started with a PNG photo, the output will be saved as .jpg.',
    },
    {
      q: 'What background colour is required for Indian exam passport photos?',
      a: 'Almost all Indian government exam portals specify a plain white background. Some specify "plain light" background without strict white — but white is always safe. Avoid studio backgrounds with gradients, patterns, or any colour other than white.',
    },
  ],
  relatedSizes: ['to-20kb', 'to-100kb', 'to-200kb'],
  relatedVerticals: ['ssc-cgl', 'ibps-po', 'rrb'],
}
