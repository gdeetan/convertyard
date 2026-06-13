import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 1 * 1024 * 1024,
  targetLabel: '1 MB',
  slug: 'to-1mb',
  h1: 'Compress Image to 1 MB',
  subhead:
    'The practical limit for LinkedIn profile photos, social media uploads, and design portfolios.',
  intro:
    "1 MB is the inflection point between 'portal upload' and 'web display' image sizes. LinkedIn explicitly caps profile photo uploads at 1 MB; Instagram recompresses anything you send it but rewards uploads already near its internal quality threshold; Behance and Dribbble encourage large previews but their CDNs work best under 1 MB per asset. At 1 MB you can upload a high-resolution portrait or product photograph and see no visible quality loss compared to the source. This compressor targets 900 KB–1 MB, giving you maximum quality at the ceiling.",
  useCases: [
    {
      label: 'LinkedIn profile photo',
      description:
        'LinkedIn caps profile photo uploads at 1 MB and 20,000 × 20,000 px. A clean, well-lit headshot compressed to 1 MB uploads instantly and displays sharply across all devices.',
    },
    {
      label: 'Instagram post uploads',
      description:
        "Instagram recompresses images on upload. Sending a file already close to Instagram's internal quality threshold (around 1 MB for a 1080 px wide JPEG) minimises double-compression artefacts.",
    },
    {
      label: 'Behance and Dribbble portfolio images',
      description:
        'Design portfolio platforms recommend large, sharp previews. 1 MB gives enough data for a full-bleed portfolio cover or a detailed UI screenshot at 2x resolution.',
    },
    {
      label: 'Website hero images',
      description:
        'A responsive hero image served at 1400 px wide with modern JPEG compression fits comfortably under 1 MB while remaining sharp on high-DPI displays.',
    },
  ],
  specificFaq: [
    {
      q: 'Will LinkedIn compress my photo further after I upload it at 1 MB?',
      a: "Yes. LinkedIn reprocesses uploaded photos to its own display format. Uploading at 1 MB gives LinkedIn's encoder more data to work with, which typically results in a sharper displayed photo than uploading an already-compressed 200 KB file.",
    },
    {
      q: 'Instagram says it supports files up to 30 MB. Why compress to 1 MB?',
      a: "Instagram recompresses every image you upload regardless of input size. Its recompression is lossy — it applies its own quality reduction on top of yours. Uploading at 1 MB rather than 8 MB doesn't give you a higher-quality result on Instagram; it just avoids the performance hit of uploading a large file over mobile data. For maximum Instagram quality, upload at 1080×1080 px (square) or 1080×1350 px (portrait) and let Instagram handle the display sizing.",
    },
    {
      q: 'What is the best image format for a 1 MB LinkedIn profile photo?',
      a: "JPEG for photos (faces, backgrounds, gradients). PNG only if your photo has a transparent background or hard geometric edges, which is unusual for a profile photo. LinkedIn accepts both formats under 1 MB. WebP is not accepted by LinkedIn's upload interface.",
    },
    {
      q: 'I have a 24 MP camera photo at 12 MB. How much quality is lost at 1 MB?',
      a: "For a portrait photo, the quality difference between 12 MB and 1 MB is negligible at web display sizes (under 2000 px wide). Humans cannot distinguish JPEG quality levels above roughly 80% on a calibrated display. The compressor uses quality-optimal settings — you'll get a 1 MB file that looks identical to the 12 MB original at any screen size you'd actually use.",
    },
  ],
  relatedSizes: ['to-500kb', 'to-2mb', 'to-5mb'],
  relatedVerticals: ['linkedin', 'social-media', 'portfolio'],
}
