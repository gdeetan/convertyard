import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 50 * 1024 * 1024,
  targetLabel: '50 MB',
  slug: 'to-50mb',
  h1: 'Compress Video to 50 MB',
  subhead: 'Under the Slack free-tier cap. Fits Discord standard, Asana, Notion, and most team tools.',
  intro:
    "Slack's free tier caps file uploads at 50 MB. Discord's standard file upload limit is 25 MB (500 MB with Nitro). Check out your corporate intranet and project management software, such as Basecamp, Asana, and Monday.com. Typically, these set a 50–100 MB file size limit. Compressing your video to 50 MB covers all of these at once.",
  useCases: [
    {
      label: 'Slack free-tier file shares (50 MB cap)',
      description: 'Slack’s free and Pro plans allow file uploads up to 50 MB. This includes video updates, screen recordings, and even demo clips that have been compressed to 50 MB or so and uploaded instantly.',
    },
    {
      label: 'Project management tool uploads',
      description: 'Asana, Monday.com, Basecamp, and Notion all enforce file size limits between 50–100 MB for attachments.',
    },
    {
      label: 'Short product demo recordings',
      description: '3–8 min product walkthroughs and onboarding recordings also compress well to 50 MB at 720p.',
    },
  ],
  specificFaq: [
    {
      q: 'How long can a 50 MB video be at 720p?',
      a: 'At 720p with Medium compression (CRF 23), a 50 MB MP4 holds approximately 4–8 minutes of typical screen recording or presentation video. High-motion content fits less — around 2–4 minutes. Use High compression (CRF 28) for longer clips.',
    },
    {
      q: 'Does Slack compress the video again after upload?',
      a: 'Slack does not re-encode video — it stores and serves the file as-is. This means the quality you upload is the quality recipients will download.',
    },
  ],
  relatedSizes: ['to-25mb', 'to-100mb'],
  relatedVerticals: [],
}
