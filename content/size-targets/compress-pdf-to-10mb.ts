import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 10 * 1024 * 1024,
  targetLabel: '10 MB',
  slug: 'to-10mb',
  h1: 'Compress PDF to 10 MB',
  subhead:
    "Stay under Outlook's default 10 MB email cap and send design portfolios without cloud links.",
  intro:
    "Microsoft Outlook has a default limit of 10 MB per message. This means the text and file attachments must not exceed 10 megabytes. So if you work with image-heavy PDFs, like conference presentation handouts, or long technical documents, these files can easily balloon to 20, 40, sometimes 80 MB.\n\nCompressing to just under 10 MB lets these files travel over corporate email without being bounced by a mail server. Microsoft Outlook users can send file attachments with a maximum size of 10 MB. If you work for a design studio with high-resolution portfolios, a high-profile company with conference presentation handouts, or technical documents ranging from 20 to 80 MB, compressing them to just under 10 MB will be critical to sending them without the mail server rejecting them.",
  useCases: [
    {
      label: 'Outlook email file attachments (10 MB Max)',
      description:
        "This tool has a max attachment size of 10 MB per message. Sending anything over this will trigger a 'message size exceeds maximum' error.",
    },
    {
      label: 'Design portfolios with embedded images',
      description:
        'Creatives who use Adobe InDesign or Figma easily exceed 100 MB. Compress the PDF output to 10 MB so you can send these as attachments using Outlook and prevent any delays.',
    },
    {
      label: 'Conference presentation handouts',
      description:
        "PDF documentation in seminars are usually emailed to attendees. If you're using Outlook, compressing these files to 10 MB (or just under it) is essential to send these out en masse.",
    },
    {
      label: 'Long technical documentation',
      description:
        'These include engineering proposals, architecture specifications, and technical reports submitted to clients or procurement teams via email and need to pass corporate mail server limits.',
    },
  ],
  specificFaq: [
    {
      q: "My company's Outlook accepts 20 MB. Why does this page target 10 MB?",
      a: "The 10 MB default applies to unmodified Microsoft Exchange configurations. Many IT teams raise the limit to 20–25 MB, but you cannot know the recipient's server limit in advance. Compressing to 10 MB ensures your email reaches inboxes on default-configured servers without bounce errors.",
    },
    {
      q: "I compressed my portfolio to 10 MB but Gmail still won't send it. Why?",
      a: "Gmail's attachment limit is 25 MB, so 10 MB should send fine. If Gmail is still blocking it, the issue may be the total message size (inline images plus attachments combined), not just the PDF. Check whether the email body contains large embedded images.",
    },
    {
      q: 'Does compressing to 10 MB affect vector graphics or charts in a PDF?',
      a: 'Vector data (lines, shapes, paths) is not affected by PDF image compression — only embedded raster images (photos, screenshots, scanned pages) lose quality. Charts and diagrams created in PowerPoint or Illustrator remain sharp at any compression level.',
    },
  ],
  relatedSizes: ['to-5mb', 'to-20mb', 'to-25mb'],
  relatedVerticals: [],
}
