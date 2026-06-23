import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 100 * 1024,
  targetLabel: '100 KB',
  slug: 'to-100kb',
  h1: 'Compress Image to 100 KB',
  subhead:
    'The UPSC, NEET, and JEE photo upload limit — more detail, square format.',
  intro:
    "100 KB is the photo upload ceiling for UPSC Civil Services, NEET, JEE Main, JEE Advanced, and GATE applications. These exams set a higher limit than SSC or IBPS because they require square-format photos — typically 350×350 pixels — which carry more pixel data than a rectangular passport crop. UPSC accepts photos from 20 KB to 300 KB, but 100 KB is the practical sweet spot: visibly clearer than a 50 KB upload, well under the limit, and small enough to upload reliably on a slow connection. This compressor targets 90–100 KB, giving you the full benefit of the higher allowance.",
  useCases: [
    {
      label: 'UPSC Civil Services application photo',
      description:
        'UPSC accepts photos from 20 KB to 300 KB. 100 KB provides good quality while leaving margin from the upper limit, and is accepted by every UPSC recruitment portal.',
    },
    {
      label: 'NEET 2026 photo upload',
      description:
        "NTA's NEET application requires a recent passport-size photograph with a white background, compressed within the portal's size limits. 100 KB is within the accepted range for all NTA exam portals.",
    },
    {
      label: 'JEE Main / Advanced photo upload',
      description:
        'JEE Main and Advanced applications require a square photo (typically 3.5×4.5 cm as specified by NTA) within the upload size limit. 100 KB sits comfortably within the allowed range.',
    },
    {
      label: 'GATE application photo',
      description:
        'IIT GATE applications require a passport-size photograph uploaded within specified size limits. 100 KB is accepted across all GATE exam cycles.',
    },
    {
      label: 'Postgraduate entrance exams',
      description:
        'CAT, XAT, SNAP, NMAT, and most IIM/university entrance forms use a 100 KB photo ceiling. One compressed image works for all of them.',
    },
  ],
  specificFaq: [
    {
      q: 'Why do UPSC and NEET require a square photo when passport photos are rectangular?',
      a: "UPSC and NTA use square crops (typically 200×200 or 350×350 px) for their admit card and hall ticket displays. Rectangular passport photos get stretched to fill a square frame, which distorts the face. Take or crop your photo as a square before uploading to avoid this. The standard 3.5×4.5 cm portrait dimensions specified in some NTA notifications refer to the print size on the hall ticket, not the file's aspect ratio.",
    },
    {
      q: 'UPSC says my photo must be between 20 KB and 300 KB. What size is best?',
      a: '100 KB is the practical sweet spot. It is clear enough for hall ticket printing and admit card display, well within the range, and uploads reliably even on mobile data connections. Going up to 300 KB adds marginal quality improvement but can cause upload timeouts on slow government portal servers.',
    },
    {
      q: 'My photo is already 85 KB. Should I compress it to exactly 100 KB to use more of the allowance?',
      a: "No. Increasing a file from 85 KB to 100 KB would require adding artificial noise or expanding metadata — neither improves actual image quality. If your photo is already within the portal's range, upload it as-is.",
    },
    {
      q: 'Can I use the same photo for UPSC, NEET, JEE, and GATE?',
      a: 'If the photo meets the requirements for all four — recent, white background, facing forward, no headwear — then yes, one photo can work for all. Confirm each portal accepts square crops; if any requires a rectangular passport format, you will need two crops of the same photo.',
    },
  ],
  relatedSizes: ['to-50kb', 'to-200kb', 'to-300kb'],
  relatedVerticals: ['upsc', 'neet', 'jee-main', 'gate', 'nda-cds', 'capf-ssc-gd'],
}
