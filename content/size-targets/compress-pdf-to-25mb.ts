import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 25 * 1024 * 1024,
  targetLabel: '25 MB',
  slug: 'to-25mb',
  h1: 'Compress PDF to 25 MB',
  subhead:
    "Stay under Gmail's 25 MB cap so your PDF arrives as an attachment, not a Drive link.",
  intro:
    "25 MB is Gmail's attachment limit. Above this threshold, Gmail automatically converts your attachment to a Google Drive link — the recipient must be signed into Google and have access to your Drive to open it. Compressing to just under 25 MB keeps the file as a genuine email attachment that any email client can open without a Google account. It's also the practical ceiling for large scanned report archives and multi-chapter document packages sent over email.",
  useCases: [
    {
      label: 'Gmail email attachments (25 MB hard cap)',
      description:
        "Gmail's maximum attachment size is 25 MB. Files above this limit are sent as Google Drive links rather than attachments, requiring the recipient to have a Google account.",
    },
    {
      label: 'Large multi-page scanned books or reports',
      description:
        'Scanned annual reports, research publications, and reference manuals can reach 50–200 MB — compressing to 25 MB makes them emailable without cloud storage.',
    },
    {
      label: 'Document archives before email transmission',
      description:
        'Assembled document packages for legal due diligence, auditor submissions, or project handover need to stay under 25 MB to send via Gmail without triggering the Drive fallback.',
    },
  ],
  specificFaq: [
    {
      q: 'If Gmail automatically converts files above 25 MB to Drive links, why should I compress below 25 MB?',
      a: "Drive links require the recipient to be signed into a Google account with access permissions you've granted. Many recipients — especially in government offices, legal environments, or with corporate email — either don't have Google accounts or won't click Drive links from strangers. A real attachment opens in one click, no sign-in required.",
    },
    {
      q: 'Is 25 MB the same limit for Google Workspace (business Gmail)?',
      a: 'Yes — Google Workspace retains the 25 MB attachment limit. The only difference is that Workspace users can access shared Drive links across the domain more easily. For external recipients, the attachment-vs-link distinction still matters.',
    },
    {
      q: "My PDF is 27 MB and Gmail won't send it. Why doesn't Gmail just compress it automatically?",
      a: 'Gmail does not process or modify attachment content. It only checks file size. The compressor on this page does the actual work of reducing image quality and removing metadata to bring your PDF under 25 MB before you attach it.',
    },
    {
      q: 'What is the exact byte limit — is it 25 MB or 25,000 KB?',
      a: 'Gmail uses binary megabytes (1 MB = 1,048,576 bytes), so the limit is 26,214,400 bytes. This compressor targets 24.5 MB (25,690,112 bytes) to stay safely under the threshold regardless of minor encoding variations.',
    },
  ],
  relatedSizes: ['to-10mb', 'to-20mb'],
  relatedVerticals: [],
}
