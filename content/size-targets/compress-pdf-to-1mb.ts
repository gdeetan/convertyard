import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 1 * 1024 * 1024,
  targetLabel: '1 MB',
  slug: 'to-1mb',
  h1: 'Compress PDF to 1 MB',
  subhead:
    'Keep your PDF under 1 MB for LinkedIn uploads, Schengen visa document packs, and conservative email recipients.',
  intro:
    "1 MB is the inflection point where document size expectations shift from portal-enforced limits to social conventions. Resume uploads on LinkedIn, Naukri, and Indeed are routinely rejected or warned above 1 MB. Schengen visa applications have a soft 1 MB per-document expectation that speeds processing and avoids rejection at consulate portals. And many corporate environments still operate on the mental model that email attachments should be under 1 MB. The compressor targets 900 KB–1 MB, giving you maximum quality at the limit.",
  useCases: [
    {
      label: 'Resume and CV uploads on LinkedIn, Naukri, Indeed',
      description:
        'Job platforms enforce or warn above 1 MB on uploaded CVs to keep recruiter download times fast. LinkedIn explicitly caps resume uploads at 1 MB.',
    },
    {
      label: 'Email attachments for conservative recipients',
      description:
        'Government offices, banks, and older corporate environments often have informal norms or hard server limits around 1 MB per email attachment.',
    },
    {
      label: 'Project documentation submissions',
      description:
        'University project reports, tender bid documents, and client-facing proposals are commonly capped at 1 MB by submission form validators.',
    },
    {
      label: 'Schengen visa supporting documents',
      description:
        'German, French, and Dutch consulate visa portals recommend individual documents under 1 MB to avoid upload errors and processing delays.',
    },
    {
      label: 'Health insurance claim documents',
      description:
        'Digital claim portals for ICICI Lombard, Star Health, and similar insurers often apply a 1 MB per-document ceiling during online claim submission.',
    },
  ],
  specificFaq: [
    {
      q: 'LinkedIn says my resume is too large — what size does it accept?',
      a: 'LinkedIn caps resume uploads at 1 MB. The most common culprit is an embedded high-resolution photo or a background image. Compress to 1 MB here, or remove the photo from your PDF template before exporting.',
    },
    {
      q: 'Does compressing a resume PDF to 1 MB affect ATS parsing?',
      a: 'No. ATS systems parse text layers, not images. Compression only affects embedded images and metadata. As long as your resume is a real PDF (not a scanned image of text), compression will not change how an ATS reads your name, skills, or employment history.',
    },
    {
      q: 'What is the Schengen visa portal file size limit exactly?',
      a: "There is no single limit — each member state runs its own visa portal. German consulates typically allow up to 2 MB per file; French consulates often cap at 1 MB. Compressing to 1 MB covers the strictest common case and keeps total application packages well within the overall upload cap.",
    },
    {
      q: 'I have a 12-page report. Is 1 MB enough to keep it readable?',
      a: 'For a text-heavy 12-page report generated as a PDF, 1 MB is generous — you may need no compression at all. Scanned documents at 300 dpi across 12 pages typically start around 8–15 MB and compress to 1 MB with visible but acceptable quality reduction on photos.',
    },
  ],
  relatedSizes: ['to-500kb', 'to-2mb', 'to-5mb'],
  relatedVerticals: ['resume', 'visa-schengen', 'visa-uk'],
}
