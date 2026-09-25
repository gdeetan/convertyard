# Compress-PDF Exotic-Image Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Standard preset compression (`Low`/`Medium`/`High`) actually compress scanner-produced PDFs whose image XObjects use `/JBIG2Decode` or `/JPXDecode` (today they silently no-op, saving only ~2%).

**Architecture:** Add a pre-flight router at the top of `compressPDF`'s non-aggressive branch that classifies each PDF as (a) ordinary → current path, (b) exotic-heavy pure scan → reuse Aggressive's rasterize path, or (c) exotic-heavy hybrid (has real text layer) → surgical per-image decode via new `extractImagePixmap` mupdf-worker export + re-encode as JPEG. Mobile always routes exotic-heavy → rasterize.

**Tech Stack:** TypeScript, pdf-lib, mupdf-wasm (via existing `mupdf.worker.ts`), Vitest, mozjpeg encoder (existing helper).

**Spec:** `docs/superpowers/specs/2026-09-25-compress-pdf-exotic-image-fallback-design.md`

---

## File map

- **Modify:** `lib/converters/mupdf.worker.ts` — add `extract-image-pixmap` message type
- **Modify:** `lib/converters/mupdf-client.ts` — add `extractImagePixmap` client wrapper
- **Modify:** `lib/converters/pdf.ts` — add `preflightClassify`, extend `planImageRecompress` + `executeImageRecompress`, add router in `compressPDF` non-aggressive branch
- **Create:** `lib/converters/__tests__/compress-pdf-exotic-preflight.test.ts` — unit tests for `preflightClassify`
- **Create:** `lib/converters/__tests__/compress-pdf-exotic-integration.test.ts` — end-to-end `compressPDF` tests over 4 fixtures
- **Create:** `lib/converters/__tests__/fixtures/pdf/exotic-pure-scan.pdf` — JBIG2+JPX pure scan (copy of `bwb_KR-223-812.pdf`, trimmed to ~10 pages for test speed)
- **Create:** `lib/converters/__tests__/fixtures/pdf/exotic-hybrid.pdf` — JBIG2 scan with real OCR text layer
- **Reuse existing fixtures:** `text-with-jpeg.pdf`, `text-only.pdf` (locate in `lib/converters/__tests__/fixtures/`; if not present, create tiny synthetic ones)

---

## Task 1: Add `extractImagePixmap` to mupdf worker

**Files:**
- Modify: `lib/converters/mupdf.worker.ts:33-48` (message-type union) and add handler
- Modify: `lib/converters/mupdf-client.ts` (add client wrapper)
- Test: `lib/converters/__tests__/compress-pdf-exotic-preflight.test.ts` (setup only — no worker test in unit; smoke-tested via Task 2 integration)

- [ ] **Step 1: Add message type + handler in worker**

In `lib/converters/mupdf.worker.ts`, extend the `type` union (line 36) to include `'extract-image-pixmap'`, and add `objectNum?: number` + `generation?: number` to the destructured payload (lines 34-48).

Then add a handler block after the existing `save-compressed` handler:

```ts
if (type === 'extract-image-pixmap') {
  if (typeof objectNum !== 'number') throw new Error('extract-image-pixmap requires objectNum')
  const { doc, owned } = getDoc()
  try {
    const ref = mupdf.PDFObject.newIndirect(doc, objectNum, generation ?? 0)
    // Resolve as Image XObject. mupdf throws if the ref isn't an image stream.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const image: any = doc.loadImage(ref)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pixmap: any = image.toPixmap()
    const width = pixmap.getWidth()
    const height = pixmap.getHeight()
    const cs = pixmap.getColorSpace()
    const csName: string = cs?.getName?.() ?? 'Unknown'
    let colorspace: 'Gray' | 'RGB' | 'CMYK' | 'Bilevel'
    if (csName === 'DeviceGray' || csName === 'Gray') colorspace = 'Gray'
    else if (csName === 'DeviceRGB' || csName === 'RGB') colorspace = 'RGB'
    else if (csName === 'DeviceCMYK' || csName === 'CMYK') colorspace = 'CMYK'
    else colorspace = 'RGB'
    // Bilevel detection: mupdf reports 1-bit images with a Gray CS; check
    // bits-per-component on the original image object.
    const bpc = image.getBitsPerComponent?.() ?? 8
    if (bpc === 1) colorspace = 'Bilevel'
    const bytes = new Uint8Array(pixmap.getPixels())
    // Transfer bytes; mupdf's pixmap buffer is a copy already.
    self.postMessage({ id, type: 'extract-image-pixmap', width, height, colorspace, bytes }, [bytes.buffer])
    pixmap.destroy?.()
    image.destroy?.()
  } finally {
    if (owned) doc.destroy?.()
  }
  return
}
```

