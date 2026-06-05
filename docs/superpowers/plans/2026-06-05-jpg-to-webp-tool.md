# JPG to WebP Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first real tool page at `/jpg-to-webp` — a local-first batch JPG→WebP converter with quality, lossless, resize, auto-orient, metadata, sharpen, and compression effort controls.

**Architecture:** `wasm-vips` processes images client-side via WebAssembly. A format-agnostic `libvipsConvert` function in `lib/converters/libvips.ts` handles all image operations; the `ToolConfig` in `content/tools/jpg-to-webp.ts` wires it into the existing `ToolShell`. The page file is 5 lines. COOP/COEP headers are required for `wasm-vips`'s `SharedArrayBuffer` threading.

**Tech Stack:** wasm-vips (WebAssembly libvips), Next.js 15 static export, TypeScript, Cloudflare Pages (`public/_headers`)

---

## File map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `lib/converters/libvips.ts` | wasm-vips wrapper — loads WASM, applies all image operations, returns `ConversionResult[]` |
| Create | `content/tools/jpg-to-webp.ts` | Full `ToolConfig` — options, FAQ, meta, related |
| Create | `app/(tools)/jpg-to-webp/page.tsx` | 5-line page, exports `metadata` |
| Create | `public/_headers` | COOP/COEP headers for Cloudflare Pages (required for SharedArrayBuffer) |
| Modify | `next.config.ts` | Webpack `asyncWebAssembly` experiment + headers for local dev server |

> **Not modified:** `components/tool-shell/result-list.tsx` already computes and renders size savings badges (`file.size` vs `result.size`). No changes needed. `RelatedToolsStrip` generates link text from slug strings — renders fine even for pages that don't exist yet.

---

## Task 1: Install wasm-vips and copy WASM binary to public

**Files:**
- Modify: `package.json` (add dependency + postinstall script)
- Create: `public/vips.wasm` (copied from node_modules)

wasm-vips loads its `.wasm` binary at runtime via fetch. In a static export served by Cloudflare Pages, the binary must be in `public/` so it's accessible at `/vips.wasm`. We use `locateFile` in the converter to tell wasm-vips where to find it.

- [ ] **Step 1: Install wasm-vips**

```bash
cd /Users/garrickdeetan/Documents/Covertyard
npm install wasm-vips
```

Expected: `wasm-vips` appears in `node_modules/` and `package.json` dependencies.

- [ ] **Step 2: Copy WASM binary to public**

```bash
cp node_modules/wasm-vips/lib/vips-es6.wasm public/vips.wasm
```

Verify: `ls -lh public/vips.wasm` — should be ~6–9MB.

If the path `node_modules/wasm-vips/lib/vips-es6.wasm` doesn't exist, find it with:
```bash
find node_modules/wasm-vips -name "*.wasm" | head -5
```
Use whichever `.wasm` file is found and update the path accordingly.

- [ ] **Step 3: Add postinstall script so the binary is re-copied after `npm install`**

Open `package.json`. Add a `postinstall` script to the `scripts` block:

```json
"postinstall": "cp node_modules/wasm-vips/lib/vips-es6.wasm public/vips.wasm 2>/dev/null || true"
```

The full `scripts` block should look like:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "postinstall": "cp node_modules/wasm-vips/lib/vips-es6.wasm public/vips.wasm 2>/dev/null || true"
}
```

If the wasm file path differs from step 2, update this script to match.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json public/vips.wasm
git commit -m "chore: add wasm-vips, copy WASM binary to public"
```

---

## Task 2: Configure Next.js for WASM and COOP/COEP headers

**Files:**
- Modify: `next.config.ts`
- Create: `public/_headers`

wasm-vips uses `SharedArrayBuffer` for threading, which requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` HTTP headers. We set these in two places:
- `public/_headers` — Cloudflare Pages reads this for production
- `next.config.ts` headers() — Next.js dev server reads this locally

The webpack `asyncWebAssembly` experiment tells webpack to handle `.wasm` imports correctly during the Next.js build.

- [ ] **Step 1: Update `next.config.ts`**

Replace the entire file with:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/(tools)/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}

export default nextConfig
```

