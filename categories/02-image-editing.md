# Cluster 02 — Image Editing

## Seed keyword

**Primary seed:** `image editor`

Cluster hub page targets this. Individual tools target specific tasks
(resize, compress, crop, etc.) and link up to the hub.

**Why this seed:** Captures category-level intent for "edit photos
without Photoshop." The cluster's identity is "the workshop for
batch photo tasks."

**Alternate seed (consider testing):** `bulk image editor` — narrower
but aligns more tightly with the batch wedge. Lower volume but lower
KD and higher conversion to bookmark.

## Secondary anchor keywords

- `image resizer` (~50K vol, KD ~45)
- `image compressor` (~80K vol, KD ~50)
- `background remover` (~50K vol, KD ~55)
- `image cropper` (~20K vol, KD ~40)
- `bulk image resize` (~10K vol, KD ~30)

## Cluster priority

**#2** — Build after image conversion is established. Higher commercial
intent than conversion (people doing real work, e-com sellers,
photographers). Stronger conversion to repeat visits.

## Cluster traffic estimate at maturity

**25,000–35,000 monthly visits**

## Tools to build (10)

| Tool | Slug | Target keyword | Est. volume | KD |
|---|---|---|---|---|
| Bulk image compressor | image-compressor | image compressor | 80K | 50 |
| Batch image resizer | image-resizer | image resizer | 50K | 45 |
| Background remover | background-remover | background remover | 50K | 55 |
| Image cropper (batch) | image-cropper | image cropper | 20K | 40 |
| Image upscaler | image-upscaler | image upscaler | 30K | 50 |
| Watermark adder (batch) | add-watermark | add watermark to photos | 5K | 30 |
| OCR (image to text) | image-to-text | image to text | 40K | 50 |
| Bulk rename + resize | bulk-rename-images | bulk rename images | 2K | 25 |
| Color palette extractor | color-palette-from-image | color palette from image | 8K | 35 |
| EXIF viewer/stripper | exif-viewer | exif viewer | 5K | 30 |

## Build order

1. Bulk image compressor (highest volume + clearest batch demo)
2. Batch image resizer
3. Background remover (AI flagship, Product Hunt-able)
4. Image cropper
5. Image upscaler
6. Watermark adder
7. OCR
8. EXIF stripper
9. Bulk rename + resize
10. Color palette extractor

## Supporting articles (10)

| Article | Target long-tail | Est. vol | KD |
|---|---|---|---|
| How to compress images without losing quality | "compress images without losing quality" | 3K | 30 |
| Image dimensions for every social platform 2026 | "image dimensions social media" | 5K | 35 |
| Remove backgrounds from 100 product photos | "bulk background removal" | 1K | 25 |
| Free vs paid background removers compared | "free background remover" | 8K | 45 |
| How to upscale old photos with AI | "ai photo upscaler" | 4K | 35 |
| Bulk watermarking for photographers | "watermark multiple photos" | 800 | 25 |
| OCR accuracy compared by engine | "best ocr software free" | 6K | 40 |
| How to strip EXIF data before sharing | "remove exif data" | 3K | 30 |
| The product photo workflow | "product photo workflow" | 500 | 20 |
| Image SEO: alt text, file names, compression | "image seo best practices" | 2K | 30 |

## Internal linking strategy

- Every tool links to 2–3 sibling tools (resize + compress + crop are
  natural triads)
- "Frequently used together" widget on every tool page
- Every tool links to 2 supporting articles
- Cluster hub `/image-editor` aggregates all 10

## Wedge-specific notes

- **Background removal** is the AI flagship and biggest Product Hunt
  hook. Uses BiRefNet or RMBG-2.0 in-browser via transformers.js.
  Model is ~50MB but cached after first download.
- **Batch matters disproportionately here.** Single-image editing is
  served by Photopea. Our differentiation is doing the same operation
  to 100 images at once.
- Compete on simplicity and batch, not features. No layers, no manual
  retouching, no brushes. That's Photopea's fight, not ours.
- Never use the word "Photoshop" anywhere. Trademark risk and wrong
  framing.

## SERP context

- Head terms (image resizer, image compressor) dominated by TinyPNG,
  iLovePDF Image, Squoosh, Canva, big SaaS
- Batch-specific terms much weaker — clear opportunity
- Background remover dominated by remove.bg — but they upload and
  charge after 1 image. Our local + free + batch story is genuinely
  different.

## Watch list

- New in-browser AI models (RMBG-2.0, future releases) — upgrade
  background remover when accuracy meaningfully improves
- WebGPU adoption — when stable, upscaling and BG removal speed up
  3–5x, which is a feature worth a relaunch
