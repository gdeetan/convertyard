import type { VerticalHubConfig } from '@/lib/types'

// Specs from RBI recruitment portal (opportunities.rbi.org.in). Photo and signature specs
// similar to IBPS/SBI. Document ceiling higher than most banking portals — up to 500 KB.
// RBI updates portal specs periodically; always verify against the latest notification.
// Verified June 2026.
export const rbiGradeBConfig: VerticalHubConfig = {
  slug: 'rbi-grade-b',
  name: 'RBI Grade B',
  fullName: 'Reserve Bank of India — Grade B Officer Recruitment',
  country: 'India',
  category: 'exam',
  h1: 'RBI Grade B 2026 Photo, Signature & Document Upload Kit',
  subhead:
    'Get your RBI Grade B application files to the exact portal spec. Browser-only.',
  intro:
    'RBI Grade B is one of the most competitive banking exams in India, drawing CA, MBA, and engineering graduates. Applications go through the RBI\'s recruitment portal at opportunities.rbi.org.in. Upload requirements are similar to IBPS and SBI but with a higher document file size allowance (up to 500 KB per document). RBI updates its portal specs with each notification — always verify against the current cycle\'s advertisement.',

  toolPresets: [
    {
      toolSlug: 'image-cropper',
      toolHref: '/image-cropper',
      label: 'Step 1: Crop photo to passport size',
      notes: 'White background, face clearly visible, recent photograph',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-50kb',
      label: 'Step 2: Compress photo to 20–50 KB',
      targetBytes: 50 * 1024,
      notes: 'Target 35–45 KB for comfortable margin within the RBI portal range',
    },
    {
      toolSlug: 'compress-image',
      toolHref: '/compress-image/to-20kb',
      label: 'Step 3: Compress signature to 10–20 KB',
      targetBytes: 20 * 1024,
      notes: '140×60 px, black ink on white paper',
    },
    {
      toolSlug: 'compress-pdf',
      toolHref: '/compress-pdf/to-500kb',
      label: 'Step 4: Compress supporting documents to 500 KB',
      targetBytes: 500 * 1024,
      notes: 'RBI allows larger document uploads than most banking portals',
    },
  ],

  officialSpecs: [
    {
      documentType: 'Photograph',
      size: '20–50 KB',
      dimensions: '200×230 pixels (or 3.5 cm × 4.5 cm)',
      format: 'JPG / JPEG',
      notes: 'Color, white background, recent; no headwear, no eyeglasses',
    },
    {
      documentType: 'Signature',
      size: '10–20 KB',
      dimensions: '140×60 pixels',
      format: 'JPG / JPEG',
      notes: 'Black ink on plain white paper',
    },
    {
      documentType: 'Supporting documents',
      size: 'Up to 500 KB each',
      dimensions: 'A4 scan',
      format: 'PDF',
      notes: 'Higher allowance than most banking portals; individual upload per document',
    },
  ],

  commonMistakes: [
    'Using a bank statement as address proof without compressing: a typical bank statement PDF is 2–5 MB; the RBI portal typically caps document uploads at 500 KB.',
    'Photo with eyeglasses: RBI Grade B follows IBPS guidelines which discourage eyeglasses in application photos — remove glasses before taking the photo.',
    'Uploading degree marksheets as individual page scans: RBI may require a combined PDF for multi-page marksheets — merge before uploading.',
    'Signature on cream or off-white paper: white background is required; cream shades can be flagged by the portal\'s background color validation.',
  ],

  specificFaq: [
    {
      q: 'Is the RBI Grade B photo size the same as IBPS PO?',
      a: 'Similar but check both notifications. Both typically require a 20–50 KB passport-format JPEG. RBI and IBPS run separate portals, so always verify against the current RBI advertisement at rbi.org.in/scripts/careers.',
    },
    {
      q: 'Can I wear glasses in my RBI Grade B application photo?',
      a: 'RBI Grade B follows general banking sector guidelines that discourage eyeglasses in application photos. The safest approach is to remove glasses for the photo — the portal\'s photo requirements explicitly state no eyeglasses.',
    },
    {
      q: 'How do I compress a 4 MB bank statement to under 500 KB?',
      a: 'Use the PDF compressor above targeting 500 KB. A 12-page bank statement typically compresses from 4 MB to under 500 KB; some fine-print rows may look slightly less sharp but all figures will remain clearly readable.',
    },
    {
      q: 'Does RBI Grade B require separate uploads for each semester marksheet?',
      a: 'RBI typically requires a consolidated degree certificate or combined marksheet for the degree as a whole. Check the notification\'s document checklist section — it specifies whether to upload individual semester sheets or a consolidated transcript.',
    },
    {
      q: 'What is the maximum document file size for RBI Grade B supporting documents?',
      a: 'RBI Grade B typically allows up to 500 KB per document, which is more generous than IBPS PO (300 KB) or SSC (300 KB). Scan your certificates at 200 DPI color and use the PDF compressor if any file exceeds 500 KB.',
    },
    {
      q: 'Can I use a digital signature scan for RBI Grade B?',
      a: 'No. RBI requires a wet ink signature (handwritten with pen on paper), scanned as a JPEG image. A digital signature image generated by a software tool will be rejected at document verification.',
    },
  ],

  relatedVerticals: ['ibps-po', 'sbi', 'insurance-exams'],
  lastUpdated: '2026-06-23',
}
