import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 25 * 1024 * 1024,
  targetLabel: '25 MB',
  slug: 'to-25mb',
  h1: 'Compress Video to 25 MB',
  subhead: "Stay under Gmail's 25 MB cap. Send your video as a real attachment, not a Drive link.",
  intro:
    "Gmail's attachment limit is 25 MB. Above this threshold, Gmail converts your attachment into a Google Drive link — the recipient needs a Google account and your permission to open it. Compressing your video to under 25 MB keeps it as a genuine email attachment that opens with one click in any email client, on any device, without a Google account.",
  useCases: [
    {
      label: 'Gmail video attachments (25 MB hard cap)',
      description: "Gmail won't send video files above 25 MB as attachments. Files above this limit are automatically converted to Drive links.",
    },
    {
      label: 'Client review clips via email',
      description: 'Short product demos, interview clips, and feedback recordings compressed to 25 MB send cleanly from any email provider.',
    },
    {
      label: 'Wedding or event highlights',
      description: '2–5 minute highlight reels for sharing with family via email fit comfortably under 25 MB at 720p.',
    },
  ],
  specificFaq: [
    {
      q: 'My video is 28 MB. Can I get it to exactly 25 MB?',
      a: 'Enable Target size mode on the main Compress Video page and enter 25 MB. The tool runs iterative passes increasing compression until the file is at or below your target. For a 28 MB video, one pass at CRF 26 is usually enough.',
    },
    {
      q: 'Is 25 MB the Gmail limit for Google Workspace accounts too?',
      a: 'Yes. Google Workspace retains the 25 MB attachment cap. For internal organisation sharing, Drive links work fine — but external recipients or clients without Google accounts need the file as a real attachment.',
    },
  ],
  relatedSizes: ['to-10mb', 'to-50mb'],
  relatedVerticals: [],
}
