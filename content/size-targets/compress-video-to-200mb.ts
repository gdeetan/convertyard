import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 200 * 1024 * 1024,
  targetLabel: '200 MB',
  slug: 'to-200mb',
  h1: 'Compress Video to 200 MB',
  subhead: 'Long 1080p clips that still transfer fast. Covers WeTransfer and most file-sharing tools.',
  intro:
    "WeTransfer's free tier allows up to 2 GB per transfer, but files under 200 MB upload and download noticeably faster on typical home connections. At 200 MB you can archive 20–30 minute 1080p recordings while keeping quality high enough for professional review — well above the visible quality threshold for screen viewing.",
  useCases: [
    {
      label: 'WeTransfer free-tier file transfers',
      description: 'WeTransfer free allows up to 2 GB per transfer. Individual video files under 200 MB upload and download faster and are less likely to hit timeout issues on slow connections.',
    },
    {
      label: 'Long interview or meeting recordings',
      description: 'A 1-hour interview or recorded meeting at 1080p compresses to 150–200 MB — small enough to email or share via most cloud links without storage penalties.',
    },
    {
      label: 'Long-form tutorial recordings for review',
      description: '20–30 minute 1080p tutorial recordings or product walkthroughs for client review fit at 200 MB with good quality retention.',
    },
  ],
  specificFaq: [
    {
      q: 'How long can a 1080p video be at 200 MB?',
      a: 'At 1080p Medium compression (CRF 23), 200 MB holds approximately 15–25 minutes of screen recording or talking-head video. High-motion content (gaming, action sports) fits 8–15 minutes. For longer recordings, use High compression (CRF 28) or drop to 720p.',
    },
    {
      q: 'Does WeTransfer have a per-file size limit?',
      a: 'WeTransfer Free allows up to 2 GB per transfer across up to 50 files. Files under 200 MB complete transfers faster on slower connections and are less likely to stall mid-upload.',
    },
  ],
  relatedSizes: ['to-100mb', 'to-500mb'],
  relatedVerticals: [],
}