- [ ] **Step 2: Create `public/_headers` for Cloudflare Pages production**

```
/(tools)/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors, fix before continuing.

- [ ] **Step 4: Commit**

```bash
git add next.config.ts public/_headers
git commit -m "chore: enable asyncWebAssembly, add COOP/COEP headers for wasm-vips"
```

---

## Task 3: Create `lib/converters/libvips.ts`

**Files:**
- Create: `lib/converters/libvips.ts`

This is the format-agnostic converter that all image tools will share. It lazy-loads wasm-vips once (singleton), then processes files sequentially to keep peak memory bounded regardless of batch size.

- [ ] **Step 1: Create `lib/converters/libvips.ts`**

```typescript
import type { ToolOptions, ConversionResult } from '@/lib/types'

// Singleton: load wasm-vips once, reuse across all conversions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vipsReady: Promise<any> | null = null

function loadVips() {
  if (!vipsReady) {
    vipsReady = import('wasm-vips').then(({ default: Vips }) =>
      Vips({
        // Tell wasm-vips where to find its WASM binary (copied to public/ by postinstall)
        locateFile: () => '/vips.wasm',
      })
    )
  }
  return vipsReady
}

/**
 * Convert an array of files to the given output format using libvips/wasm-vips.
 *
 * Supported opts keys (all optional):
 *   quality       number  1-100, default 80. Ignored when lossless=true.
 *   lossless      boolean Lossless encode. Default false.
 *   method        number  0-6, WebP compression effort. Default 4.
 *   autoOrient    boolean Fix EXIF rotation. Default true.
 *   maxDimension  number  Downscale longer edge to this px. 0 = no resize. Default 0.
 *   stripMetadata boolean Remove all EXIF/ICC/XMP. Default false.
 *   sharpen       boolean Apply mild unsharp-mask after encode. Default false.
 *
 * Files are processed sequentially. Each file's result is File on success,
 * Error on failure — the batch continues regardless of individual failures.
 */
export async function libvipsConvert(
  files: File[],
  outputFormat: string,
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const vips = await loadVips()
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // Reject non-image MIME types immediately — don't waste WASM call
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpe?g|png|webp|avif|heic|gif|tiff?)$/i)) {
      results.push(new Error(`Unsupported file type: ${file.type || 'unknown'}`))
      onProgress?.(i, 100)
      continue
    }

    onProgress?.(i, 10)

    try {
      const buffer = await file.arrayBuffer()
      const uint8 = new Uint8Array(buffer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let image: any = vips.Image.newFromBuffer(uint8)

      // 1. Auto-orient: correct rotation from EXIF (default ON)
      if (opts.autoOrient !== false) {
        image = image.autorot()
      }

      onProgress?.(i, 30)

      // 2. Resize: downscale longer edge, preserve aspect ratio, no upscaling
      const maxDim = typeof opts.maxDimension === 'number' ? opts.maxDimension : 0
      if (maxDim > 0) {
        const longer = Math.max(image.width, image.height)
        if (longer > maxDim) {
          image = image.resize(maxDim / longer)
        }
      }

      onProgress?.(i, 50)

      // 3. Sharpen (mild unsharp-mask to compensate for WebP softness)
      if (opts.sharpen === true) {
        image = image.sharpen({ sigma: 0.5, x1: 1.0 })
      }

      onProgress?.(i, 70)

      // 4. Encode
      const quality = typeof opts.quality === 'number' ? opts.quality : 80
      const method = typeof opts.method === 'number' ? opts.method : 4
      const encodeOpts: Record<string, unknown> = {
        Q: quality,
        lossless: opts.lossless === true,
        effort: method,
        strip: opts.stripMetadata === true,
      }

      const outBuffer: Uint8Array = image.writeToBuffer(`.${outputFormat}`, encodeOpts)

      // Free the vips image from WASM memory immediately after encode
      image.delete()

      const baseName = file.name.replace(/\.[^.]+$/, '')
      const mimeType = outputFormat === 'webp' ? 'image/webp'
        : outputFormat === 'avif' ? 'image/avif'
        : outputFormat === 'png' ? 'image/png'
        : 'image/jpeg'

      const result = new File([outBuffer], `${baseName}.${outputFormat}`, { type: mimeType })

      onProgress?.(i, 100)
      results.push(result)
    } catch (err) {
      onProgress?.(i, 100)
      results.push(err instanceof Error ? err : new Error(`Failed to convert ${file.name}`))
    }
  }

  return results
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. Common issue: if wasm-vips doesn't ship types, add `declare module 'wasm-vips'` to a `lib/wasm-vips.d.ts` shim:

