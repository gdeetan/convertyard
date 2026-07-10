import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 100 * 1024 * 1024,
  targetLabel: '100 MB',
  slug: 'to-100mb',
  h1: 'Compress Video to 100 MB',
  subhead: 'Hit Discord Nitro Basic and most LMS upload limits. Full 1080p quality at 100 MB.',
  intro:
    "100 MB covers Discord Nitro Basic (100 MB) and most learning management systems — Canvas, Moodle, and Blackboard typically cap course video uploads at 100–250 MB. At 100 MB you can maintain 1080p quality for clips up to 10 minutes, making this the sweet spot for course content, tutorial recordings, and professional demo videos.",
  useCases: [
    {
      label: 'Discord Nitro Basic uploads (100 MB cap)',
      description: 'Discord Nitro Basic raises the file upload limit from 25 MB to 100 MB. Gaming clips, highlight reels, and event recordings fit at 1080p.',
    },
    {
      label: 'Canvas / Moodle course video uploads',
      description: 'University and corporate LMS platforms often cap course video uploads at 100–250 MB. Lecture recordings and tutorial videos compress well at this target.',
    },
    {
      label: 'Tutorial and how-to video masters',
      description: 'A compressed 100 MB master is small enough to store and share easily while retaining enough quality for re-editing if needed.',
    },
  ],
  specificFaq: [
    {
      q: 'Can I keep 1080p quality at 100 MB?',
      a: 'Yes, for clips under 8–10 minutes. A 5-minute 1080p screen recording at CRF 23 typically compresses to 60–90 MB. For longer clips, either drop to 720p or accept slightly more compression (CRF 26–28).',
    },
    {
      q: 'What is the file upload limit for Discord without Nitro?',
      a: 'Standard Discord accounts are limited to 25 MB. Nitro Basic raises this to 100 MB. Nitro (full) raises it to 500 MB. This page targets the 100 MB Nitro Basic threshold.',
    },
  ],
  relatedSizes: ['to-50mb', 'to-200mb'],
  relatedVerticals: [],
}
