import type { SizeTargetConfig } from '@/lib/types'

export const config: SizeTargetConfig = {
  parentTool: 'compress-image',
  targetBytes: 2 * 1024 * 1024,
  targetLabel: '2 MB',
  slug: 'to-2mb',
  h1: 'Compress Image to 2 MB',
  subhead:
    'Product photography, e-commerce listings, and high-resolution web display.',
  intro:
    "2 MB is the working size for product photography destined for e-commerce platforms and high-resolution web display. Amazon requires product images at 1000 px or wider on the longest side — at 2 MB you can deliver a 2000×2000 px JPEG at around 90% quality, which satisfies Amazon's zoom requirements with room to spare. Etsy, eBay, and Shopify all work best with images in the 1–3 MB range. For photography portfolios displayed at full viewport width on a retina display, 2 MB provides the pixel density you need without causing slow page loads. This compressor targets 1.8–2 MB.",
  useCases: [
    {
      label: 'Amazon product photos',
      description:
        'Amazon requires product images at a minimum of 1000 px on the longest side for zoom to activate. A 2000×2000 px JPEG at 2 MB delivers the zoom feature with excellent detail on white backgrounds.',
    },
    {
      label: 'Etsy and eBay listing photos',
      description:
        'Etsy recommends images at 2000 px wide minimum; eBay shows listings at up to 1600 px. A 2 MB image at these dimensions loads quickly and displays sharply in both marketplace interfaces.',
    },
    {
      label: 'Shopify product images',
      description:
        'Shopify recommends product images between 2048×2048 px and 4472×4472 px. A 2 MB file fits within Shopify image upload limits and renders well across all Shopify themes.',
    },
    {
      label: 'Photography portfolio web display',
      description:
        'Full-bleed portfolio images displayed at 2560 px wide on a retina display benefit from 2 MB to avoid visible compression artefacts on smooth gradients and skin tones.',
    },
  ],
  specificFaq: [
    {
      q: 'Amazon says images must be under 10 MB. Why use 2 MB instead?',
      a: "Amazon's 10 MB limit is a hard cap, not a recommendation. Large images slow down listing page load times, which Amazon's A9 algorithm tracks as a ranking signal. 2 MB at 2000×2000 px gives you all the zoom functionality Amazon requires while loading fast enough not to hurt your listing's search ranking.",
    },
    {
      q: 'What image dimensions work best for a 2 MB product photo?',
      a: 'Square images at 2000×2000 px are the e-commerce standard — they work on Amazon, Etsy, eBay, and most Shopify themes without cropping. For lifestyle shots (non-square), 2000×1500 px (4:3) or 2000×1333 px (3:2) are good choices.',
    },
    {
      q: 'Should I use JPEG or PNG for product photos at 2 MB?',
      a: 'JPEG for product photos on white backgrounds. PNG only if your product image has a transparent background and the platform supports it (Shopify does; Amazon does not). At 2 MB, a JPEG encodes a 2000×2000 px photo at roughly 90% quality — visually lossless for most product photography.',
    },
    {
      q: 'I shoot RAW files at 25 MB each. How much quality is lost compressing to 2 MB?',
      a: "Minimal for web display. RAW files contain 14-bit colour data for editing purposes; your monitor displays 8-bit colour. The transition from RAW to 2 MB JPEG loses editing headroom, not visible display quality. At web viewing distances, a properly processed 2 MB JPEG from a 25 MB RAW file is indistinguishable from the RAW source.",
    },
  ],
  relatedSizes: ['to-1mb', 'to-5mb'],
  relatedVerticals: ['ecommerce', 'photography'],
}
