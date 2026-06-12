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
    "10 MB is Microsoft Outlook's default maximum message size — which means most corporate email systems enforce a 10 MB total attachment cap. Design portfolios with embedded images, conference presentation handouts, and long technical documents regularly start at 20–80 MB from their source tools. Compressing to just under 10 MB lets these files travel over corporate email without being bounced by a mail server.",
  useCases: [
    {
      label: 'Outlook email attachments (default 10 MB server cap)',
      description:
        "Microsoft Exchange Server's default max attachment size is 10 MB per message. Emails above this limit bounce with a 'message size exceeds maximum' error.",
    },
    {
      label: 'Design portfolios with embedded images',
      description:
        'Creative portfolios exported from Adobe InDesign or Figma can exceed 100 MB. Compressing to 10 MB makes them shareable as email attachments without requiring a cloud link.',
    },
    {
      label: 'Conference presentation handouts',
      description:
        'PDF handouts distributed at academic conferences or corporate seminars are commonly emailed to attendees; 10 MB is the safe ceiling for broad inbox compatibility.',
    },
    {
      label: 'Long technical documentation submissions',
      description:
        'Engineering proposals, architecture specifications, and technical reports submitted to clients or procurement teams via email need to pass corporate mail server limits.',
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
