import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 500 * 1024,
  targetLabel: '500 KB',
  slug: 'to-500kb',
  h1: 'Compress PDF to 500 KB',
  subhead:
    'Better quality than 100–200 KB while staying under the limit for DU, JoSAA, CUET, and job portals.',
  intro:
    "500 KB is a comfortable target that gives noticeably better quality than 100–200 KB while still fitting nearly any portal upload form. It's the standard ceiling for college admission forms — DU's CSAS portal, JoSAA engineering counseling, and CUET applications — as well as many private job application portals and bank loan document submissions. The compression at this size is mild enough that photos and handwritten documents remain clearly legible.",
  useCases: [
    {
      label: 'DU undergraduate admission (CSAS portal)',
      description:
        "Delhi University's CSAS portal caps uploaded mark sheets and certificates at 500 KB per document during admission registration.",
    },
    {
      label: 'JoSAA engineering counseling document uploads',
      description:
        'JoSAA online counseling for IITs, NITs, and IIITs requires class-10 and class-12 certificates within 500 KB.',
    },
    {
      label: 'CUET application documents',
      description:
        "NTA's CUET UG and PG application portals set a 500 KB per-file limit for uploaded identity and academic documents.",
    },
    {
      label: 'Private job application portals',
      description:
        'Company career portals on Naukri, Indeed, and hiring platforms cap resume and certificate PDFs at 500 KB.',
    },
    {
      label: 'Bank loan application document package',
      description:
        'Retail bank and NBFC loan portals require KYC, income, and property documents under 500 KB each to pass front-end validation.',
    },
  ],
  specificFaq: [
    {
      q: 'Is 500 KB enough for a high-quality scanned certificate?',
      a: "Yes. A single A4 page scanned at 200 dpi color fits comfortably under 500 KB with minimal compression. At 300 dpi, you'll need light compression that still preserves all text and stamps clearly.",
    },
    {
      q: 'JoSAA asks for a 500 KB limit but also JPG format — can I use a PDF?',
      a: "Some JoSAA upload slots accept only JPG. Check the upload field's accepted formats tooltip. For slots that accept PDF, 500 KB is the limit. For JPG-only slots, ConvertYard's image compressor can help you hit the size target in JPG format instead.",
    },
    {
      q: 'My 12-page bank statement is 4 MB. Can I compress it to 500 KB?',
      a: 'Probably not without text becoming illegible. Bank statements with small-font tables compress poorly below 100 KB per page. Consider uploading only the relevant pages (first page plus the transaction summary page), then compressing that shorter document.',
    },
    {
      q: 'Will compressing to 500 KB affect digital signatures or form fields in the PDF?',
      a: 'Compressing a digitally signed PDF typically invalidates the signature because the file bytes change. If your document has a valid digital signature that must be preserved, upload it as-is — do not compress.',
    },
  ],
  relatedSizes: ['to-200kb', 'to-300kb', 'to-1mb'],
  relatedVerticals: ['college-admission', 'job-application', 'us-college-application', 'rbi-grade-b', 'nda-cds', 'insurance-exams'],
}
