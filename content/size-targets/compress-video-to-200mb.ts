import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 200 * 1024 * 1024,
  targetLabel: '200 MB',
  slug: 'to-200mb',
  h1: 'Compress Video to 200 MB',
  subhead: 'Long 1080p clips that still transfer fast. Covers WeTransfer and most file-sharing tools.',
  intro:
    "WeTransfer's free tier has a 2-gigabyte transfer limit. Files under 200 MB will upload and download faster over a standard home internet connection. A 200 MB file can save a 20- to 30-minute 1080p video without sacrificing quality.",
  useCases: [
    {
      label: 'WeTransfer free-tier file transfers',
      description: 'WeTransfer free allows up to 2 GB per transfer. As noted above, videos under 200 MB upload and download faster and are less likely to experience timeouts, even on slow connections.',
    },
    {
      label: 'Long interview or meeting recordings',
      description: 'Compress a 1-hour podcast or live stream at 1080p and upload it on most cloud services without paying for extra storage.',
    },
    {
      label: 'Long-form tutorial recordings for review',
      description: 'Send long-form, 20- to 30-minute product reviews in 1080p for client review without compromising on video quality, at 200 MB.',
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
