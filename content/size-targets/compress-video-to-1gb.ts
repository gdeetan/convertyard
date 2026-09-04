import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 1024 * 1024 * 1024,
  targetLabel: '1 GB',
  slug: 'to-1gb',
  h1: 'Compress Video to 1 GB',
  subhead: 'Near-lossless compression for 4K recordings and long-form professional footage.',
  intro:
    'Content creators who want a near-lossless H.264 output for long 4K videos should choose the 1 GB option. At this size, multiple hours of 1080p or 30–60 minutes of 4K footage can be stored with no perceptible loss of quality compared to the uncompressed original. This threshold is what most broadcast media uses (H.264) to store high-quality video without compromising storage capacity. Note: the current version of the video compressor has a file size limit of 2 GB, and we are continually searching for ways to raise this limit.',
  useCases: [
    {
      label: 'Long 4K recordings at near-lossless quality',
      description: 'A one-gigabyte compressed video file is equivalent to 30 to 60 minutes of 4K drone footage, webinar recording, and documentary videos.',
    },
    {
      label: 'Broadcast-ready H.264 deliverables',
      description: 'Broadcasters and streaming platforms often require H.264 MP4 deliverables that meet specific file-size thresholds. 1 GB covers most 30-minute programs.',
    },
  ],
  specificFaq: [
    {
      q: 'How much 4K footage fits in 1 GB?',
      a: 'At 4K (3840×2160) with CRF 23, approximately 20–30 minutes of typical footage compresses to under 1 GB. Fast-moving content (sports, action) fits less — around 10–15 minutes. For longer 4K clips, use CRF 26–28 or split the footage into segments.',
    },
    {
      q: 'Should I use H.265 to fit 4K into 1 GB?',
      a: 'Yes — H.265 achieves the same visual quality at roughly half the file size. A 4K clip that takes 1 GB at H.264 CRF 23 takes approximately 500 MB at H.265 CRF 26. The trade-off is that H.265 playback requires a modern device (iPhone 6s+, recent Android, Windows 10 with HEVC codec).',
    },
  ],
  relatedSizes: ['to-500mb', 'to-200mb'],
  relatedVerticals: [],
}
