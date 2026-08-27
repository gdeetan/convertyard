import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-mp3',
  targetBytes: 16 * 1024 * 1024,
  targetLabel: '16 MB',
  slug: 'to-16mb',
  h1: 'Compress MP3 to 16 MB',
  subhead: 'Fit an MP3 under WhatsApp\'s document limit. Send the audio without a Google Drive detour.',
  intro:
    "WhatsApp caps audio and document uploads at 16 MB — voice notes recorded in-app get compressed automatically, but MP3 files you send as documents must fit under this ceiling or they'll fail to send. Compressing to just under 16 MB keeps the file playable in the WhatsApp media viewer, works on iOS and Android, and never forces the recipient to open a browser.",
  useCases: [
    {
      label: 'WhatsApp audio document sharing (16 MB cap)',
      description: 'WhatsApp rejects audio uploads above 16 MB when sent as documents. A pre-compressed MP3 sends cleanly and plays inline for the recipient.',
    },
    {
      label: 'Interview clips for reporters',
      description: 'A 15–20 minute interview at 128 kbps fits comfortably under 16 MB — enough for a full quote-check without splitting into parts.',
    },
    {
      label: 'Full podcast episode previews',
      description: 'Send an editor or co-host a 30-minute rough cut in Voice / Podcast mode. Fits under 16 MB at 64 kbps mono.',
    },
  ],
  specificFaq: [
    {
      q: 'Is 16 MB the actual WhatsApp limit?',
      a: 'For documents (which includes MP3 files sent from the file picker), yes. WhatsApp\'s in-app voice recorder compresses to Opus at a much smaller bitrate automatically. Video is capped separately at 16 MB on most versions, and photos are 100 MB.',
    },
    {
      q: 'How long can an MP3 be at 16 MB?',
      a: 'At 128 kbps CBR, roughly 16 minutes of music. At 192 kbps (better music quality), 11 minutes. In Voice / Podcast mode (64 kbps mono), around 34 minutes — enough for a short podcast episode.',
    },
    {
      q: 'Will WhatsApp re-encode the MP3 like it does for voice notes?',
      a: 'No. WhatsApp only re-encodes voice notes recorded inside the app. MP3 documents you send from your file picker are delivered byte-for-byte. Pre-compressing to 16 MB preserves your chosen quality all the way to the recipient.',
    },
  ],
  relatedSizes: ['to-8mb', 'to-25mb'],
  relatedVerticals: [],
}
