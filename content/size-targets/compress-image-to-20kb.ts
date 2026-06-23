import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 20 * 1024,
  targetLabel: '20 KB',
  slug: 'to-20kb',
  h1: 'Compress Image to 20 KB',
  subhead:
    'The SSC signature upper limit and minimum for many UPSC document images.',
  intro:
    "20 KB is the sweet spot for signature images on Indian government exam portals. SSC forms require signatures between 10 KB and 20 KB; 20 KB lets you squeeze out a little more detail than the 10 KB floor. UPSC accepts signatures up to 40 KB, so 20 KB is a conservative middle ground. For photographs, 20 KB is very tight — thumbnail-scale images (under 100×100 px) can work, but passport-format photos look heavily compressed at this size. Use 50 KB for passport photos; save 20 KB for signatures and small document thumbnails.",
  useCases: [
    {
      label: 'SSC signature upload (10–20 KB)',
      description:
        'Staff Selection Commission forms accept signatures between 10 KB and 20 KB. 20 KB is the upper limit and provides better quality than 10 KB.',
    },
    {
      label: 'UPSC compact document images',
      description:
        'UPSC portal document images can go down to 20 KB where file size limits are strict. Suitable for simple typed or printed document scans.',
    },
    {
      label: 'Social media thumbnails',
      description:
        'Small thumbnails for profile icons or favicon-sized brand images can be delivered at 20 KB without visible quality loss at small display sizes.',
    },
    {
      label: 'NEET and JEE signature uploads',
      description:
        "NTA exam portals for NEET, JEE Main, and JEE Advanced require candidate signatures within 10–20 KB. 20 KB is the upper limit for all NTA portals.",
    },
  ],
  specificFaq: [
    {
      q: 'Is 20 KB better than 10 KB for signature uploads?',
      a: 'Marginally. A black-on-white signature has so little colour complexity that the quality improvement from 10 KB to 20 KB is barely perceptible. The main benefit of targeting 20 KB is that you stay at the upper limit of the allowed range, giving the compressor more headroom to work with. If the portal allows 10–20 KB, targeting 20 KB is the safer and slightly higher-quality choice.',
    },
    {
      q: 'Can I compress a passport photo to 20 KB?',
      a: "You can, but you shouldn't for exam applications. At 20 KB a 35×45 mm passport photo looks blocky and may be rejected on quality grounds by automated portal checks. Indian exam portals that require passport photos set a minimum of 20–50 KB. Use the 50 KB compressor for passport photos.",
    },
    {
      q: 'My SSC form says the signature must be under 20 KB. Will exactly 20 KB be rejected?',
      a: "Portals typically implement 'under 20 KB' as ≤ 20,480 bytes. The compressor targets slightly below the ceiling (around 18–20 KB) to guarantee you fall within the accepted range. If you get a rejection, try the 10 KB option as a fallback.",
    },
    {
      q: 'How do I scan my signature to get the cleanest 20 KB result?',
      a: 'Sign on plain white A4 paper with black or blue ballpoint ink. Scan at 200 dpi — higher resolution just adds file size without improving legibility at 20 KB. Crop tightly around the signature, leaving a small white margin. Good lighting prevents background greyness that wastes bytes.',
    },
  ],
  relatedSizes: ['to-10kb', 'to-50kb', 'to-100kb'],
  relatedVerticals: ['ssc-cgl', 'upsc', 'uppsc', 'bpsc', 'mpsc', 'tnpsc', 'kpsc', 'sbi', 'rbi-grade-b', 'insurance-exams'],
}
