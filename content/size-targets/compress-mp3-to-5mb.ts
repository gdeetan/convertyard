import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-mp3',
  targetBytes: 5 * 1024 * 1024,
  targetLabel: '5 MB',
  slug: 'to-5mb',
  h1: 'Compress MP3 to 5 MB',
  subhead: 'Fit an MP3 under 5 MB for messaging apps, forum uploads, and lightweight email attachments.',
  intro:
    "5 MB is the practical ceiling for an audio file you want to send instantly on a slow connection. At 128 kbps it holds about 5 minutes of music or roughly 15 minutes of spoken word — plenty for a voice memo, short interview clip, or a demo track. Below that, use Voice / Podcast mode to squeeze longer recordings down without noticeable quality loss on speech.",
  useCases: [
    {
      label: 'Slack file uploads on free plans',
      description: 'Slack free plans throttle uploads over ~5 MB in some regions. Pre-compressing keeps sends fast and reduces channel storage against your team\'s cap.',
    },
    {
      label: 'Forum and BBS attachments',
      description: 'Reddit, phpBB, and Discourse instances commonly cap audio uploads at 5 MB. A single compressed MP3 fits inside a comment without hitting the limit.',
    },
    {
      label: 'Voice memos on slow mobile data',
      description: '5 MB uploads reliably on 3G in under 30 seconds. Ideal for sending a spoken note when Wi-Fi isn\'t available.',
    },
  ],
  specificFaq: [
    {
      q: 'How long can an MP3 be at 5 MB?',
      a: 'It depends on the bitrate. At 128 kbps CBR (music-grade), 5 MB holds roughly 5 minutes. At 64 kbps mono (Voice / Podcast mode), it holds about 10 minutes. At 32 kbps (voice, low-quality), it stretches to 20+ minutes.',
    },
    {
      q: 'My MP3 is 20 minutes long and I need it under 5 MB. What do I do?',
      a: 'Turn on Voice / Podcast mode. It forces 64 kbps mono at 22.05 kHz — enough to hold a 20-minute spoken-word recording under 5 MB with no noticeable quality drop for speech. For music that long, you\'ll need to trim it first with the Audio Trimmer tool.',
    },
    {
      q: 'Will the file still sound OK at 5 MB?',
      a: 'For voice: yes, essentially transparent. For music: 5-minute songs at 128 kbps sound fine on phone speakers and earbuds; audiophiles listening on studio monitors may notice softer treble. If quality matters, go with the 8 MB or 16 MB target instead.',
    },
  ],
  relatedSizes: ['to-8mb', 'to-16mb'],
  relatedVerticals: [],
}