```typescript
// lib/wasm-vips.d.ts  (only create this if tsc reports "cannot find module 'wasm-vips'")
declare module 'wasm-vips' {
  interface VipsImage {
    width: number
    height: number
    autorot(): VipsImage
    resize(scale: number): VipsImage
    sharpen(opts?: { sigma?: number; x1?: number }): VipsImage
    writeToBuffer(suffix: string, opts?: Record<string, unknown>): Uint8Array
    delete(): void
  }
  interface VipsInstance {
    Image: {
      newFromBuffer(data: Uint8Array): VipsImage
    }
  }
  function Vips(opts?: { locateFile?: (name: string) => string }): Promise<VipsInstance>
  export default Vips
}
```

Re-run `npx tsc --noEmit` — must pass cleanly.

- [ ] **Step 3: Commit**

```bash
git add lib/converters/libvips.ts
git commit -m "feat: libvips WASM converter — format-agnostic image conversion"
```

---

## Task 4: Create `content/tools/jpg-to-webp.ts`

**Files:**
- Create: `content/tools/jpg-to-webp.ts`

- [ ] **Step 1: Create `content/tools/jpg-to-webp.ts`**

```typescript
import { libvipsConvert } from '@/lib/converters/libvips'
import type { ToolConfig } from '@/lib/types'

export const config: ToolConfig = {
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
      min: 1,
      max: 100,
      step: 1,
      default: 80,
      hint: '80 is the sweet spot — visually identical to JPG at a fraction of the size',
    },
    {
      type: 'toggle',
      name: 'lossless',
      label: 'Lossless mode',
      default: false,
      hint: 'Larger files, pixel-perfect quality — ignores the quality slider',
    },
    {
      type: 'number',
      name: 'maxDimension',
      label: 'Max dimension (px)',
      min: 0,
      max: 16000,
      step: 1,
      default: 0,
      hint: 'Downscales the longer edge. 0 = keep original size. Never upscales.',
    },
    {
      type: 'toggle',
      name: 'autoOrient',
      label: 'Auto-orient',
      default: true,
      hint: 'Fixes rotation on phone photos using EXIF data',
    },
    {
      type: 'toggle',
      name: 'stripMetadata',
      label: 'Strip metadata',
      default: false,
      hint: 'Removes EXIF, GPS, and camera data — smaller files, more privacy',
    },
    {
      type: 'toggle',
      name: 'sharpen',
      label: 'Sharpen',
      default: false,
      hint: 'Adds a mild sharpening pass — useful if WebP looks softer than your JPG',
    },
    {
      type: 'slider',
      name: 'method',
      label: 'Compression effort',
      min: 0,
      max: 6,
      step: 1,
      default: 4,
      hint: '0 = fastest encode (larger file), 6 = smallest file (slower)',
    },
  ],

  faq: [
    {
      q: 'Does converting JPG to WebP reduce quality?',
      a: 'At the default quality of 80, the difference is invisible to most viewers — WebP is simply more efficient than JPG at the same perceptual quality. If you enable lossless mode, there is zero quality loss. The only scenario where you would notice degradation is at very low quality settings (below 50), which would look bad in any format.',
    },
    {
      q: 'How much smaller will my WebP files be?',
      a: 'On average, 25–35% smaller than the equivalent JPG. Results vary by content: photos with gradients and smooth tones compress best (30–40% savings), while images with sharp edges or text see smaller gains (10–20%). ConvertYard shows you the exact byte savings per file in your results so you can see the difference immediately.',
    },
    {
      q: 'Does WebP work in all browsers?',
      a: 'WebP is supported in all modern browsers: Chrome, Edge, Firefox, and Safari (since version 14, released September 2020). That covers over 97% of global web traffic. If you need to support Safari 13 or Internet Explorer, stick with JPG. For any modern web project, WebP is the right default.',
    },
    {
      q: "What's the difference between lossy and lossless WebP?",
      a: 'Lossy WebP (the default) discards some pixel data to shrink file size — at quality 80 this is imperceptible. Lossless WebP preserves every pixel exactly, like a PNG, but uses smarter compression than PNG and is typically 25% smaller than an equivalent PNG. Lossless files are 10–30% larger than lossy equivalents. Use lossless for logos, screenshots, UI assets, or images you plan to edit again.',
    },
    {
      q: 'Can I convert 1,000 JPGs at once?',
      a: 'Yes. Drop them all in at once and ConvertYard processes them one at a time in your browser — no uploads, no queues, no server. Speed depends on your device, image dimensions, and the compression effort setting. On a modern laptop, 1,000 average-sized photos typically finishes in 5–15 minutes. Download them all as a single ZIP when done.',
    },
    {
      q: 'Are my files uploaded to your servers?',
      a: "Never. Conversion runs entirely in your browser using WebAssembly — the same technology behind browser-based tools like Figma. Your files never leave your device. ConvertYard's servers only deliver the tool's code; they never see your images, filenames, or metadata.",
    },
  ],

  relatedTools: ['png-to-webp', 'jpg-to-avif', 'webp-to-jpg', 'image-compressor'],
  relatedArticles: ['webp-vs-avif-vs-jpeg', 'best-webp-quality', 'batch-convert-images'],

  meta: {
    title: 'JPG to WebP Converter — ConvertYard',
    description:
      'Convert JPG to WebP in your browser. Batch up to 1,000 files at once — no uploads, no account, no watermarks. Free forever.',
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add content/tools/jpg-to-webp.ts
git commit -m "feat: JPG to WebP ToolConfig — options, FAQ, meta"
```

