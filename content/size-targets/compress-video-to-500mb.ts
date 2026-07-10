import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 500 * 1024 * 1024,
  targetLabel: '500 MB',
  slug: 'to-500mb',
  h1: 'Compress Video to 500 MB',
  subhead: 'Archival compression for long recordings. Keeps 1080p quality across hour-long footage.',
  intro:
    "500 MB is the archival sweet spot for long-form video that you want to store compactly without visible quality loss. An hour of 1080p screen recording at CRF 23 compresses to roughly 400–600 MB — within this range, quality is indistinguishable from the original on any display. This target is also the Discord Nitro (full) upload ceiling, making it useful for sharing long gaming sessions, podcast recordings, and webinar footage with colleagues.",
  useCases: [
    {
      label: 'Hour-long 1080p screen recordings',
      description: 'Webinar recordings, online meeting exports, and coding tutorials run 1–3 hours and often start at 5–20 GB. Compressing to 500 MB maintains full quality for archiving.',
    },
    {
      label: 'Discord Nitro full file uploads (500 MB cap)',
      description: 'Discord Nitro (full) allows file uploads up to 500 MB. Long gameplay recordings, podcast video exports, and event streams fit at this limit.',
    },
    {
      label: 'Podcast video masters for distribution',
      description: 'Podcast platforms like Buzzsprout and Anchor accept video up to 500 MB–1 GB. A 500 MB master is small enough to upload quickly while retaining quality for re-editing.',
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
