import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 500 * 1024 * 1024,
  targetLabel: '500 MB',
  slug: 'to-500mb',
  h1: 'Compress Video to 500 MB',
  subhead: 'Archival compression for long recordings. Keeps 1080p quality across hour-long footage.',
  intro:
    'Content creators who want to achieve the right balance between video quality and maximum video compression can choose the 500 MB option. You can render a video up to an hour long at CRF 23, which compresses to around 400–600 MB. At this size, the quality degradation is negligible on screen. Excellent for podcasts, webinars, and long gaming sessions.',
  useCases: [
    {
      label: 'Hour-long 1080p screen recordings',
      description: 'Webinars, coding tutorials, and long-form storytelling videos can reach up to 20 gigabytes. Compressing these videos to 500 MB is the sweet spot for maintaining quality.',
    },
    {
      label: 'Discord Nitro full file uploads (500 MB cap)',
      description: 'Discord Nitro (full) allows users to upload videos up to 500 MB. So gamers can store hour-long gameplay recordings, podcasters can upload hour-long videos, and event streamers can store their videos on Discord, all while staying within the 500 MB target.',
    },
    {
      label: 'Podcast video masters for distribution',
      description: 'Buzzsprout and Anchor accept videos between 500 MB and 1 GB.',
    },
  ],
  specificFaq: [
    {
      q: 'Is 500 MB enough for an hour of 1080p video?',
      a: 'Yes — at CRF 23 (Medium compression), an hour of 1080p screen recording or talking-head video typically compresses to 350–550 MB. High-motion content like gaming footage may run 600–800 MB for an hour, in which case use CRF 26–28 or drop to 720p to reach 500 MB.',
    },
    {
      q: 'Is there any quality loss when compressing to 500 MB?',
      a: 'At Medium compression (CRF 23), the difference from the original is invisible to the human eye on any display up to 4K. Only frame-by-frame analysis with pixel-peeping tools can reveal compression artifacts at this level.',
    },
  ],
  relatedSizes: ['to-200mb', 'to-1gb'],
  relatedVerticals: [],
}
