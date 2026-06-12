import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-pdf',
  targetBytes: 200 * 1024,
  targetLabel: '200 KB',
  slug: 'to-200kb',
  h1: 'Compress PDF to 200 KB',
  subhead:
    'Fit mark sheets, certificates, and photo ID proofs into the 200 KB ceiling most Indian portals enforce.',
  intro:
    "200 KB is the most common Indian government portal ceiling for full document scans — mark sheets, certificates, and photo ID proofs. At double the space of the 100 KB limit, compression can be less aggressive, which means better quality on printed text and photos. Passport Seva, state PSC portals, and Indian e-Visa applications are the most common portals with this exact threshold. The compressor targets the range 180–200 KB, leaving headroom so minor encoding differences don't push you over.",
  useCases: [
    {
      label: 'UPSC documents upload (photo ID, certificates)',
      description:
        'Supporting documents uploaded during the UPSC DAF submission are capped at 200 KB per file.',
    },
    {
      label: 'SSC photograph and signature combined upload',
      description:
        'SSC CGL and CHSL portals require combined photo-and-signature PDFs within 200 KB.',
    },
    {
      label: 'Passport Seva online application certificate upload',
      description:
        "Passport Seva Kendra's online portal enforces a 200 KB limit on scanned supporting documents.",
    },
    {
      label: 'Indian e-Visa photo upload',
      description:
        'The Indian e-Visa application system accepts photo and document uploads up to 200 KB per file.',
    },
    {
      label: 'State PSC exam application uploads',
      description:
        'State Public Service Commission portals (UPPSC, BPSC, MPSC) typically cap per-document PDFs at 200 KB.',
    },
  ],
  specificFaq: [
    {
      q: 'Is 200 KB enough for a clear scan of a mark sheet?',
      a: 'Yes, for a single A4 mark sheet scanned at 150–200 dpi in grayscale. If scanned at 300 dpi color the original will be 1–3 MB — the compressor downsamples embedded images to fit. Text remains sharp; fine print in tables may soften slightly.',
    },
    {
      q: 'Passport Seva rejected my document even though my file is under 200 KB. Why?',
      a: 'Passport Seva checks file size, image resolution, and sometimes file structure. If your PDF passes size checks but still fails, verify the file is not password-protected, does not use uncommon fonts, and was exported as a standard PDF. ConvertYard outputs standard PDFs compatible with Passport Seva.',
    },
    {
      q: 'Can I compress a multi-page certificate booklet to 200 KB?',
      a: 'It depends on page count and content. A 4-page scanned booklet at 300 dpi will likely compress to 200 KB cleanly. Beyond 8 pages, you may need to split the document or reduce scan resolution before uploading.',
    },
    {
      q: 'Does the 200 KB page process files differently than the 100 KB page?',
      a: 'The underlying compression algorithm is identical. The only difference is the target size. The 200 KB target allows less aggressive image downsampling, so output quality is visibly better than when targeting 100 KB.',
    },
  ],
  relatedSizes: ['to-100kb', 'to-300kb', 'to-500kb', 'to-1mb'],
  relatedVerticals: ['upsc', 'passport-seva', 'visa-india'],
}
