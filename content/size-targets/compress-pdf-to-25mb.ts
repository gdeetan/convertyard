import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 25 * 1024 * 1024,
  targetLabel: '25 MB',
  slug: 'to-25mb',
  h1: 'Compress PDF to 25 MB',
  subhead:
    "Stay under Gmail's 25 MB cap so your PDF arrives as an attachment, not a Drive link.",
  intro: [
    "Gmail has a 25 MB attachment limit. If you attach a PDF above this threshold, it will upload it to Google Drive and convert it to a Google Drive link. So the recipient has to be logged into their Google account and have permission from you to open that PDF file. There are several issues here. First, the sender should remember to give the recipient(s) permission to access the file; otherwise, they can’t open or view it.",
    "Compressing it to 25 MB removes this issue, allowing you to send the PDF as an attachment, not a Google Drive link. If you have a 300+ MB high-resolution, layered PDF document you want to share, emailing it would be out of the question. Sending it as a Google Drive link is doable, but opening a 300 MB PDF file on a smartphone will be laggy. A better option would be to compress it to a more manageable size. 25 MB is doable. The compressor lowers the image resolution, removes elements that aren’t used, and goes through several cycles until the target size is reached. The result will be a readable PDF file with slightly degraded image quality, but still readable.",
  ],
  useCases: [
    {
      label: 'Sending a PDF as a Gmail attachment',
      description:
        "Gmail caps its file attachment size at 25 MB. Anything over it will be converted to a Google Drive link and not an attachment, so the recipient must be logged in to their Google account and have permission to view it. If the sender forgets to set the proper permissions, the recipient can’t open the file, which wastes time and causes frustration.",
    },
    {
      label: 'High-resolution scans of books, reports, and manuals',
      description:
        'High-resolution scans of books, reports, research publications, and reference manuals can reach upwards of 200 MB. Compressing these documents to a more manageable 25 MB helps keep storage manageable without relying too much on Cloud storage.',
    },
    {
      label: 'Bundled PDFs you need to email, not upload',
      description:
        "Contracts, audit packages, project handovers, due-diligence reports — files you’d rather send as an attachment than a cloud link. Compressing keeps them under Gmail’s 25 MB cap so they go through directly.",
    },
  ],
  specificFaq: [
    {
      q: 'If Gmail automatically converts files above 25 MB to Drive links, why should I compress below 25 MB?',
      a: "As shared Drive links, these require the recipient to be signed into a Google account and to have the appropriate access permissions. Many recipients (e.g. in government offices, in legal environments, with corporate email addresses) don’t have Google accounts or won’t click on links to Google Drive from strangers. A real attachment opens in one click and doesn’t require the recipient to sign in.",
    },
    {
      q: 'Is 25 MB the same limit for Google Workspace (business Gmail)?',
      a: 'Yes, Google Workspace also has a 25 MB limit for attachments. However, for users within your domain, Shared Drive links can be easier to access than regular attachments. For external users, the difference between an attachment and a link is big, though.',
    },
    {
      q: "My PDF is 27 MB, and Gmail won't send it. Why doesn't Gmail just compress it automatically?",
      a: 'Note: Gmail will not alter or manipulate the content of your attachment. Only file size will be checked. This page contains a PDF compressor that reduces the quality of images and strips out metadata in order to shrink down a PDF to under 25 MB for attachment to Gmail.',
    },
    {
      q: 'What is the exact byte limit — is it 25 MB or 25,000 KB?',
      a: 'Gmail uses binary megabytes (1 MB = 1,048,576 bytes), so 26,214,400 bytes is the limit. We set the compressor to 24.5 MB (25,690,112 bytes) to stay under the limit, even after minor re-encoding.',
    },
    {
      q: 'Can I compress a password-protected PDF?',
      a: "Nope. ConvertYard can’t read or write encrypted PDF files. You’ll need to unlock the PDF to remove the password, then use this tool to compress.",
    },
    {
      q: 'How does target-size mode differ from the compression level slider?',
      a: 'Target-size mode will perform compression up to 6 passes (for example, structural cleanup in one pass and then decreasing image quality from 80% down to 30% in subsequent passes) until the target size is reached. Use this option if you need a strict number requirement (e.g. email attachment or government portal).',
    },
  ],
  relatedSizes: ['to-10mb', 'to-20mb'],
  relatedVerticals: [],
}
