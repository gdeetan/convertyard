import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 200 * 1024 * 1024,
  targetLabel: '200 MB',
  slug: 'to-200mb',
  h1: 'Compress Video to 200 MB',
  subhead: 'WeTransfer free tier, iMessage video limits, and long-form 1080p clips.',
  intro:
    "WeTransfer's free tier caps transfers at 2 GB total, but its per-file practical sweet spot for fast transfer is 200 MB or less. iMessage on cellular networks compresses large video before sending — keeping your clip under 200 MB bypasses this automatic quality reduction. At 200 MB you can archive 20–30 minute 1080p recordings while keeping quality high enough for professional review.",
  useCases: [
    {
      label: 'WeTransfer free-tier file transfers',
      description: 'WeTransfer free allows up to 2 GB per transfer. Individual video files under 200 MB upload and download faster and are less likely to hit timeout issues on slow connections.',
    },
    {
      label: 'iMessage video without automatic compression',
      description: 'iMessage automatically compresses large video files when sending over cellular. Files under ~200 MB often bypass this auto-compression, preserving your quality.',
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
      a: 'WeTransfer Free allows 2 GB per transfer and up to 50 files. There is no per-file limit within that 2 GB total. However, files over 200 MB can time out on slow connections.',
    },
  ],
  relatedSizes: ['to-100mb', 'to-500mb'],
  relatedVerticals: [],
}
