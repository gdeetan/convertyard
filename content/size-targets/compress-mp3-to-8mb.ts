import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-mp3',
  targetBytes: 8 * 1024 * 1024,
  targetLabel: '8 MB',
  slug: 'to-8mb',
  h1: 'Compress MP3 to 8 MB',
  subhead: 'Hit the Discord free-tier upload cap. Drop the file, click compress.',
  intro:
    "Discord's free tier caps file uploads at 8 MB. Nitro Basic raises it to 50 MB and Nitro to 500 MB, but everyone else needs to stay under 8 MB or the upload gets rejected. Compressing to just under 8 MB keeps the file playable in the Discord audio player, avoids the third-party hosting hop, and doesn't force teammates to click through to Google Drive.",
  useCases: [
    {
      label: 'Discord free-tier audio uploads (8 MB hard cap)',
      description: 'Discord rejects audio files above 8 MB on free accounts. Uploading a pre-compressed MP3 keeps it playable inline in the channel.',
    },
    {
      label: 'Music demos in DAW-community channels',
      description: 'Rough mixes, beat sketches, and stems for feedback — 8 MB fits a 3-minute track at ~350 kbps or a 5-minute song at 192 kbps, plenty for critical listening on headphones.',
    },
    {
      label: 'Podcast preview clips',
      description: 'Send collaborators a 10-minute rough cut in Voice mode without hitting the cap. Under 8 MB at 64 kbps mono.',
    },
  ],
  specificFaq: [
    {
      q: 'Does 8 MB fit a full song?',
      a: 'A 3-minute track fits at ~350 kbps (near-transparent). A 5-minute song fits at 192 kbps (good quality). A 10-minute song needs to drop to 96 kbps or use Voice / Podcast mode if it\'s spoken word.',
    },
    {
      q: 'Why is Discord\'s limit 8 MB and not 10?',
      a: 'Discord uses the binary megabyte definition (8 × 1024 × 1024 bytes = 8,388,608). Setting a target of exactly 8 MB in the tool matches Discord\'s calculation, so a file that says 7.9 MB will always be accepted.',
    },
    {
      q: 'Will Discord re-compress the file after I upload it?',
      a: 'No. Unlike video, Discord serves audio files as-is — the MP3 you upload is the MP3 your channel members download. Pre-compressing to a smaller size keeps quality control in your hands and doesn\'t stack additional lossy re-encoding on top.',
    },
  ],
  relatedSizes: ['to-5mb', 'to-16mb', 'to-25mb'],
  relatedVerticals: [],
}
