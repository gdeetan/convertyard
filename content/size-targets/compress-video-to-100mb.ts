import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 100 * 1024 * 1024,
  targetLabel: '100 MB',
  slug: 'to-100mb',
  h1: 'Compress Video to 100 MB',
  subhead: 'Hit Discord Nitro Basic and most LMS upload limits. Full 1080p quality at 100 MB.',
  intro:
    '100 MB is equal to the size of Discord Nitro Basic (100 MB) and will cover most learning management systems such as Canvas, Moodle, and Blackboard, which usually set a limit of 100–250 MB for course video uploads. Typically, users can save 10-minute video clips at 1080p, good for basic tutorial videos for content creators.',
  useCases: [
    {
      label: 'Discord Nitro Basic uploads (100 MB cap)',
      description: 'A Discord Nitro Basic user gets an upload limit of 100 MB. That means you can upload your gaming clips, highlights, and other event videos up to 1080p.',
    },
    {
      label: 'Canvas / Moodle course video uploads',
      description: 'University and corporate LMS platforms typically set a file size limit of 100–250 MB for course videos. Lectures and tutorial videos typically compress well to this size target.',
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
