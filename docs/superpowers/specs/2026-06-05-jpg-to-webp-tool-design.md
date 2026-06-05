# JPG to WebP Tool — Design Spec

**Date:** 2026-06-05  
**Branch:** feature/ga4-consent (implementation on new branch)  
**Status:** Approved

---

## Goal

Ship the first real tool page at `/jpg-to-webp`. This is the hero converter for the image cluster and the template every subsequent tool will follow.

---

## Architecture

Three new files, zero changes to existing code (homepage hero stays canvas-based):

```
/lib/converters/libvips.ts          # wasm-vips wrapper, format-agnostic
/content/tools/jpg-to-webp.ts       # ToolConfig — options, FAQ, meta
/app/(tools)/jpg-to-webp/page.tsx   # 5-line page, exports metadata
```

---

## `lib/converters/libvips.ts`

**Signature:**
```typescript
export function libvipsConvert(
  files: File[],
  outputFormat: string,
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]>
```

**Behaviour:**
- Lazy-loads `wasm-vips` on first call (never before user interaction)
- Processes files **sequentially** — avoids peak-memory scaling with batch size; safe for 1000-file batches
- Calls `onProgress(i, 50)` at encode start, `onProgress(i, 100)` at done
- Returns `ConversionResult[]`: `File` on success, `Error` on failure — result carries original size + output size so the UI can show savings
- Invalid MIME types return `Error` immediately, without loading WASM
- Lossless: when `opts.lossless === true`, passes `{lossless: true}` to vips; quality slider ignored
- Auto-orient: when `opts.autoOrient === true` (default), reads EXIF orientation tag and rotates/flips pixels, then strips the tag
- Strip metadata: when `opts.stripMetadata === true`, removes all EXIF/ICC/XMP; when false (default), copies ICC profile and EXIF to output
- Resize: when `opts.maxDimension > 0`, downscales the longer edge to that px value (aspect ratio preserved); no upscaling
- Sharpen: when `opts.sharpen === true`, applies libvips unsharp-mask (sigma 0.5, x1 1.0) after encode — compensates for WebP's slight softness
- Compression method: `opts.method` (0–6, default 4) passed as WebP `effort` param; 0 = fastest/largest, 6 = slowest/smallest
- Output filename: strip original extension, append output format ext (e.g. `photo.jpg` → `photo.webp`)

**Extended `ConversionResult` for size delta:**  
The result `File` object gets two custom properties attached: `_originalSize: number` and `_outputSize: number`. The result list reads these to render the savings badge. (Using non-standard properties on `File` avoids changing the `ConversionResult` type or adding a wrapper type.)

**COOP/COEP headers:**  
`wasm-vips` uses `SharedArrayBuffer` for threading. `next.config` must add path-matched headers scoped to tool pages only (not global — would break third-party embeds on other pages):
```js
{ source: '/(tools)/:path*',
  headers: [
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  ]
}
```
Note: Cloudflare Pages respects `next.config` headers in static export via `_headers` file. Verify the build outputs `public/_headers` with these rules.

---

## `content/tools/jpg-to-webp.ts`

```typescript
{
  slug: 'jpg-to-webp',
  title: 'JPG to WebP Converter',
  subtitle: 'Local-first JPG to WebP conversion. Built for batches.',
  category: 'images',
  accepts: ['image/jpeg'],
  acceptsExt: ['.jpg', '.jpeg'],
  outputExt: '.webp',
  convertFn: (files, opts, onProgress) =>
    libvipsConvert(files, 'webp', opts, onProgress),

  options: [
    {
      type: 'slider',
      name: 'quality',
      label: 'Quality',
      min: 1, max: 100, default: 80,
      hint: '80 is the sweet spot for most uses',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Larger files, perfect quality — ignores quality slider',
    },
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0, max: 16000, step: 1, default: 0,
      hint: 'Downscales the longer edge. 0 = keep original size. No upscaling.',
    },
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Fixes rotation from phone EXIF data',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF/ICC data. Smaller files, less privacy info.',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Counteracts WebP\'s slight softness vs JPG',
    },
    {
      type: 'slider',
      name: 'method',
      label: 'Compression effort',
      min: 0, max: 6, step: 1, default: 4,
      hint: '0 = fastest (larger file), 6 = smallest (slower)',
    },
  ],

  faq: [
    { q: 'Does converting JPG to WebP reduce quality?', a: '...' },
    { q: 'How much smaller will my WebP files be?', a: '...' },
    { q: 'Does WebP work in all browsers?', a: '...' },
    { q: 'What\'s the difference between lossy and lossless WebP?', a: '...' },
    { q: 'Can I convert 1,000 JPGs at once?', a: '...' },
    { q: 'Are my files uploaded to your servers?', a: '...' },
  ],

  relatedTools: ['png-to-webp', 'jpg-to-avif', 'webp-to-jpg', 'image-compressor'],
  // Note: these tool pages don't exist yet. Verify RelatedToolsStrip
  // handles unknown slugs gracefully (renders nothing / skips) before shipping.
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'best-webp-quality', 'batch-convert-images'],
  // Note: these articles don't exist yet. Same — verify RelatedArticlesStrip skips unknown slugs.

  meta: {
    title: 'JPG to WebP Converter — ConvertYard',
    description: 'Convert JPG to WebP in your browser. Batch up to 1,000 files at once — no uploads, no account, no watermarks. Free forever.',
  },
}
```

---

## `app/(tools)/jpg-to-webp/page.tsx`

```typescript
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/jpg-to-webp'

export const metadata = config.meta
export default function Page() {
  return <ToolShell config={config} />
}
```

---

## Homepage hero

No changes. The `MiniConverter` in `components/homepage/hero.tsx` stays canvas-based — it's a marketing teaser, not the real tool. Coupling homepage perf to a 7MB WASM binary would hurt LCP on the most important page.

---

## Result list: size savings badge

Each file row in `ResultList` shows: `originalSize → outputSize (−X%)` when `_originalSize` and `_outputSize` are present on the result `File`. This is the key trust/delight feature — users see proof of savings per file. If output is larger than input (can happen at quality 100 or lossless), show `+X%` in a neutral color (not red — lossless larger is expected).

---

## Quality gates (from LAUNCH-CHECKLIST)

- [ ] Converts 1 JPG correctly, shows size savings badge
- [ ] Converts 10 JPGs correctly (per-file progress visible)
- [ ] Converts 100 JPGs without crashing
- [ ] Converts 1000 JPGs (slow is fine, must complete)
- [ ] Invalid file (PDF) → graceful `Error`, batch continues
- [ ] Lossless toggle → output visually identical, file larger, badge shows `+X%` in neutral color
- [ ] Auto-orient → a sideways phone photo is corrected
- [ ] Strip metadata → exiftool on output shows no EXIF
- [ ] Max dimension → 4000px wide image with maxDimension=1000 outputs 1000px wide
- [ ] Sharpen → visible difference at quality 60 on a photo with fine detail
- [ ] Mobile: file picker works on tap
- [ ] Lighthouse all scores ≥ 90 on `/jpg-to-webp`

---

## What's out of scope

- Updating the homepage hero's `convertToWebP` — separate concern
- Building related tools (png-to-webp, jpg-to-avif, etc.) — follow-on work
- Writing the 3 supporting articles — can be drafted post-ship
