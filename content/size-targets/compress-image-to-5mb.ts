import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 5 * 1024 * 1024,
  targetLabel: '5 MB',
  slug: 'to-5mb',
  h1: 'Compress Image to 5 MB',
  subhead:
    'Print-quality web uploads and the most permissive cap on most form-upload portals.',
  intro:
    "5 MB is as large as most form-upload portals will accept — and large enough for print-ready images delivered via web. A full-frame JPEG at 5 MB encodes a 4000×3000 px photo at near-lossless quality, which satisfies the pixel requirements for A3 printing at 300 dpi. Photography studios delivering web proofs to clients, graphic designers uploading source assets to shared tools, and photographers submitting images to stock libraries all work in the 3–5 MB range. This compressor targets 4.5–5 MB, giving you the maximum quality any web upload portal will accept.",
  useCases: [
    {
      label: 'Print-quality photos for web upload',
      description:
        "Photos destined for print (magazines, brochures, large-format posters) that need to be delivered via a web upload form. 5 MB at 300 dpi covers A4 print size — the ceiling for most upload portals.",
    },
    {
      label: 'Photography client deliveries via web gallery',
      description:
        'Photographer client galleries (Pic-Time, Pixieset, ShootProof) accept images up to 25 MB but display at web resolution. Delivering at 5 MB keeps gallery loading fast while giving clients download files suitable for standard print sizes.',
    },
    {
      label: 'Archival quality web storage',
      description:
        'Cloud backup of camera images via web interfaces (Google Photos, Flickr) where original quality is prioritised. 5 MB preserves near-original quality for long-term archival.',
    },
    {
      label: 'Stock photo and microstock submissions',
      description:
        'Shutterstock, Adobe Stock, and Getty Images require a minimum pixel resolution. A 5 MB JPEG typically exceeds the minimum pixel count for all standard microstock platforms.',
    },
  ],
  specificFaq: [
    {
      q: 'What print size can a 5 MB JPEG cover?',
      a: 'It depends on resolution and pixel dimensions. A 5 MB JPEG at 4000×3000 px printed at 300 dpi covers approximately 13×10 inches (A4 equivalent). At 200 dpi — acceptable for large-format printing viewed from a distance — the same file covers 20×15 inches. For A3 (11.7×16.5 in) at 300 dpi you need at least 3507×4961 px, which a 5 MB file can accommodate.',
    },
    {
      q: 'My camera produces 30 MB RAW files. Why would I ever compress to 5 MB?',
      a: "You would compress when the delivery medium limits you — a client portal, a stock submission site, or an email attachment. If you are archiving originals for editing, keep the RAW. If you are delivering a finished JPEG for a specific purpose, 5 MB is the largest compressed output that passes through every common web upload form without rejection.",
    },
    {
      q: 'Is there a meaningful quality difference between 5 MB and 3 MB for a typical photo?',
      a: 'At web display sizes, no. At print sizes, yes — on smooth gradients (sky, skin tones) in large-format prints, 5 MB shows finer tonal transitions than 3 MB. For A4 prints and smaller the difference is imperceptible. For A2 posters and larger, target 5 MB or higher.',
    },
    {
      q: 'Can I batch compress 500 photos to 5 MB at once?',
      a: "Yes. Drop all 500 files into the dropzone and the batch processor handles them in parallel. Each file is compressed to 5 MB independently. The output ZIP contains all compressed files named to match your originals. Processing time depends on your device — modern mobile chipsets handle 500 photos in a few minutes entirely in the browser, with no server upload required.",
    },
  ],
  relatedSizes: ['to-2mb'],
  relatedVerticals: ['photography', 'print'],
}
