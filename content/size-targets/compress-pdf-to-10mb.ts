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
      a: "The default email file size limit of Microsoft Outlook is 10 MB; this is set to keep storage usage manageable. But some companies' IT departments modify this setting and increase the limit to 20 MB (or more). Regardless, we won't know these email servers' size limits in advance, so 10 MB is a good starting point.",
    },
    {
      q: "I compressed my portfolio to 10 MB, but Gmail still won't send it. Why?",
      a: "Gmail's attachment cap is 25 MB, so sending a 10 MB attachment should be fine. However, if Gmail blocks the email, the issue could be the total message size. There may be other attachments included along with the PDF file, or there are embedded photos in the message itself.",
    },
    {
      q: 'Does compressing to 10 MB affect vector graphics or charts in a PDF?',
      a: 'Vector elements (such as lines, shapes and paths) will not be affected by PDF image compression, whereas embedded raster elements (photos, screenshots and other scanned images) will degrade in quality. Charts and other diagrams created in PowerPoint or Illustrator will remain crisp and clear regardless of the level of compression applied.',
    },
    {
      q: 'Can I compress a password-protected PDF?',
      a: "Nope. ConvertYard won't be able to read or write encrypted PDF files. One workaround is using the Unlock PDF tool to remove the password, then compress that file. If it contains sensitive data, you can re-add the password using the Protect PDF tool.",
    },
    {
      q: 'How does target-size mode differ from the compression level slider?',
      a: 'The target-size mode will run compression passes up to six times. The first pass is a structural cleanup pass; then the succeeding passes gradually lower image quality from 80 to 30%, stopping only when the target size is reached. This option is best if you have a hard file size cap - usually email attachments or government portals.',
    },
  ],
  relatedSizes: ['to-5mb', 'to-20mb', 'to-25mb'],
  relatedVerticals: [],
}
