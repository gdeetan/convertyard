import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-mp3',
  targetBytes: 25 * 1024 * 1024,
  targetLabel: '25 MB',
  slug: 'to-25mb',
  h1: 'Compress MP3 to 25 MB',
  subhead: "Stay under Gmail's 25 MB cap. Send an MP3 as an attachment, not a Drive link.",
  intro:
    "Gmail's attachment limit is 25 MB. Above this threshold, Gmail replaces your attachment with a Google Drive link — the recipient needs a Google account to open it, and the file lives on Drive rather than in the message thread. Compressing an MP3 to just under 25 MB keeps it as a real attachment that plays with one click in any email client, on any device, without a Google account.",
  useCases: [
    {
      label: 'Gmail MP3 attachments (25 MB hard cap)',
      description: "Gmail won't send audio files above 25 MB as attachments — they're converted to Drive links automatically. Compressing keeps the file inline in the message.",
    },
    {
      label: 'Full podcast episodes for guest review',
      description: 'A 45-minute podcast at 96 kbps mono fits under 25 MB. Send guests the full episode for approval without asking them to sign into a file-sharing service.',
    },
    {
      label: 'Interview transcripts with audio evidence',
      description: 'Journalists and researchers can email a full 30–40 minute interview at broadcast quality (128 kbps) under 25 MB, keeping the audio evidence attached to the transcript in the same message.',
    },
  ],
  specificFaq: [
    {
      q: 'How long can an MP3 be at 25 MB?',
      a: 'At 128 kbps CBR, roughly 26 minutes of music. At 192 kbps, 17 minutes. In Voice / Podcast mode (64 kbps mono), about 52 minutes — enough for most full podcast episodes and university lectures.',
    },
    {
      q: 'Is 25 MB the Gmail limit for Google Workspace accounts too?',
      a: 'Yes. Workspace (paid) accounts retain the 25 MB attachment cap. Outlook.com is 20 MB, Yahoo Mail is 25 MB, iCloud Mail is 20 MB. Targeting 20 MB or less is safer if you don\'t know the recipient\'s mail provider.',
    },
    {
      q: 'My MP3 is 40 MB — can I get it under 25 without losing quality?',
      a: 'Usually yes. Set Target file size to 25 MB and the tool will read your file duration and compute the exact bitrate needed. If the source was already MP3 at ~192 kbps, dropping to 128 kbps gets you there with minimal quality loss on typical listening equipment.',
    },
  ],
  relatedSizes: ['to-8mb', 'to-16mb'],
  relatedVerticals: [],
}
