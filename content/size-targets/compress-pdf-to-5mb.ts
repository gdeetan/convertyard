import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 5 * 1024 * 1024,
  targetLabel: '5 MB',
  slug: 'to-5mb',
  h1: 'Compress PDF to 5 MB',
  subhead:
    'Hit the WhatsApp document sweet spot and Turnitin / Moodle upload cap. Entirely in your browser.',
  intro:
    "5 MB is the WhatsApp document attachment sweet spot — the app allows up to 100 MB, but files above 5 MB load slowly on mobile data and are often abandoned by recipients before they open. It's also the most common upload limit for academic platforms: Turnitin caps individual file submissions at 5 MB, and Moodle's default assignment upload limit is 5 MB. The compressor targets 4.5–5 MB, giving room to breathe so your file opens cleanly on every platform.",
  useCases: [
    {
      label: 'WhatsApp document sharing',
      description:
        'Documents sent over WhatsApp Business and personal chats load fastest under 5 MB — larger files often appear as undownloaded for recipients on limited mobile data.',
    },
    {
      label: 'Turnitin assignment submissions',
      description:
        "Turnitin's plagiarism checker enforces a hard 5 MB per-file limit. Submissions over 5 MB are rejected at upload.",
    },
    {
      label: 'Moodle LMS assignment uploads',
      description:
        "Moodle's default max_upload_size is 5 MB in most institutional deployments. Students on underconfigured portals hit this limit frequently.",
    },
    {
      label: 'Email attachments without file-size warnings',
      description:
        'Gmail and Outlook mobile clients show a size warning above 5 MB before sending. Staying under 5 MB avoids the warning and keeps attachments opening quickly on mobile.',
    },
    {
      label: 'Cloud storage links shared in group chats',
      description:
        'Files shared as Google Drive or OneDrive links in group chats are expected to be under 5 MB by convention — larger files should use cloud storage, not direct attachment.',
    },
  ],
  specificFaq: [
    {
      q: 'Why does Turnitin reject my PDF even though my file viewer shows it is under 5 MB?',
      a: "Turnitin measures exact byte count. Some file viewers round or display megabytes differently. Verify your exact file size in your OS's file properties (right-click → Get Info on macOS; Properties on Windows). The compressor here targets 5,000 KB (5,120,000 bytes), safely under Turnitin's 5 MB limit.",
    },
    {
      q: "Can I submit a 5 MB PDF to Moodle if my institution has a higher limit?",
      a: "Yes — the 5 MB target is a safe default. If your Moodle instance allows 10 MB or 20 MB, you don't need to compress below 5 MB. Check your assignment upload screen for the maximum file size shown there.",
    },
    {
      q: 'WhatsApp shows my PDF as loading but recipients never see it open. Is this a size problem?',
      a: 'Possibly. WhatsApp downloads documents in the background on WiFi and pauses on mobile data. Files between 5–25 MB download but open slowly; files above 25 MB are blocked on some devices. Compressing to 5 MB ensures the document downloads and opens on all network conditions.',
    },
  ],
  relatedSizes: ['to-2mb', 'to-10mb'],
  relatedVerticals: [],
}
