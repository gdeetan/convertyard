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
    const isMobile = typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints > 1 || /Android|iPhone|iPad/i.test(navigator.userAgent))

    // Extended engine for files >2 GB — mediabunny + OPFS streaming, only
    // on Chromium desktop. Tell the user what's happening + point them at
    // the PWA install as an optional nicer experience.
    const hasHuge = files.some((f) => f.size > 2 * 1024 * 1024 * 1024)
    if (hasHuge) {
      if (isMobile) {
        return 'Files over 2 GB need Chrome or Edge on a desktop computer — mobile browsers can\'t handle them. Try uploading from a laptop or desktop.'
      }
      return 'Large file detected. ConvertYard will load an extended engine (~70 KB, one-time download) to stream this through your device\'s storage instead of memory. Works best on Chrome or Edge. Tip: install ConvertYard as an app (icon beside the URL bar) for a nicer standalone window — same file support, just a cleaner launcher.'
    }

    if (isMobile) {
      const hasVeryLarge = files.some((f) => f.size > 100 * 1024 * 1024)
      const hasLarge = files.some((f) => f.size > 50 * 1024 * 1024)
      if (hasVeryLarge) {
        return 'Videos over 100 MB are high-risk on mobile — iOS may restart the page due to memory limits. Compress one file at a time and stay on this tab. A desktop browser is recommended for large files.'
      }
      if (hasLarge) {
        return 'Large files can be slow or fail on mobile due to browser memory limits. For files over 50 MB, a desktop browser is recommended.'
      }
    }

    const hasLarge = files.some((f) => f.size > LARGE_FILE_BYTES)
    return hasLarge
      ? 'Large files take longer in-browser — a 500 MB video may take 5–15 minutes depending on your device. The tab must stay open while compressing.'
      : null
  },
  limitationNote: {
    summary: 'Large files take time — keep the tab open',
    body: 'Video compression runs entirely in your browser. Keep the tab open and active while it runs — closing or switching tabs will stall or stop processing. On iPhone and iPad, iOS limits memory per browser tab: videos over 100 MB may cause the page to restart. The tool automatically reduces resolution to 720p for large files on mobile to lower crash risk, but for batches of 100 MB+ videos a desktop browser is strongly recommended. On Android, Chrome throttles background tabs which can stall long encodes — stay on this tab. On desktop, a 500 MB file can take 5–15 minutes depending on your CPU. High-motion footage (sport, gaming) compresses less than screen recordings. H.265 produces 30–50% smaller files than H.264 but requires a modern device for playback.',
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

  howItWorks: [
    {
      label: 'Drop your files',
      desc: 'Click to browse, or drop your files. For best results, process 1-5 files at a time.',
    },
    {
      label: 'Choose settings',
      desc: 'Adjust quality, format, and other options to match your needs.',
    },
    {
      label: 'Click Convert',
      desc: 'Files are processed in the browser. Nothing uploads. No risk of data breach.',
    },
    {
      label: 'Download',
      desc: 'Download files individually or grab all at once as a ZIP.',
    },
  ],

  faq: [
    {
      q: 'Can I compress multiple videos at once?',
      a: 'Yes. Compress one or ten files. However, with .mov files over 1.5 gigabytes, you may get an FS error, which means the browser is out of memory. For smaller files under 1 GB, you can follow the 1-to-5 file principle.',
    },
    {
      q: 'What video formats are supported?',
      a: 'It supports these formats: MP4, MOV, WebM, AVI, MKV, WMV, and TS. However, the output is always MP4 (H.264 or H.265). You can play an MP4 file on any device without additional software, and most video editing software supports it.',
    },
    {
      q: 'What does the compression level setting do?',
      a: 'The compression level parameter controls the Constant Rate Factor (CRF) of the H.264 video codec. CRF balances quality and size. For example, Small (CRF 18) is nearly lossless but reduces size only slightly, while Medium (CRF 23) is the H.264 default and a good trade-off between quality and size. High (CRF 28) is heavily compressed but much smaller than Medium quality. Maximum (CRF 35) is for archiving, and size matters more than quality.',
    },
    {
      q: 'What is H.265 and should I use it?',
      a: 'H.265 (or HEVC format) is the newer codec that compresses videos (at least with my testing MOV files) up to a whopping 116% difference with no noticeable difference in quality. If you’re using a video or sharing it with someone who uses a newer laptop or mobile device (like the newer iPhone or Android), you can use this format. Use the older H.264 format for devices released before 2016.',
    },
    {
      q: 'How does target size mode work?',
      a: "Target size, as its name implies, aims to compress the video to a specific file size. It does this by calculating its duration, then determining the exact bitrate needed to reach the target file size. The video is encoded twice: first, an analysis pass, then an output pass. It's similar to how professional video software does it (using a 2-pass VBR encoding). When the file approaches its target size, it remuxes the container files instead of re-encoding.",
    },
    {
      q: 'Does compressing a video reduce its resolution or duration?',
      a: "No, compression does not reduce your video's duration. It only reduces the quality of each frame. If you choose a resolution such as 720p, your video will be downscaled during compression. However, your video will still be the same duration.",
    },
    {
      q: 'Why does video compression take longer than image conversion?',
      a: 'Video compression takes longer because it needs to process multiple frames. For example, your 60-second video at 30fps has around 1,800 frames, whereas an image compressor only has one frame; thus, the compression is much faster.',
    },
  ],

  relatedTools: ['compress-mp3', 'mp4-to-mp3', 'video-to-gif', 'gif-to-mp4', 'mp4-to-webp'],
  relatedArticles: ['compress-video-without-uploading', 'h264-vs-h265-video-compression', 'batch-compress-videos'],

  meta: {
    title: 'Video Compressor — No Upload — ConvertYard',
    description:
      'Compress MP4, MOV, WebM, and more in your browser. No uploads. Drop multiple videos at once — preset compression levels or hit an exact file size target.',
  },
}
