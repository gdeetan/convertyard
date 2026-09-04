import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 10 * 1024 * 1024,
  targetLabel: '10 MB',
  slug: 'to-10mb',
  h1: 'Compress Video to 10 MB',
  subhead: 'Hit the WhatsApp and Telegram share limit. Drop the file, click compress.',
  intro:
    'When sending a video via WhatsApp, Telegram, by email, or even as a social media story, it is best to keep the original file size as low as possible. The maximum sizes for video shares on WhatsApp and Telegram are 16 MB and 50 MB, respectively, but these limits are often lower than most people’s data caps. In reality, 10 MB or even lower is far better, as videos of this size will download in under 10 seconds on a 3G connection. Short clips (under 2 minutes), talking-head videos, and screen recordings all compress well to about 10 MB at 720p or lower.',
  useCases: [
    {
      label: 'WhatsApp video shares',
      description: 'WhatsApp already compresses videos that users share. Therefore, to avoid artifacts from double compression, it is better to send the video in a pre-compressed format.',
    },
    {
      label: 'Telegram direct messages',
      description: 'Short video clips sent to individuals via Telegram chat are instantly delivered to mobile recipients when kept under 10 MB.',
    },
    {
      label: 'Email video attachments',
      description: 'Most email clients allow files up to 10–25 MB to be opened directly from the email without clicking a link to view the video online.',
    },
    {
      label: 'Social media story uploads',
      description: 'Videos loaded as compressed files will also perform better in stories on Instagram, Facebook and TikTok and even get more views.',
    },
  ],
  specificFaq: [
    {
      q: 'How long can a video be at 10 MB?',
      a: 'At 720p, Medium compression (CRF 23), a 10 MB MP4 holds roughly 60–90 seconds of typical screen recording or talking-head video. High-motion content (sports, action) fits less — approximately 30–45 seconds. Simple scenes (slide presentations, static backgrounds) can fit 2–3 minutes.',
    },
    {
      q: 'Will WhatsApp compress my video again after I send it?',
      a: 'Yes — WhatsApp re-encodes video on upload. Pre-compressing to 10 MB gives WhatsApp a cleaner starting point, which typically results in better quality after its re-encoding pass than if you sent an uncompressed 500 MB file.',
    },
    {
      q: 'What resolution will a 10 MB video be at?',
      a: 'For most clips, select 720p in the Resolution option before compressing. 1080p will struggle to fit 10 MB unless the clip is very short (under 30 seconds). 480p guarantees 10 MB for clips up to 3–4 minutes.',
    },
  ],
  relatedSizes: ['to-25mb', 'to-50mb'],
  relatedVerticals: [],
}