- [ ] **Step 2: Add client wrapper**

In `lib/converters/mupdf-client.ts`, after `saveCompressed`, add:

```ts
export interface ExtractedPixmap {
  width: number
  height: number
  colorspace: 'Gray' | 'RGB' | 'CMYK' | 'Bilevel'
  bytes: Uint8Array
}

export async function extractImagePixmap(
  source: PdfSource,
  objectNum: number,
  generation = 0
): Promise<ExtractedPixmap | null> {
  try {
    const req: Record<string, unknown> = { type: 'extract-image-pixmap', objectNum, generation }
    if (typeof source === 'object' && 'docId' in source) req.docId = source.docId
    else req.fileBuffer = source
    const res = await callWorker(req) as ExtractedPixmap
    if (res.colorspace === 'Bilevel') return null
    return res
  } catch {
    return null
  }
}
```

(Follow the exact `callWorker` invocation pattern used by `saveCompressed` in the same file. Substitute the helper name if it's different in current code — read the file first to confirm.)

- [ ] **Step 3: Type-check + commit**

Run: `npm run build` (or `npx tsc --noEmit` if faster). Expected: no new errors.

```bash
git add lib/converters/mupdf.worker.ts lib/converters/mupdf-client.ts
git commit -m "feat(compress-pdf): mupdf worker extract-image-pixmap"
```

---

## Task 2: Prepare test fixtures

**Files:**
- Create: `lib/converters/__tests__/fixtures/pdf/exotic-pure-scan.pdf`
- Create: `lib/converters/__tests__/fixtures/pdf/exotic-hybrid.pdf`
- Create: `lib/converters/__tests__/fixtures/pdf/text-with-jpeg.pdf` (only if not already present)
- Create: `lib/converters/__tests__/fixtures/pdf/text-only.pdf` (only if not already present)

- [ ] **Step 1: Trim the real scan for a small fixture**

The reference file `/Users/garrickdeetan/Downloads/PDF Files/bwb_KR-223-812.pdf` is 228 pages. Extract the first 8 pages for a fast test fixture:

```bash
mkdir -p lib/converters/__tests__/fixtures/pdf
# Use mupdf CLI (or qpdf if installed) — pick whichever is available:
mutool clean -g '/Users/garrickdeetan/Downloads/PDF Files/bwb_KR-223-812.pdf' \
  lib/converters/__tests__/fixtures/pdf/exotic-pure-scan.pdf 1-8
```

If neither `mutool` nor `qpdf` is available, use pdf-lib in a scratch node script to copy pages 1-8 into a new document, preserving the original image XObject encodings.

Verify with the existing inspection script:
```bash
node scripts/inspect-pdf-images.mjs lib/converters/__tests__/fixtures/pdf/exotic-pure-scan.pdf
```
Expected: `/JBIG2Decode` + `/JPXDecode` filters, images at ~370-400 DPI.

- [ ] **Step 2: Create the hybrid fixture**

Take the pure-scan fixture and add an OCR text layer using mupdf's `mutool ocr` or Adobe/ocrmypdf if available. If none of those are available on the executing machine, create a minimal synthetic hybrid: a 2-page PDF with one JBIG2 image XObject and a text-showing operator (`Tj`) on each page. Use pdf-lib for the wrapping and hand-craft the JBIG2 payload by lifting one XObject from the pure scan.

Verify: `extractText` returns > 40 chars per page.

- [ ] **Step 3: Create/locate the ordinary fixtures**

Check `lib/converters/__tests__/fixtures/` for existing text-only + text-with-jpeg PDFs (look at what `pdf-keep-text.test.ts`, `compress-pdf-target.test.ts` already use). If they exist, note their paths for later tasks. If not, generate 2-page synthetic fixtures via pdf-lib.

- [ ] **Step 4: Commit**

```bash
git add lib/converters/__tests__/fixtures/pdf/
git commit -m "test(compress-pdf): fixtures for exotic-image classifier"
```

---

## Task 3: Implement `preflightClassify`

**Files:**
- Modify: `lib/converters/pdf.ts` (add function near top of file, above `planImageRecompress` around line 380)
- Test: `lib/converters/__tests__/compress-pdf-exotic-preflight.test.ts` (create)

- [ ] **Step 1: Write failing test**

Create `lib/converters/__tests__/compress-pdf-exotic-preflight.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { preflightClassify } from '../pdf'

const FIXTURES = 'lib/converters/__tests__/fixtures/pdf'

async function loadBuffer(name: string) {
  const bytes = readFileSync(`${FIXTURES}/${name}`)
  return { buf: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), size: bytes.byteLength }
}

describe('preflightClassify', () => {
  it('flags pure JBIG2+JPX scan as exoticHeavy with no text layer', async () => {
    const { buf, size } = await loadBuffer('exotic-pure-scan.pdf')
    const res = await preflightClassify(buf, size)
    expect(res.exoticHeavy).toBe(true)
    expect(res.hasTextLayer).toBe(false)
  })

  it('flags hybrid OCR scan as exoticHeavy AND hasTextLayer', async () => {
    const { buf, size } = await loadBuffer('exotic-hybrid.pdf')
    const res = await preflightClassify(buf, size)
    expect(res.exoticHeavy).toBe(true)
    expect(res.hasTextLayer).toBe(true)
  })

  it('text PDF with JPEGs is not exoticHeavy', async () => {
    const { buf, size } = await loadBuffer('text-with-jpeg.pdf')
    const res = await preflightClassify(buf, size)
    expect(res.exoticHeavy).toBe(false)
    expect(res.hasTextLayer).toBe(true)
  })

  it('text-only PDF is not exoticHeavy', async () => {
    const { buf, size } = await loadBuffer('text-only.pdf')
    const res = await preflightClassify(buf, size)
    expect(res.exoticHeavy).toBe(false)
    expect(res.hasTextLayer).toBe(true)
  })

  it('returns defaults on corrupt input', async () => {
    const junk = new Uint8Array([1, 2, 3, 4]).buffer
    const res = await preflightClassify(junk, 4)
    expect(res.exoticHeavy).toBe(false)
    expect(res.hasTextLayer).toBe(false)
    expect(res.xobjectList).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/converters/__tests__/compress-pdf-exotic-preflight.test.ts`
Expected: FAIL — `preflightClassify` is not exported.

- [ ] **Step 3: Implement `preflightClassify`**

In `lib/converters/pdf.ts`, near the top (above `planImageRecompress`), add:

```ts
export interface XObjectEntry {
  ref: import('pdf-lib').PDFRef
  filter: string          // e.g. '/DCTDecode', '/JBIG2Decode', '[/FlateDecode /DCTDecode]'
  streamLen: number
  width: number | null
  height: number | null
}

export interface PreflightResult {
  exoticHeavy: boolean
  hasTextLayer: boolean
  xobjectList: XObjectEntry[]
}

export async function preflightClassify(
  buffer: ArrayBuffer,
  fileSize: number
): Promise<PreflightResult> {
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const xobjectList: XObjectEntry[] = []
    let totalImageBytes = 0
    let exoticImageBytes = 0

    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
      if (!(obj instanceof PDFRawStream)) continue
      const dict = obj.dict
      if (dict.get(PDFName.of('Subtype'))?.toString() !== '/Image') continue

      const filterVal = dict.get(PDFName.of('Filter'))
      let filterStr: string
      if (filterVal instanceof PDFArray) {
        filterStr = '[' + filterVal.asArray().map((x) => x.toString()).join(' ') + ']'
      } else {
        filterStr = filterVal?.toString() ?? '(none)'
      }

      const streamLen = obj.contents.byteLength
      const widthVal = dict.get(PDFName.of('Width'))
      const heightVal = dict.get(PDFName.of('Height'))
      const width = widthVal ? Number(widthVal.toString()) : null
      const height = heightVal ? Number(heightVal.toString()) : null

      xobjectList.push({ ref, filter: filterStr, streamLen, width, height })
      totalImageBytes += streamLen
      if (filterStr.includes('JBIG2Decode') || filterStr.includes('JPXDecode')) {
        exoticImageBytes += streamLen
      }
    }

    const EXOTIC_RATIO = 0.5
    const IMAGE_OF_FILE_RATIO = 0.5
    const exoticHeavy =
      totalImageBytes > 0 &&
      exoticImageBytes / totalImageBytes > EXOTIC_RATIO &&
      totalImageBytes / fileSize > IMAGE_OF_FILE_RATIO

    let hasTextLayer = false
    try {
      const { extractText } = await import('./mupdf-client')
      const pages = await extractText(buffer)
      if (pages.length > 0) {
        const totalChars = pages.reduce((sum, p) => sum + p.length, 0)
        const CHARS_PER_PAGE_THRESHOLD = 20
        hasTextLayer = totalChars / pages.length > CHARS_PER_PAGE_THRESHOLD
      }
    } catch {
      hasTextLayer = false
    }

    return { exoticHeavy, hasTextLayer, xobjectList }
  } catch {
    return { exoticHeavy: false, hasTextLayer: false, xobjectList: [] }
  }
}
```

Ensure `PDFArray` is in the existing pdf-lib import at the top of `pdf.ts` (add it if missing).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/converters/__tests__/compress-pdf-exotic-preflight.test.ts`
Expected: PASS (all 5 cases).

- [ ] **Step 5: Commit**

```bash
git add lib/converters/pdf.ts lib/converters/__tests__/compress-pdf-exotic-preflight.test.ts
git commit -m "feat(compress-pdf): preflightClassify for exotic-heavy detection"
```

---

## Task 4: Extend `planImageRecompress` with `exotic` branch

**Files:**
- Modify: `lib/converters/pdf.ts:385-521` (`planImageRecompress` body)

- [ ] **Step 1: Read the current `planImageRecompress` implementation end-to-end**

Read lines 385-521 of `lib/converters/pdf.ts`. Understand the shape of the returned plan items (the discriminated union of `kind: 'jpeg'` and `kind: 'flate'`).

- [ ] **Step 2: Extend the plan item union**

In `pdf.ts`, add a new plan item variant near the existing item type definitions (around line 340-380). Preserve the field naming conventions of the existing variants:

```ts
type ExoticPlanItem = {
  kind: 'exotic'
  ref: PDFRef
  obj: PDFRawStream
  originalFilter: string       // '/JBIG2Decode' or '/JPXDecode'
  width: number
  height: number
}
```

Add `ExoticPlanItem` to the plan-item union type used by `planImageRecompress`.

- [ ] **Step 3: Add the filter-detection branch**

Inside the existing filter dispatch in `planImageRecompress` (the block that checks `filterStr === '/DCTDecode'`, `filterStr === '/FlateDecode'`, etc.), add:

```ts
if (filterStr === '/JBIG2Decode' || filterStr === '/JPXDecode') {
  const widthVal = dict.get(PDFName.of('Width'))
  const heightVal = dict.get(PDFName.of('Height'))
  const width = widthVal ? Number(widthVal.toString()) : 0
  const height = heightVal ? Number(heightVal.toString()) : 0
  if (width > 0 && height > 0) {
    items.push({ kind: 'exotic', ref, obj, originalFilter: filterStr, width, height })
  }
  continue
}
```

Place this branch after the existing `/DCTDecode` chain handling and before the `/FlateDecode` branch, so plain `/FlateDecode` still lands in its own handler.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. The exhaustiveness of any `switch (item.kind)` elsewhere will surface here — leave those spots failing until Task 5 handles them.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/pdf.ts
git commit -m "feat(compress-pdf): planImageRecompress recognizes JBIG2+JPX"
```

---

## Task 5: Extend `executeImageRecompress` with exotic decode branch

**Files:**
- Modify: `lib/converters/pdf.ts:522-670` (`executeImageRecompress` body)

- [ ] **Step 1: Read the current `executeImageRecompress` implementation**

Read lines 522-670 in `lib/converters/pdf.ts`. Understand the JPEG encoding helper it uses, how it rewrites `Filter` on the dict, and how it decides to skip an item.

- [ ] **Step 2: Write failing integration test scaffold**

Create `lib/converters/__tests__/compress-pdf-exotic-integration.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { compressPDF } from '../pdf'

const FIXTURES = 'lib/converters/__tests__/fixtures/pdf'

function loadFile(name: string): File {
  const bytes = readFileSync(`${FIXTURES}/${name}`)
  return new File([bytes], name, { type: 'application/pdf' })
}

describe('compressPDF exotic-image routing', () => {
  it('pure JBIG2+JPX scan gets substantial reduction at High preset', async () => {
    const file = loadFile('exotic-pure-scan.pdf')
    const originalSize = file.size
    const [result] = await compressPDF([file], { level: 'high' })
    if (result instanceof Error) throw result
    const reductionRatio = 1 - result.size / originalSize
    expect(reductionRatio).toBeGreaterThan(0.5) // ≥50% reduction expected
  }, 60_000)

  it('hybrid OCR scan gets substantial reduction at High preset', async () => {
    const file = loadFile('exotic-hybrid.pdf')
    const originalSize = file.size
    const [result] = await compressPDF([file], { level: 'high' })
    if (result instanceof Error) throw result
    const reductionRatio = 1 - result.size / originalSize
    expect(reductionRatio).toBeGreaterThan(0.3) // ≥30% reduction expected
  }, 60_000)

  it('ordinary text+JPEG PDF is not regressed at High preset', async () => {
    const file = loadFile('text-with-jpeg.pdf')
    const originalSize = file.size
    const [result] = await compressPDF([file], { level: 'high' })
    if (result instanceof Error) throw result
    // Ordinary PDFs should not grow. Small regressions (< 1%) are noise from
    // structural repacking; anything larger is a real regression.
    expect(result.size).toBeLessThanOrEqual(originalSize)
  }, 30_000)

  it('text-only PDF returns unchanged (or smaller) at High preset', async () => {
    const file = loadFile('text-only.pdf')
    const originalSize = file.size
    const [result] = await compressPDF([file], { level: 'high' })
    if (result instanceof Error) throw result
    expect(result.size).toBeLessThanOrEqual(originalSize)
  }, 20_000)
})
```

Run: `npx vitest run lib/converters/__tests__/compress-pdf-exotic-integration.test.ts`
Expected: pure-scan case FAILS (still ~2% reduction because router + executor not wired yet); other cases may PASS (they should already be handled by the existing path).

- [ ] **Step 3: Implement exotic branch in `executeImageRecompress`**

Inside `executeImageRecompress`, add a handler alongside the existing `kind` branches:

```ts
if (item.kind === 'exotic') {
  try {
    const { extractImagePixmap } = await import('./mupdf-client')
    // Source: whichever doc source the caller passed in. The existing callers
    // pass either an ArrayBuffer or a { docId } handle — reuse the same
    // `source` reference that other branches use in this function.
    const pixmap = await extractImagePixmap(source, item.ref.objectNumber, item.ref.generationNumber)
    if (!pixmap) return null   // bilevel / decode failure — leave stream intact

    // Compute target pixel dimensions from bbox render map + preset targetDpi.
    // `renderMapKey` mirrors the key format used by the existing DPI-cap logic
    // for other kinds — check the current implementation for the exact format.
    const renderMapKey = `${item.ref.objectNumber} ${item.ref.generationNumber}`
    const renderedInches = opts.imageRenderMap?.[renderMapKey]
    const targetDpi = opts.targetDpi ?? 150
    let targetW = pixmap.width
    let targetH = pixmap.height
    if (renderedInches && renderedInches > 0) {
      const cappedPixels = Math.round(renderedInches * targetDpi)
      if (cappedPixels < targetW) {
        const scale = cappedPixels / targetW
        targetW = cappedPixels
        targetH = Math.max(1, Math.round(pixmap.height * scale))
      }
    }

    // Downsample if needed. Bilinear for RGB/Gray/CMYK; nearest-neighbor for
    // large ratios (>4x) as a speed optimization.
    const downsampled = targetW < pixmap.width
      ? await downsampleRawPixmap(pixmap, targetW, targetH)
      : pixmap

    // Re-encode as JPEG using the same helper other branches use in this
    // function. Substitute the exact import path from the current file.
    const jpegBytes = await encodePixmapToJpeg(downsampled, quality)

    // Rewrite XObject: replace Filter with /DCTDecode, drop any decode params,
    // replace stream contents.
    const newDict = item.obj.dict.clone()
    newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'))
    newDict.delete(PDFName.of('DecodeParms'))
    newDict.delete(PDFName.of('BitsPerComponent'))  // JPEG is always 8bpc
    newDict.set(PDFName.of('Width'), PDFNumber.of(downsampled.width))
    newDict.set(PDFName.of('Height'), PDFNumber.of(downsampled.height))
    newDict.set(PDFName.of('ColorSpace'),
      downsampled.colorspace === 'Gray' ? PDFName.of('DeviceGray')
        : downsampled.colorspace === 'CMYK' ? PDFName.of('DeviceCMYK')
        : PDFName.of('DeviceRGB'))
    newDict.set(PDFName.of('Length'), PDFNumber.of(jpegBytes.length))

    return { ref: item.ref, newDict, newContents: jpegBytes }
  } catch {
    return null
  }
}
```

Add two small helpers at the bottom of `pdf.ts` if they don't already exist:

```ts
async function downsampleRawPixmap(
  src: { width: number; height: number; colorspace: 'Gray' | 'RGB' | 'CMYK'; bytes: Uint8Array },
  targetW: number,
  targetH: number
): Promise<{ width: number; height: number; colorspace: 'Gray' | 'RGB' | 'CMYK'; bytes: Uint8Array }> {
  const channels = src.colorspace === 'Gray' ? 1 : src.colorspace === 'CMYK' ? 4 : 3
  const out = new Uint8Array(targetW * targetH * channels)
  // Simple box-filter downsample. Good enough for compression; not for display.
  const xRatio = src.width / targetW
  const yRatio = src.height / targetH
  for (let y = 0; y < targetH; y++) {
    const srcY = Math.floor(y * yRatio)
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.floor(x * xRatio)
      const srcOff = (srcY * src.width + srcX) * channels
      const dstOff = (y * targetW + x) * channels
      for (let c = 0; c < channels; c++) out[dstOff + c] = src.bytes[srcOff + c]
    }
  }
  return { width: targetW, height: targetH, colorspace: src.colorspace, bytes: out }
}

async function encodePixmapToJpeg(
  src: { width: number; height: number; colorspace: 'Gray' | 'RGB' | 'CMYK'; bytes: Uint8Array },
  quality: number
): Promise<Uint8Array> {
  // Reuse whichever JPEG encoder the existing rasterize path uses. Look in
  // this file (search for `mozjpeg` or `encodeJpeg`) and call the same helper.
  // If it takes an RGBA buffer, expand src.bytes accordingly (Gray→RGBA with
  // opaque alpha, RGB→RGBA with opaque alpha). CMYK falls back to converting
  // to RGB first — mozjpeg-wasm doesn't accept CMYK input.
  throw new Error('TODO: wire to existing mozjpeg helper — see rasterizeForTarget for reference call site')
}
```

The `TODO` in `encodePixmapToJpeg` must be resolved as part of this step by locating the encoder used elsewhere in `pdf.ts` (search for `mozjpeg`, `encodeJpeg`, `.encode(`). Replace the throw with the real call.

- [ ] **Step 4: Run failing integration test again**

Run: `npx vitest run lib/converters/__tests__/compress-pdf-exotic-integration.test.ts`
Expected: hybrid case now approaches passing (may still fail if the router isn't wired — Task 6). Pure-scan case still fails until router.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/pdf.ts
git commit -m "feat(compress-pdf): executeImageRecompress decodes JBIG2+JPX"
```

---

## Task 6: Wire the pre-flight router in `compressPDF`

**Files:**
- Modify: `lib/converters/pdf.ts:1720-1803` (`compressPDF` non-aggressive branch)

- [ ] **Step 1: Locate the `isMobile()` helper**

Search `lib/converters/pdf.ts` for `isMobile`. It's already used in the preset image pass. Confirm its import path and reuse.

- [ ] **Step 2: Insert the router at the top of the non-aggressive branch**

Just inside the `} else {` at line 1720 (start of non-aggressive branch), add:

```ts
onProgress?.(i, 5)
const buffer = await files[i].arrayBuffer()
const preflight = await preflightClassify(buffer, files[i].size)

// LANE B: exotic-heavy scan without a text layer, OR any exotic-heavy on
// mobile → rasterize via the Aggressive path. Preserves any preset
// grayscale + strip options.
if (preflight.exoticHeavy && (!preflight.hasTextLayer || isMobile())) {
  onProgress?.(i, 15)
  let rasterized = grayscale
    ? await rasterizeGrayscaleForTarget(buffer, files[i].name, targetDpi, jpegQuality)
    : await rasterizeForTarget(buffer, files[i].name, targetDpi, jpegQuality)
  onProgress?.(i, 85)
  try {
    const rBuf = await rasterized.arrayBuffer()
    const { saveCompressed } = await import('./mupdf-client')
    const compressed = await saveCompressed(rBuf)
    if (compressed.byteLength > 0 && compressed.byteLength < rasterized.size) {
      rasterized = new File(
        [new Uint8Array(compressed) as unknown as Uint8Array<ArrayBuffer>],
        files[i].name,
        { type: 'application/pdf' }
      )
    }
  } catch { /* best-effort */ }
  onProgress?.(i, 100)
  results[i] = rasterized.size < files[i].size ? rasterized : files[i]
  continue
}

// LANE A and LANE C both fall through to the existing structural + image
// pass below. LANE C is triggered implicitly because `planImageRecompress`
// (extended in Task 4) now emits `exotic` items, and `executeImageRecompress`
// (extended in Task 5) decodes them.
```

Then delete the existing `const buffer = await files[i].arrayBuffer()` at the top of what is now LANE A (a few lines below) to avoid double-reading — the router already read it.

- [ ] **Step 3: Run the integration tests**

Run: `npx vitest run lib/converters/__tests__/compress-pdf-exotic-integration.test.ts`
Expected: all 4 cases PASS.

- [ ] **Step 4: Run the full compress-pdf suite for regressions**

Run: `npx vitest run lib/converters/__tests__/compress-pdf-target.test.ts lib/converters/__tests__/pdf-keep-text.test.ts lib/converters/__tests__/pdf-tier3.test.ts`
Expected: all PASS. Any failure here is a regression on unchanged behavior — investigate before proceeding.

- [ ] **Step 5: Commit**

```bash
git add lib/converters/pdf.ts lib/converters/__tests__/compress-pdf-exotic-integration.test.ts
git commit -m "feat(compress-pdf): preflight router for exotic-image PDFs"
```

---

## Task 7: Mobile-gate verification

**Files:**
- Test: `lib/converters/__tests__/compress-pdf-exotic-integration.test.ts` (extend)

- [ ] **Step 1: Add a mobile-gate integration test**

Append to the integration test file:

```ts
import * as pdfMod from '../pdf'

describe('compressPDF exotic routing on mobile', () => {
  it('routes exotic-heavy hybrid to LANE B on mobile (no LANE C)', async () => {
    // Force isMobile() true via module-level spy.
    const spy = vi.spyOn(pdfMod as unknown as { isMobile: () => boolean }, 'isMobile')
      .mockReturnValue(true)
    try {
      const file = loadFile('exotic-hybrid.pdf')
      const [result] = await compressPDF([file], { level: 'high' })
      if (result instanceof Error) throw result
      // We can't inspect which lane ran directly, but LANE B rasterizes —
      // the output has zero JBIG2 XObjects. Load result with pdf-lib and
      // count.
      const { PDFDocument, PDFRawStream, PDFName } = await import('pdf-lib')
      const doc = await PDFDocument.load(await result.arrayBuffer())
      let jbig2Count = 0
      for (const [, obj] of doc.context.enumerateIndirectObjects()) {
        if (!(obj instanceof PDFRawStream)) continue
        if (obj.dict.get(PDFName.of('Subtype'))?.toString() !== '/Image') continue
        const filter = obj.dict.get(PDFName.of('Filter'))?.toString() ?? ''
        if (filter.includes('JBIG2Decode')) jbig2Count++
      }
      expect(jbig2Count).toBe(0)
    } finally {
      spy.mockRestore()
    }
  }, 60_000)
})
```

Requires `isMobile` to be exported from `pdf.ts` or moved to a shared util. If it's currently a private helper, either export it or import from wherever it already lives. Prefer the latter — search the codebase for `export function isMobile`.

- [ ] **Step 2: Run the test**

Run: `npx vitest run lib/converters/__tests__/compress-pdf-exotic-integration.test.ts`
Expected: mobile-gate case PASSES.

- [ ] **Step 3: Commit**

```bash
git add lib/converters/__tests__/compress-pdf-exotic-integration.test.ts
git commit -m "test(compress-pdf): verify mobile gate forces LANE B"
```

---

## Task 8: Manual desktop verification + final polish

**Files:** none new; docs update.

- [ ] **Step 1: Run the real file locally**

Start the dev server: `npm run dev`. Open `http://localhost:3000/compress-pdf` in a desktop browser. Upload `/Users/garrickdeetan/Downloads/PDF Files/bwb_KR-223-812.pdf`. Select Standard tab → High preset. Click Compress.

Expected:
- Completes in under 90 seconds on a modern laptop.
- Output size < 4 MB (≥60% reduction from 9.69 MB).
- Downloaded file opens correctly in Preview/Acrobat; pages are readable.

Record the actual wall time and output size for the PR description.

- [ ] **Step 2: Run the same file at Medium and Low presets**

Verify both also produce meaningful reductions (Medium: 140 DPI / Q62, Low: 200 DPI / Q78). Both should route to LANE B (pure scan).

- [ ] **Step 3: Regression sweep**

Try three non-scan PDFs from your local library (text-only report, PDF with charts, PDF with a few figures). Each should compress to within 1% of what it did before this change — the router should route all three to LANE A (`!exoticHeavy`).

- [ ] **Step 4: Final commit + PR**

```bash
git log --oneline main..HEAD    # sanity check the commit sequence
git push -u origin HEAD
gh pr create --title "feat(compress-pdf): exotic-image fallback for preset mode" --body "$(cat <<'EOF'
## Summary
- Pre-flight router in Standard preset (`Low`/`Medium`/`High`) classifies PDFs by image XObject filter mix and text-layer presence.
- Exotic-heavy pure scans (JBIG2+JPX with no text layer) → rasterize via existing Aggressive path.
- Exotic-heavy hybrid PDFs (JBIG2+JPX with real text layer) → surgical per-image decode via new `extractImagePixmap` mupdf-worker export → re-encode as JPEG at preset DPI/quality.
- Mobile always routes exotic-heavy → rasterize (no LANE C on iOS Safari).
- Aggressive preset and target-size mode unchanged.

Fixes silent ~2% no-op on scanner-produced MRC PDFs. Reference file `bwb_KR-223-812.pdf` (9.69 MB) now compresses to <4 MB at High.

## Test plan
- [ ] `npx vitest run lib/converters/__tests__/compress-pdf-exotic-preflight.test.ts`
- [ ] `npx vitest run lib/converters/__tests__/compress-pdf-exotic-integration.test.ts`
- [ ] `npx vitest run lib/converters/__tests__/compress-pdf-target.test.ts lib/converters/__tests__/pdf-keep-text.test.ts lib/converters/__tests__/pdf-tier3.test.ts` (regression)
- [ ] Manual: real 228-page scan at High/Medium/Low presets
- [ ] Manual: 3 ordinary PDFs at High preset — verify no size regression

Spec: `docs/superpowers/specs/2026-09-25-compress-pdf-exotic-image-fallback-design.md`
EOF
)"
```

---

## Self-Review (already applied inline)

- **Spec coverage:** All 5 spec components have tasks. Preflight → Task 3. Worker export → Task 1. Extended planner/executor → Tasks 4-5. Router → Task 6. Mobile gate → Task 7. Testing → Tasks 3, 5, 7. Manual verification → Task 8.
- **Placeholders:** One deliberate placeholder in Task 5 Step 3 (`encodePixmapToJpeg` `TODO`) is called out as a required-to-resolve step for the executing engineer, with concrete search terms — this is a lookup, not vague guidance. If treated as unacceptable by the executor, the fix is to grep `pdf.ts` for the existing mozjpeg helper first and reference it by exact name here.
- **Type consistency:** `XObjectEntry` and `ExoticPlanItem` share `ref` (PDFRef) and `filter`/`originalFilter` (string). `ExtractedPixmap` return type matches what `executeImageRecompress` destructures. `preflightClassify` return type matches usage in Task 6 router. `isMobile()` reused per Task 7 note.
- **Scope:** Single subsystem (compress-pdf preset path). No decomposition needed.
