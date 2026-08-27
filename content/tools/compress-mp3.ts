import { compressMp3 } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 150 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'compress-mp3',
  title: 'MP3 Compressor',
  subtitle: 'Compress MP3, WAV, M4A, and FLAC in your browser. Hit an exact file size, use a one-click voice preset, or tune the bitrate yourself. No uploads.',
  bestFor: 'Good for shrinking podcasts, audiobooks, and voice memos to fit email or messaging limits.',
  category: 'video-audio',
  accepts: [
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/flac',
    'audio/x-flac',
    'audio/ogg',
    'audio/opus',
  ],
  acceptsExt: ['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.opus'],
  outputExt: '.mp3',
  convertFn: compressMp3,
  enablePresets: true,

  warningFn: (files) => {
    const isMobile = typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints > 1 || /Android|iPhone|iPad/i.test(navigator.userAgent))

    if (isMobile) {
      const hasVeryLarge = files.some((f) => f.size > 100 * 1024 * 1024)
      if (hasVeryLarge) {
        return 'Audio files over 100 MB are high-risk on mobile — iOS may restart the tab due to memory limits. A desktop browser is recommended.'
      }
    }

    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large audio files can take several minutes in-browser. Keep the tab open while compressing. For files over 150 MB, a desktop browser is recommended.'
      : null
  },

  limitationNote: {
    summary: 'Large files take time — keep the tab open',
    body: 'MP3 compression runs entirely in your browser using ffmpeg.wasm. Keep this tab open and active while it runs — closing or switching tabs will stall or stop processing. On iPhone and iPad, iOS limits memory per browser tab, so audio files over 100 MB may cause the page to restart. On Android, Chrome throttles background tabs which can stall long encodes. On desktop, a 500 MB audiobook can take 5–15 minutes depending on your CPU. Voice/podcast mode is dramatically faster than music-quality encoding because it uses a lower bitrate and a single channel.',
  },

  options: [
    {
      type: 'toggle',
      name: 'voiceMode',
      label: 'Voice / Podcast mode',
      hint: 'One-click optimization for spoken-word audio: 64 kbps mono at 22.05 kHz. Cuts podcasts and audiobooks by roughly 70–80% with no noticeable quality drop for speech. Overrides the settings below.',
      default: false,
    },
    {
      type: 'radio',
      name: 'method',
      label: 'Compression method',
      choices: [
        { value: 'preset',         label: 'Quality preset' },
        { value: 'target-size',    label: 'Target file size' },
        { value: 'custom-bitrate', label: 'Custom bitrate' },
        { value: 'percentage',     label: 'Percentage of original' },
      ],
      default: 'preset',
      dependsOn: { name: 'voiceMode', value: 'false' },
      conditionalHints: {
        'preset':         'Pick a quality tier. Uses VBR — file size varies with audio complexity.',
        'target-size':    'Type or pick an exact target size. The tool reads your file duration and calculates the bitrate to hit the target.',
        'custom-bitrate': 'Direct control over the encoding bitrate. Pick CBR for predictable file size or VBR for better quality at the same average.',
        'percentage':     'Shrink to a share of the original bitrate. Simple but the final file size is approximate.',
      },
    },
    {
      type: 'radio',
      name: 'preset',
      label: 'Quality',
      choices: [
        { value: 'small',   label: 'Small (best quality, ~245 kbps)' },
        { value: 'medium',  label: 'Medium (LAME default, ~190 kbps)' },
        { value: 'high',    label: 'High (~130 kbps)' },
        { value: 'maximum', label: 'Maximum (smallest, ~100 kbps)' },
      ],
      default: 'medium',
      dependsOn: { name: 'method', value: 'preset' },
      conditionalHints: {
        small:   '-q:a 0 — near-transparent for music. Typical reduction: 20–40%.',
        medium:  '-q:a 2 — LAME default. Transparent for most listeners. Typical reduction: 40–60%.',
        high:    '-q:a 5 — noticeable compression, fine for casual listening. Typical reduction: 60–75%.',
        maximum: '-q:a 7 — aggressive. Best for archives, spoken-word, or when file size matters most.',
      },
    },
    {
      type: 'number-with-chips',
      name: 'targetKB',
      label: 'Target size',
      unitChoices: ['KB', 'MB'],
      defaultUnit: 'MB',
      chips: [
        { label: '1 MB',   valueKB: 1024 },
        { label: '5 MB',   valueKB: 5120 },
        { label: '8 MB',   valueKB: 8192 },   // Discord free tier
        { label: '16 MB',  valueKB: 16384 },  // WhatsApp
        { label: '25 MB',  valueKB: 25600 },  // Gmail attachment
        { label: '50 MB',  valueKB: 51200 },
        { label: '100 MB', valueKB: 102400 },
      ],
      min: 32,
      default: 8192,
      dependsOn: { name: 'method', value: 'target-size' },
      hint: 'Ceiling of 8 MB fits Discord free-tier uploads. 16 MB fits WhatsApp. 25 MB fits Gmail attachments.',
    },
    {
      type: 'dropdown',
      name: 'customBitrate',
      label: 'Bitrate',
      choices: [
        { value: '64',  label: '64 kbps (voice, small)' },
        { value: '96',  label: '96 kbps' },
        { value: '128', label: '128 kbps (standard)' },
        { value: '160', label: '160 kbps' },
        { value: '192', label: '192 kbps (good music)' },
        { value: '256', label: '256 kbps' },
        { value: '320', label: '320 kbps (maximum MP3)' },
      ],
      default: '128',
      dependsOn: { name: 'method', value: 'custom-bitrate' },
    },
    {
      type: 'radio',
      name: 'customMode',
      label: 'Bitrate mode',
      choices: [
        { value: 'cbr', label: 'CBR (predictable size)' },
        { value: 'vbr', label: 'VBR (better quality)' },
      ],
      default: 'cbr',
      dependsOn: { name: 'method', value: 'custom-bitrate' },
      hint: 'CBR holds a constant bitrate — file size is predictable. VBR varies the bitrate by moment — better sound at the same average size, but the final size is harder to predict.',
    },
    {
      type: 'number',
      name: 'percentage',
      label: 'Percentage of original',
      min: 10,
      max: 95,
      step: 5,
      default: 50,
      dependsOn: { name: 'method', value: 'percentage' },
      hint: 'A 10 MB file at 50% becomes roughly 5 MB. Reads the input bitrate and applies your percentage.',
    },
    {
      type: 'dropdown',
      name: 'channels',
      label: 'Channels',
      choices: [
        { value: 'keep',   label: 'Keep original' },
        { value: 'stereo', label: 'Stereo' },
        { value: 'mono',   label: 'Mono (halves size for voice)' },
      ],
      default: 'keep',
      dependsOn: { name: 'voiceMode', value: 'false' },
    },
    {
      type: 'dropdown',
      name: 'sampleRate',
      label: 'Sample rate',
      choices: [
        { value: 'keep',  label: 'Keep original' },
        { value: '48000', label: '48,000 Hz (studio/video)' },
        { value: '44100', label: '44,100 Hz (CD quality)' },
        { value: '22050', label: '22,050 Hz (voice, low-res)' },
        { value: '16000', label: '16,000 Hz (phone/voice)' },
      ],
      default: 'keep',
      dependsOn: { name: 'voiceMode', value: 'false' },
    },
    {
      type: 'toggle',
      name: 'trimSilence',
      label: 'Trim silence at start and end',
      hint: 'Detects and cuts leading and trailing silence quieter than -50 dB. Useful for voice recordings with long dead air.',
      default: false,
    },
    {
      type: 'toggle',
      name: 'preserveTags',
      label: 'Preserve tags and cover art',
      hint: 'Keeps ID3 metadata (artist, album, title, year) and embedded artwork through re-encoding. Turn off for a fully stripped file.',
      default: true,
    },
  ],

  faq: [
    {
      q: 'Can I compress audio files that aren\'t MP3?',
      a: 'Yes. Drop WAV, M4A, AAC, FLAC, OGG, or Opus files and they\'ll be re-encoded to compressed MP3. No need to convert to MP3 first with a separate tool.',
    },
    {
      q: 'When should I turn on Voice / Podcast mode?',
      a: 'Turn it on for spoken-word content — podcasts, interviews, audiobooks, lectures, and voice notes. It forces 64 kbps mono at 22.05 kHz, which is transparent for speech and cuts file size by roughly 70–80% compared to a stereo music-quality MP3. Don\'t use it for music.',
    },
    {
      q: 'What\'s the difference between the four compression methods?',
      a: 'Quality preset picks a VBR tier (Small/Medium/High/Maximum) and lets the file size vary with audio complexity. Target file size hits an exact MB or KB by reading your file duration and computing the required bitrate. Custom bitrate gives you direct CBR or VBR control. Percentage shrinks each file to a share of its original bitrate — simplest, but the exact final size is approximate.',
    },
    {
      q: 'CBR vs VBR — which should I pick?',
      a: 'CBR (Constant Bitrate) holds one bitrate for the whole file — predictable size, slightly lower quality per kilobyte. VBR (Variable Bitrate) spends more bits on complex sections and fewer on quiet ones — better audio at the same average size, but the final file size varies with the source. Use CBR (or Target file size) when you have a hard ceiling like an email or Discord limit. Use VBR when archiving music.',
    },
    {
      q: 'Are ID3 tags and cover art preserved?',
      a: 'Yes, by default. Artist, album, title, track number, year, genre, and embedded cover art are copied through to the output. You can disable this with the toggle if you want a stripped file.',
    },
    {
      q: 'What\'s the largest file I can compress?',
      a: 'There\'s no hard limit set by ConvertYard — you\'re only limited by your browser\'s memory. On desktop, 500 MB files compress reliably. On mobile (especially iOS), files over 100 MB may cause the tab to restart. For audiobooks and long recordings over 150 MB, a desktop browser is strongly recommended.',
    },
    {
      q: 'Are my audio files uploaded?',
      a: 'No. Compression runs entirely in your browser using ffmpeg.wasm. Your audio files never leave your device. Only the tool\'s code and the encoder library are downloaded from ConvertYard\'s servers.',
    },
  ],

  relatedTools: ['compress-video', 'mp4-to-mp3', 'opus-to-mp3', 'aac-to-mp3', 'audio-trimmer'],
  relatedArticles: ['audio-bitrate-explained', 'extract-audio-from-mp4', 'browser-video-editing-2026'],

  meta: {
    title: 'MP3 Compressor — No Upload — ConvertYard',
    description:
      'Compress MP3, WAV, M4A, and FLAC in your browser. No uploads, no signup, no size cap. Batch process files, hit exact size targets, one-click voice preset.',
  },
}
