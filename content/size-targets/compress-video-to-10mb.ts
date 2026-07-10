import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 10 * 1024 * 1024,
  targetLabel: '10 MB',
  slug: 'to-10mb',
  h1: 'Compress Video to 10 MB',
  subhead: 'Hit the WhatsApp and Telegram share limit. Drop the file, click compress.',
  intro:
    'WhatsApp and Telegram cap video shares at 16 MB and 50 MB respectively, but most recipients have data limits that make smaller files load faster. 10 MB is the practical ceiling for a video you want to share instantly without buffering — it loads on 3G in under 10 seconds. Short clips (under 2 minutes), talking-head recordings, and screen captures compress well to 10 MB at 720p or lower.',
  useCases: [
    {
      label: 'WhatsApp video shares',
      description: 'WhatsApp compresses video you share anyway — sending a pre-compressed file avoids double-compression artifacts and ensures faster delivery.',
    },
    {
      label: 'Telegram direct messages',
      description: 'Short clips sent directly in Telegram chat load instantly on mobile when kept under 10 MB.',
    },
    {
      label: 'Email video attachments',
      description: 'Most email providers accept up to 10–25 MB. A 10 MB video opens without an external link.',
    },
    {
      label: 'Social media story uploads',
      description: 'Instagram, Facebook, and TikTok stories load faster and get better reach when the source file is already compressed before upload.',
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