---

## Task 5: Create `app/(tools)/jpg-to-webp/page.tsx`

**Files:**
- Create: `app/(tools)/jpg-to-webp/page.tsx`

- [ ] **Step 1: Check that the `(tools)` route group directory exists**

```bash
ls app/
```

If `(tools)` does not exist, create it:
```bash
mkdir -p "app/(tools)/jpg-to-webp"
```

If it exists, just create the subdirectory:
```bash
mkdir -p "app/(tools)/jpg-to-webp"
```

- [ ] **Step 2: Create `app/(tools)/jpg-to-webp/page.tsx`**

```typescript
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/jpg-to-webp'
import type { Metadata } from 'next'

export const metadata: Metadata = config.meta

export default function Page() {
  return <ToolShell config={config} />
}
```

- [ ] **Step 3: Verify TypeScript compiles and build succeeds**

```bash
npx tsc --noEmit
npm run build
```

Expected: build completes, `out/jpg-to-webp/index.html` (or similar) exists in the output directory.

If the build fails with a WASM-related error like `Module parse failed: magic header not detected`, the webpack `asyncWebAssembly` experiment in `next.config.ts` may need an additional setting. Try adding `outputModule: true` to the experiments object:
```typescript
config.experiments = {
  ...config.experiments,
  asyncWebAssembly: true,
  outputModule: true,
}
```
Re-run the build.

- [ ] **Step 4: Start dev server and verify the page loads**

```bash
npm run dev
```

Open `http://localhost:3000/jpg-to-webp` in a browser. Verify:
- Page renders with H1 "JPG to WebP Converter"
- Dropzone is visible
- Options panel shows all 7 options (quality, lossless, max dimension, auto-orient, strip metadata, sharpen, compression effort)
- FAQ accordion has 6 entries
- Related tools strip renders 4 links

- [ ] **Step 5: Commit**

```bash
git add "app/(tools)/jpg-to-webp/page.tsx"
git commit -m "feat: JPG to WebP page — wires ToolShell to config"
```

---

## Task 6: Manual quality gate testing

Run these tests in the browser at `http://localhost:3000/jpg-to-webp`. Use real JPG files from your Photos library or download test images.

