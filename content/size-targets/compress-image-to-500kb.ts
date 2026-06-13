import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 500 * 1024,
  targetLabel: '500 KB',
  slug: 'to-500kb',
  h1: 'Compress Image to 500 KB',
  subhead:
    'Visa photos, college admission documents, and banking application photos where quality matters.',
  intro:
    "500 KB is the comfortable ceiling for visa application photos, college admission document uploads, and bank account opening photos. At this size you get a genuinely high-quality image — sharp enough for consulate review, clear enough for document authentication. Indian e-Visa requires photos under 1 MB; Schengen portals vary by member state but 500 KB clears all of them. Note: the US DS-160 non-immigrant visa application caps photos at 240 KB, not 500 KB — if you are applying for a US visa, use the 200 KB option instead. For everything else in this category, 500 KB is the safe, quality-maximising target.",
  useCases: [
    {
      label: 'Indian e-Visa photo',
      description:
        'The Indian e-Visa portal accepts photos up to 1 MB. 500 KB is a clean, high-quality target that is well within the limit and suitable for automated face-matching checks.',
    },
    {
      label: 'Schengen visa photo',
      description:
        'German, French, Dutch, and most other Schengen consulate portals accept photos up to 2 MB per file. 500 KB meets the 35×45 mm photo specification with excellent quality for manual review.',
    },
    {
      label: 'College admission photo upload',
      description:
        'University and college online admission portals typically accept photos up to 500 KB–1 MB. 500 KB covers the stricter portals while maintaining ID-quality resolution.',
    },
    {
      label: 'Bank account opening photo',
      description:
        'Digital KYC flows for Aadhaar-linked bank account opening often cap uploaded photos at 500 KB. Face-matching algorithms perform better on higher-quality images at this size.',
    },
  ],
  specificFaq: [
    {
      q: 'I am applying for a US visa (DS-160). Can I use a 500 KB photo?',
      a: "No. The US Department of State's DS-160 form caps photos at 240 KB and 1200×1200 pixels maximum. A 500 KB photo will be rejected during upload. Use the 200 KB option on ConvertYard to stay within the DS-160 limit.",
    },
    {
      q: 'What are the dimension requirements for a Schengen visa photo?',
      a: '35 mm wide × 45 mm tall is the standard Schengen photo specification. At 300 dpi that is approximately 413×531 pixels. The face should occupy 70–80% of the frame, with the chin at the bottom and the top of the head (or hair) near the top edge. Plain white or off-white background required.',
    },
    {
      q: 'Can I use the same 500 KB photo for multiple visa applications?',
      a: 'Yes, if the photo meets all requirements — recent (within 6 months), white background, neutral expression, no headwear. Indian e-Visa, Schengen, UK Standard Visitor, and most other visa categories accept the same photo format. Check each consulate for any country-specific variation before submitting.',
    },
    {
      q: 'The bank portal says "file too large" at 500 KB. What should I do?',
      a: 'The portal likely has a stricter limit — try 200 KB or 300 KB. Some public-sector bank portals have legacy validators that reject anything above 300 KB despite displaying a 500 KB limit in the help text. If the issue persists, check whether the portal is enforcing a pixel dimension limit rather than (or in addition to) a file size limit.',
    },
  ],
  relatedSizes: ['to-300kb', 'to-1mb', 'to-2mb'],
  relatedVerticals: ['visa-india', 'visa-schengen', 'college-admission'],
}
