import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-video',
  targetBytes: 25 * 1024 * 1024,
  targetLabel: '25 MB',
  slug: 'to-25mb',
  h1: 'Compress Video to 25 MB',
  subhead: "Stay under Gmail's 25 MB cap. Send your video as a real attachment, not a Drive link.",
  intro:
    'Gmail allows attachments up to 25 MB. Attachments larger than this are uploaded to Google Drive as a link that the recipient can access if they have a Google account and you have shared the file with them. By compressing a video to under 25 MB, you can send it as a regular attachment that opens with a single click in any email program on any computer.',
  useCases: [
    {
      label: 'Gmail video attachments (25 MB hard cap)',
      description: "Gmail won't send video files above 25 MB as attachments. Files above this limit are automatically converted to Drive links.",
    },
    {
      label: 'Client review clips via email',
      description: 'Short product demos, interview recordings, and feedback recordings can be sent via email as a 25 MB attachment.',
    },
    {
      label: 'Wedding or event highlights',
      description: '2–5-minute highlight reels for family and friends to view via email are usually around 720p and less than 25 MB.',
    },
  ],
  specificFaq: [
    {
      q: 'My video is 28 MB. Can I get it to exactly 25 MB?',
      a: 'Enable Target size mode on the main Compress Video page and enter 25 MB. The tool automatically finds the right compression level — for a 28 MB video it usually needs only one pass.',
    },
    {
      q: 'Is 25 MB the Gmail limit for Google Workspace accounts too?',
      a: 'Yes. Google Workspace retains the 25 MB attachment cap. For internal organisation sharing, Drive links work fine — but external recipients or clients without Google accounts need the file as a real attachment.',
    },
  ],
  relatedSizes: ['to-10mb', 'to-50mb'],
  relatedVerticals: [],
}
