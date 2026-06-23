import type { VerticalHubConfig } from '@/lib/types'

// Common App: essay slots 500 KB, some up to 5 MB. Coalition App similar.
// Scanned transcripts from school copiers regularly hit 8–15 MB — the most common
// upload failure reason on r/ApplyingToCollege. Verified June 2026.
export const usCollegeApplicationConfig: VerticalHubConfig = {
  slug: 'us-college-application',
  name: 'US College Application',
  fullName: 'Common App and Coalition App Document Upload Kit',
  country: 'United States',
  category: 'job',
  h1: 'Common App & Coalition App Document Upload — File Size Guide',
  subhead:
    'Most document upload failures on Common App are file size issues. Fix them here before they block your submission.',
  intro:
    'Common App serves 900+ universities; Coalition App serves another 150+. Both have per-slot file size limits that are smaller than most applicants expect. A scanned transcript from a school copier routinely comes out at 8–15 MB — several times over the Common App\'s main essay slot limit of 500 KB. The most common support request from applicants is "why did my file upload fail?" — the answer is almost always file size. Compress your documents here before starting your application.',

  toolPresets: [
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-500kb',
      label: 'Compress essays and short documents to under 500 KB',
      targetBytes: 500 * 1024,
      notes: 'Common App main essay and most document slots cap at 500 KB',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-1mb',
      label: 'Compress resume/activities list to under 1 MB',
      targetBytes: 1 * 1024 * 1024,
      notes: 'Most portals accept resumes up to 1 MB; some accept up to 5 MB',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-5mb',
      label: 'Compress scanned transcripts to under 5 MB',
      targetBytes: 5 * 1024 * 1024,
      notes: 'For self-reported transcripts — school-submitted transcripts bypass this limit',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-500kb',
      label: 'Compress headshot or portfolio image to under 500 KB',
      targetBytes: 500 * 1024,
      notes: 'For programs that accept supplemental images (arts portfolios, etc.)',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Common App — Essay and document slots',
      size: 'Max 500 KB per slot (some slots up to 5 MB)',
      dimensions: 'N/A',
      format: 'PDF',
      notes: 'Check the specific slot — main essay is 500 KB; supplemental writing varies by school',
    },
    {
      documentType: 'Common App — Resume / activities list',
      size: 'Max 500 KB (recommended under 1 MB)',
      dimensions: 'N/A',
      format: 'PDF',
      notes: 'Uploaded under the Activities section',
    },
    {
      documentType: 'Common App — Official transcripts',
      size: 'Submitted by school counselor via Naviance or SCOIR (no size limit for applicant)',
      dimensions: 'N/A',
      format: 'PDF',
      notes: 'If self-reporting: unofficial copy, PDF, under 5 MB',
    },
    {
      documentType: 'Coalition App — Document slots',
      size: 'Max 500 KB per slot',
      dimensions: 'N/A',
      format: 'PDF',
      notes: 'Same as Common App main slots; confirm per school in the Coalition portal',
    },
  ],

  commonMistakes: [
    'Uploading a 15 MB scanned transcript: school office copiers scan at 300 DPI color by default; the resulting file is 8–20 MB. Compress to under 5 MB with the tool above.',
    'PDF with embedded fonts that don\'t render in Common App\'s viewer: use Print to PDF (not Save As PDF) to flatten fonts before uploading — this prevents text from showing as boxes or blank.',
    'Assuming all slots have the same limit: the main essay slot is 500 KB, but school-specific supplemental essay slots may allow more — always check each slot\'s tooltip before uploading.',
    'Uploading a Word .docx file: Common App requires PDF for most document types. .docx files are silently rejected on most slots without a clear error message.',
  ],

  specificFaq: [
    {
      q: 'What is the maximum file size for Common App essay uploads?',
      a: 'The Common App main essay slot accepts PDF files up to 500 KB. School-specific supplemental essay slots vary by institution and may allow up to 5 MB. Always check the tooltip or file requirements shown next to each upload field.',
    },
    {
      q: 'Why does Common App say my file failed to upload when it\'s only 8 MB?',
      a: 'The main essay slot caps at 500 KB — 8 MB is 16 times over the limit. An 8 MB file is typically a scanned document or a Word file exported with embedded graphics. Compress it to under 500 KB using the PDF compressor above.',
    },
    {
      q: 'Should I use Print to PDF or Save As PDF for my Common App essay?',
      a: 'Use Print to PDF. It flattens all fonts and formatting into a universal PDF that renders correctly in any viewer — including Common App\'s built-in document preview. "Save As PDF" from Word can embed fonts that don\'t render correctly on the Common App side, showing blank text boxes.',
    },
    {
      q: 'What is the difference between Common App and Coalition App document requirements?',
      a: 'Both platforms accept PDF documents and cap individual slot uploads at around 500 KB. The difference is which universities use which platform — most of the same schools accept both, but a few use only one. Upload requirements at the slot level are similar.',
    },
    {
      q: 'Can I upload a Word document to Common App, or does it have to be PDF?',
      a: 'Common App requires PDF for document uploads. Word .docx files are rejected — often silently, without a clear error message. Convert your essay to PDF using Print to PDF before uploading.',
    },
    {
      q: 'My transcript is 12 MB — how do I compress it without losing text readability?',
      a: 'Use the PDF compressor above targeting 5 MB. A 12 MB transcript is typically a color scan at 300 DPI; the compressor converts to grayscale and reduces DPI, bringing it to under 3 MB while keeping all printed text clearly readable. If your school submits transcripts via Naviance or Parchment, you may not need to upload a transcript yourself at all.',
    },
  ],

  relatedVerticals: ['us-ds-160-visa'],
  lastUpdated: '2026-06-23',
}
