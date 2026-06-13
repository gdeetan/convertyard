import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 10 * 1024,
  targetLabel: '10 KB',
  slug: 'to-10kb',
  h1: 'Compress Image to 10 KB',
  subhead:
    'Hit the exact 10 KB target — typical for signature uploads on government and exam portals.',
  intro:
    "10 KB is the minimum size limit for signature uploads on UPSC, SSC, IBPS, and many other Indian government exam portals. The range is typically 1–40 KB for UPSC and 10–20 KB for SSC, making 10 KB the safe floor that satisfies every portal simultaneously. Photos compressed this small will look visibly degraded — blocky JPEG artifacts become obvious at this size. Signatures are different: a black-on-white scanned signature has very little colour information to lose, so JPEG compression at 10 KB usually produces a clean, readable result. Scan your signature on plain white paper with no background texture, and this compressor will get you to exactly 10 KB.",
  useCases: [
    {
      label: 'UPSC signature upload (typical range: 1–40 KB)',
      description:
        'The UPSC online application portal requires a scanned signature image within a 1–40 KB range. 10 KB keeps you well within the lower bound.',
    },
    {
      label: 'SSC signature upload (10–20 KB)',
      description:
        'Staff Selection Commission forms require a candidate signature image between 10 KB and 20 KB. 10 KB is the exact lower bound.',
    },
    {
      label: 'IBPS signature upload',
      description:
        'IBPS bank exam forms require signature images typically under 20 KB. Compressing to 10 KB satisfies all IBPS portal requirements.',
    },
    {
      label: 'NEET signature upload',
      description:
        "NTA's NEET application portal requires a scanned signature image within strict size limits. 10 KB meets the minimum threshold across all NTA exam portals.",
    },
  ],
  specificFaq: [
    {
      q: 'Will my signature still be readable at 10 KB?',
      a: 'Almost always yes, if it was scanned correctly. A black ink signature on plain white paper has very little colour complexity — JPEG compression removes colour variation, not black-and-white contrast. The signature strokes remain sharp. Signatures with coloured ink, pencil, or background textures may degrade more noticeably.',
    },
    {
      q: 'What pen colour should I use for my signature to get the cleanest result at 10 KB?',
      a: 'Black ink on white paper gives the cleanest compression at 10 KB. Blue ink works almost as well because exam portals convert uploads to grayscale internally. Avoid pencil (low contrast) or gel ink with shading — these introduce colour variation that costs more bytes to encode.',
    },
    {
      q: 'My signature has a faint off-white background. Will that cause a problem?',
      a: 'Yes. Background texture — even subtle paper grain — dramatically increases the file size required to represent the image at a given quality level. Scan your signature on fresh white printer paper under good lighting, or use the background-removal step if the compressor offers it, to get a clean white background before compressing.',
    },
    {
      q: 'The portal requires exactly 10–20 KB. Should I target 10 KB or closer to 20 KB?',
      a: 'Target 10 KB for the signature file and 20 KB for the photo if you want both comfortably within limits. For signatures specifically, quality barely changes between 10 KB and 20 KB for a simple black-on-white scan, so 10 KB is the efficient choice.',
    },
  ],
  relatedSizes: ['to-20kb', 'to-50kb'],
  relatedVerticals: ['upsc', 'ssc-cgl', 'ibps-po'],
}
