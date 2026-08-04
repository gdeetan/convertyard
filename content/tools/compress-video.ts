import { compressVideo } from '@/lib/converters/ffmpeg'
import type { ToolConfig } from '@/lib/types'

const LARGE_FILE_BYTES = 300 * 1024 * 1024

export const config: ToolConfig = {
  slug: 'compress-video',
  title: 'Video Compressor',
  subtitle: 'Compress MP4, MOV, and MKV with CRF controls or hit an exact file size target. Runs in your browser.',
  bestFor: 'Good for hitting a file attachment limit before sending or submitting a video.',
  category: 'video-audio',
  accepts: [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-ms-wmv',
    'video/mp2t',
  ],
  acceptsExt: ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.wmv', '.ts'],
  outputExt: '.mp4',
  convertFn: compressVideo,
  enablePresets: true,
  warningFn: (files) => {
    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files take longer in-browser — a 500 MB video may take 5–15 minutes depending on your device. The tab must stay open while compressing.'
      : null
  },
  limitationNote: {
    summary: 'Large files take time — keep the tab open',
    body: 'Video compression runs entirely in your browser. A 500 MB file can take 5–15 minutes depending on your device. Keep the tab open and active while it runs — closing or backgrounding the tab will stop or slow processing. On iPhone and iPad, Safari suspends background tabs aggressively; stay on this tab until the download prompt appears. High-motion footage (sport, gaming) compresses less than screen recordings. H.265 produces 30–50% smaller files than H.264 but requires a modern device for playback.',
  },

  options: [
    {
      type: 'toggle',
      name: 'targetSizeMode',
      label: 'Target size mode',
      hint: 'Set an exact size target. The tool uses 2-pass VBR encoding to hit your target in two passes instead of guessing.',
      default: false,
    },
    {
      type: 'radio',
      name: 'level',
      label: 'Compression level',
      choices: [
        { value: 'small',   label: 'Small (better quality)' },
        { value: 'medium',  label: 'Medium' },
        { value: 'high',    label: 'High (smaller files)' },
        { value: 'maximum', label: 'Maximum (smallest files)' },
      ],
      default: 'medium',
      dependsOn: { name: 'targetSizeMode', value: 'false' },
      conditionalHints: {
        small:   'CRF 18 — near-lossless. Typical reduction: 5–20%.',
        medium:  'CRF 23 — H.264 default. Typical reduction: 30–50%.',
        high:    'CRF 28 — noticeable compression. Typical reduction: 50–70%.',
        maximum: 'CRF 35 — aggressive. Suitable for archiving at minimal size.',
      },
    },
    {
      type: 'number-with-chips',
      name: 'targetKB',
      label: 'Target size',
      unitChoices: ['KB', 'MB'],
      defaultUnit: 'MB',
      chips: [
        { label: '10 MB',  valueKB: 10240 },
        { label: '25 MB',  valueKB: 25600 },
        { label: '50 MB',  valueKB: 51200 },
        { label: '100 MB', valueKB: 102400 },
        { label: '200 MB', valueKB: 204800 },
        { label: '500 MB', valueKB: 512000 },
      ],
      min: 1,
      default: 51200,
      dependsOn: { name: 'targetSizeMode', value: 'true' },
    },
    {
      type: 'radio',
      name: 'resolution',
      label: 'Resolution',
      choices: [
        { value: 'original', label: 'Original' },
        { value: '1080p',    label: '1080p' },
        { value: '720p',     label: '720p' },
        { value: '480p',     label: '480p' },
        { value: '360p',     label: '360p' },
      ],
      default: 'original',
      hint: 'Downscaling resolution gives the biggest size reduction. 720p is a good balance of quality and file size.',
    },
    {
      type: 'toggle',
      name: 'h265',
      label: 'H.265 output (HEVC)',
      hint: 'Produces 30–50% smaller files than H.264 at the same visual quality. Requires a modern device or browser for playback.',
      default: false,
    },
    {
      type: 'toggle',
      name: 'stripAudio',
      label: 'Strip audio',
      hint: 'Removes the audio track entirely. Use for silent video loops, screen recordings, or content where audio is not needed.',
      default: false,
    },
  ],

  faq: [
    {
      q: 'Can I compress multiple videos at once?',
      a: 'Yes. Drop as many files as you need. ConvertYard compresses them one at a time in your browser and packages the results in a single ZIP. There is no hard limit on file count.',
    },
    {
      q: 'What video formats are supported?',
      a: 'Input: MP4, MOV, WebM, AVI, MKV, WMV, and TS. Output is always MP4 (H.264 or H.265). MP4 plays on virtually every device without additional software — phones, browsers, smart TVs, and editing tools all read it.',
    },
    {
      q: 'What does the compression level setting do?',
      a: 'Compression level controls the CRF (Constant Rate Factor) — the trade-off between quality and file size. Small (CRF 18) is near-lossless with modest size reduction. Medium (CRF 23) is the H.264 default and gives a good balance. High (CRF 28) is visibly compressed but significantly smaller. Maximum (CRF 35) is for archiving where file size matters more than perfect quality.',
    },
    {
      q: 'What is H.265 and should I use it?',
      a: 'H.265 (HEVC) is a newer video codec that achieves 30–50% smaller files than H.264 at the same visual quality. Use it if you are sharing the video on modern devices (iPhone, recent Android, Windows 10+, macOS). Avoid it for videos that need to play on old Android devices (pre-2016) or Windows PCs without codec packs installed.',
    },
    {
      q: 'How does target size mode work?',
      a: 'Enable Target size mode and enter your target in MB or KB. The tool probes your video duration, calculates the exact bitrate needed to hit the target, then encodes in two passes — a fast analysis pass and a final output pass. This is the same 2-pass VBR approach used by professional video tools. If the file already fits within your target, it remuxes the container instead of re-encoding.',
    },
    {
      q: 'Does compressing a video reduce its resolution or duration?',
      a: 'Compression alone does not change resolution or duration — only the quality of each frame is affected. If you select a resolution option (e.g., 720p), the tool will downscale the video as part of compression. Duration is never changed by this tool.',
    },
    {
      q: 'Why does video compression take longer than image conversion?',
      a: "Video compression must process every frame — a 60-second video at 30fps has 1,800 frames to encode. The tool uses ffmpeg.wasm, a full video processing engine (~25 MB) that runs entirely in your browser. It loads once and is cached for subsequent use. Actual compression time depends on file length, resolution, and your device's CPU speed.",
    },
  ],

  relatedTools: ['mp4-to-mp3', 'video-to-gif', 'gif-to-mp4', 'mp4-to-webp'],
  relatedArticles: ['compress-video-without-uploading', 'h264-vs-h265-video-compression', 'batch-compress-videos'],

  meta: {
    title: 'Video Compressor — ConvertYard',
    description:
      'Compress MP4, MOV, WebM, and more in your browser. No uploads, no file size cap. Batch compress up to 1,000 videos — preset levels or exact size targets.',
  },
}