- [ ] **Test 1: Single file conversion**
  - Drop 1 JPG
  - Click Convert
  - Result shows filename with `.webp` extension
  - Size savings badge shows (e.g. `1.2MB → 0.8MB −33%`)
  - Download works, file opens in an image viewer

- [ ] **Test 2: 10-file batch**
  - Drop 10 JPGs
  - Per-file progress bars appear during conversion
  - All 10 complete successfully
  - "Download all" produces a ZIP with 10 `.webp` files

- [ ] **Test 3: Invalid file (a PDF)**
  - Drop 1 PDF + 2 JPGs together
  - PDF entry shows error state with a message
  - The 2 JPGs convert successfully
  - Result shows "2 of 3 converted"

- [ ] **Test 4: Lossless mode**
  - Drop 1 JPG, enable Lossless toggle
  - Output file is larger than lossy equivalent (expected)
  - Size badge shows `+X%` in neutral colour (not red)
  - Image opens and looks identical to source

- [ ] **Test 5: Auto-orient**
  - Take a photo on a phone (portrait orientation) without editing it
  - Drop it in with Auto-orient ON
  - Downloaded WebP displays upright
  - Repeat with Auto-orient OFF — image may appear rotated (depends on viewer EXIF handling)

- [ ] **Test 6: Max dimension resize**
  - Drop a 4000px wide JPG
  - Set Max dimension to 1000
  - Output file: open in Preview/Photos and verify dimensions are ≤ 1000px on the longer edge

- [ ] **Test 7: Strip metadata**
  - Drop a phone JPG (has GPS/EXIF data)
  - Enable Strip metadata
  - After download, run: `exiftool output.webp` (install with `brew install exiftool`)
  - Expected: minimal or no EXIF fields

- [ ] **Test 8: Sharpen**
  - Drop a photo with fine detail (foliage, fabric, hair)
  - Convert once without sharpen, once with sharpen at quality 65
  - Open both — sharpened version should have crisper edges

- [ ] **Test 9: Mobile (file picker)**
  - Open `http://localhost:3000/jpg-to-webp` on your phone (same wifi)
  - Tap the dropzone — file picker opens
  - Select a photo — conversion completes
  - Download button works

- [ ] **Test 10: 100-file batch (stress)**
  - Drop 100 JPGs
  - All complete without browser crash
  - ZIP download works

---

## Task 7: Final commit and branch cleanup

- [ ] **Step 1: Verify no TypeScript errors and build is clean**

```bash
npx tsc --noEmit && npm run build
```

Expected: zero errors, build succeeds.

- [ ] **Step 2: Check git status — no unintended files staged**

```bash
git status
git diff --stat HEAD
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: JPG to WebP tool — first real tool page

- wasm-vips converter with quality, lossless, resize, auto-orient,
  strip metadata, sharpen, compression effort controls
- Full ToolConfig with 6 FAQ entries and SEO meta
- COOP/COEP headers for Cloudflare Pages (SharedArrayBuffer)
- Per-file size savings badge already handled by existing ResultList"
```

---

## Troubleshooting reference

**wasm-vips fails to load (SharedArrayBuffer error):**
The page is being served without COOP/COEP headers. In dev: confirm `next.config.ts` has the `headers()` function. In production: confirm `public/_headers` was deployed.

**`image.autorot()` throws "No such operator":**
Some wasm-vips builds don't include the autorot operation. Replace with: `image = image.rot(image.get('orientation') === 6 ? 90 : image.get('orientation') === 3 ? 180 : image.get('orientation') === 8 ? 270 : 0)`

**`image.sharpen()` parameter error:**
Try `image.sharpen({ sigma: 0.5 })` without `x1`. If still failing, skip sharpen and return the image unsharpened — it's a non-critical enhancement.

**`effort` option not recognised in writeToBuffer:**
Try `method` instead of `effort`. The option name changed between libvips versions. Test with: `image.writeToBuffer('.webp[Q=80]')` (option string form bypasses this issue entirely).

**Build error: `Module parse failed: magic header not detected`:**
The WASM binary is being treated as a JS module. Add to `next.config.ts`:
```typescript
config.module.rules.push({
  test: /\.wasm$/,
  type: 'asset/resource',
})
```
