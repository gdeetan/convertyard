import { PDFDocument, PDFRawStream, PDFRef, PDFName, PDFNumber, PDFArray, PDFDict, degrees, rgb, StandardFonts, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib'
import { zipSync, inflateSync } from 'fflate'
import { getPageCount, renderPage, renderPagePng, extractText, extractStructuredText, openPdf, closePdf, type PdfSource } from './mupdf-client'
import { isSafari, isIos } from '@/lib/utils/platform'
import { formatBytes } from '@/lib/utils/download'
import type { ConversionResult, ToolOptions, CompressionMeta } from '@/lib/types'
import { convertPdfToWord } from './pdf-to-word'
import { recognizePage, terminateOcrWorker } from '@/lib/ocr/tesseract-client'
import { downsampleFlateImage } from '@/lib/pdf/image-downsample'
import { computeEffectiveDpi } from '../pdf/effective-dpi'
import { isMobile } from '@/lib/utils/is-mobile'

// P1 efficiency features. Flip individually to false if triage requires it.
const P1_FEATURES = {
  perImageDpi: true,
  mupdfSaveCompressed: true,
  dedupeImageXObjects: true,
  flateLevel9: true,
  // Route JPEG re-encode through a Web Worker pool. Falls back to main-thread
  // reencodeJpeg when workers/OffscreenCanvas are unavailable.
  jpegWorkerPool: true,
} as const

// ── Merge ─────────────────────────────────────────────────────────────────────

export interface MergeSource {
  file: File
  pageIndices: number[]  // 0-based, in the order to include them
}

export async function mergePDFs(
  sources: MergeSource[],
  _options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const activeSources = sources.filter(s => s.pageIndices.length > 0)
  if (activeSources.length === 0) return []

  const merged = await PDFDocument.create()

  for (let i = 0; i < activeSources.length; i++) {
    onProgress?.(0, Math.round((i / activeSources.length) * 80))
    const buffer = await activeSources[i].file.arrayBuffer()
    const srcDoc = await PDFDocument.load(buffer)
    const copied = await merged.copyPages(srcDoc, activeSources[i].pageIndices)
    for (const page of copied) merged.addPage(page)
  }

  onProgress?.(0, 90)
  const bytes = await merged.save({ useObjectStreams: true })
  onProgress?.(0, 100)

  const baseName = activeSources[0].file.name.replace(/\.[^.]+$/, '')
  const outName = activeSources.length === 1
    ? activeSources[0].file.name
    : `${baseName}-merged.pdf`
  return [new File([new Uint8Array(bytes)], outName, { type: 'application/pdf' })]
}

// ── Compress helpers ──────────────────────────────────────────────────────────

async function compressStructural(
  buffer: ArrayBuffer,
  level: 'low' | 'medium' | 'high',
  fileName: string,
  advanced?: {
    stripMetadata?: boolean
    stripAnnotations?: boolean
    stripBookmarks?: boolean
    stripEmbedded?: boolean
    stripJS?: boolean
    // NEW:
    removeUnusedFonts?: boolean
    stripFormFields?: boolean
    formFieldStrategy?: 'flatten' | 'remove'
    linearize?: boolean        // accepted but no-op for now
    stripPrivateAppData?: boolean
  }
): Promise<File> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  if (advanced?.stripMetadata !== false) {
    doc.setTitle('')
    doc.setAuthor('')
    doc.setSubject('')
    doc.setKeywords([])
    doc.setProducer('')
    doc.setCreator('')
    void level
  }

  if (advanced?.stripBookmarks) {
    doc.catalog.delete(PDFName.of('Outlines'))
  }

  if (advanced?.stripJS) {
    doc.catalog.delete(PDFName.of('AA'))
    doc.catalog.delete(PDFName.of('OpenAction'))
    const names = doc.catalog.lookup(PDFName.of('Names'))
    if (names instanceof PDFDict) {
      names.delete(PDFName.of('JavaScript'))
    }
  }

  if (advanced?.stripAnnotations) {
    for (const page of doc.getPages()) {
      page.node.delete(PDFName.of('Annots'))
    }
  }

  if (advanced?.stripEmbedded) {
    const names = doc.catalog.lookup(PDFName.of('Names'))
    if (names instanceof PDFDict) {
      names.delete(PDFName.of('EmbeddedFiles'))
    }
  }

  if (advanced?.removeUnusedFonts) {
    for (const page of doc.getPages()) {
      const resources = page.node.lookup(PDFName.of('Resources'))
      if (!(resources instanceof PDFDict)) continue
      const fontDict = resources.lookup(PDFName.of('Font'))
      if (!(fontDict instanceof PDFDict)) continue
      const toDelete: PDFName[] = []
      for (const [key] of fontDict.entries()) {
        const fontRef = fontDict.get(key)
        if (!fontRef) continue
        const font = doc.context.lookupMaybe(fontRef, PDFDict)
        if (!font) continue
        const baseFont = font.get(PDFName.of('BaseFont'))?.toString().replace('/', '') ?? ''
        // Remove non-subsetted fonts (no 6-uppercase-char prefix); subsetted fonts are kept
        if (baseFont && !/^[A-Z]{6}\+/.test(baseFont)) toDelete.push(key)
      }
      for (const key of toDelete) fontDict.delete(key)
    }
  }

  if (advanced?.stripFormFields) {
    const strategy = advanced.formFieldStrategy ?? 'flatten'
    const acroForm = doc.catalog.lookup(PDFName.of('AcroForm'))
    if (acroForm instanceof PDFDict) {
      if (strategy === 'remove') {
        doc.catalog.delete(PDFName.of('AcroForm'))
        for (const page of doc.getPages()) {
          page.node.delete(PDFName.of('Annots'))
        }
      } else {
        try {
          const form = doc.getForm()
          form.flatten()
        } catch { /* ignore if no form or already flat */ }
      }
    }
  }

  if (advanced?.stripPrivateAppData) {
    doc.catalog.delete(PDFName.of('PieceInfo'))
    for (const page of doc.getPages()) {
      page.node.delete(PDFName.of('PieceInfo'))
    }
    const metadata = doc.catalog.lookup(PDFName.of('Metadata'))
    if (metadata) {
      doc.catalog.delete(PDFName.of('Metadata'))
    }
  }
  // advanced?.linearize is wired but no-op until mupdf-client exposes linearize-save

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
}

async function reencodeJpeg(
  jpegBytes: Uint8Array,
  quality: number,
  targetWidth?: number,
  targetHeight?: number,
): Promise<Uint8Array> {
  const blob = new Blob([jpegBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
  const bmp = await createImageBitmap(blob)
  const shouldResize =
    !!targetWidth && !!targetHeight &&
    targetWidth >= 1 && targetHeight >= 1 &&
    targetWidth < bmp.width && targetHeight < bmp.height
  const outW = shouldResize ? targetWidth! : bmp.width
  const outH = shouldResize ? targetHeight! : bmp.height
  const canvas = new OffscreenCanvas(outW, outH)
  const ctx = canvas.getContext('2d')!
  if (shouldResize) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, 0, 0, outW, outH)
  } else {
    ctx.drawImage(bmp, 0, 0)
  }
  bmp.close()
  const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
  return new Uint8Array(await outBlob.arrayBuffer())
}

// Decoded-JPEG cache reused across quality-ladder rungs. Same structural buffer
// feeds every rung, so identical JPEG XObjects appear each time — decode once,
// re-encode at each quality.
type JpegCacheEntry = { canvas: OffscreenCanvas }
export type JpegDecodeCache = Map<string, JpegCacheEntry>

// Per-image cache cap. Roughly 25 MP → 100 MB RGBA; scans above this stay on
// the un-cached path so a huge multi-page scan can't balloon browser memory.
const JPEG_CACHE_MAX_PIXELS = 25_000_000

function fingerprintJpeg(bytes: Uint8Array): string {
  // FNV-1a over the first 256 bytes + total length. JPEG markers, quantization
  // tables, and Huffman tables live in the header, so this is a near-zero
  // collision key for distinct images within a single PDF.
  const len = Math.min(bytes.byteLength, 256)
  let h = 2166136261 >>> 0
  for (let i = 0; i < len; i++) {
    h ^= bytes[i]
    h = Math.imul(h, 16777619) >>> 0
  }
  return `${bytes.byteLength.toString(36)}:${h.toString(36)}`
}

async function reencodeJpegCached(
  jpegBytes: Uint8Array,
  quality: number,
  cache?: JpegDecodeCache,
  targetWidth?: number,
  targetHeight?: number,
): Promise<Uint8Array> {
  const key = fingerprintJpeg(jpegBytes)

  // Item 2: prefer the worker pool. Each worker keeps its own decode cache,
  // routed by fingerprint hash. On pool failure, fall through to main thread.
  if (P1_FEATURES.jpegWorkerPool) {
    try {
      const { getJpegWorkerPool } = await import('./jpeg-worker-pool')
      const pool = getJpegWorkerPool()
      if (pool) return await pool.encode(key, jpegBytes, quality, targetWidth, targetHeight)
    } catch {
      // fall through
    }
  }

  if (!cache) return reencodeJpeg(jpegBytes, quality, targetWidth, targetHeight)

  let entry = cache.get(key)
  if (!entry) {
    const blob = new Blob([jpegBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
    const bmp = await createImageBitmap(blob)
    // Skip caching oversize images — decode once, encode, discard.
    if (bmp.width * bmp.height > JPEG_CACHE_MAX_PIXELS) {
      bmp.close()
      return reencodeJpeg(jpegBytes, quality, targetWidth, targetHeight)
    }
    const canvas = new OffscreenCanvas(bmp.width, bmp.height)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0)
    bmp.close()
    entry = { canvas }
    cache.set(key, entry)
  }
  const shouldResize =
    !!targetWidth && !!targetHeight &&
    targetWidth >= 1 && targetHeight >= 1 &&
    targetWidth < entry.canvas.width && targetHeight < entry.canvas.height
  if (shouldResize) {
    const dst = new OffscreenCanvas(targetWidth!, targetHeight!)
    const dctx = dst.getContext('2d')!
    dctx.imageSmoothingEnabled = true
    dctx.imageSmoothingQuality = 'high'
    dctx.drawImage(entry.canvas, 0, 0, targetWidth!, targetHeight!)
    const outBlob = await dst.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
    return new Uint8Array(await outBlob.arrayBuffer())
  }
  const outBlob = await entry.canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
  return new Uint8Array(await outBlob.arrayBuffer())
}

async function recompressImages(
  buffer: ArrayBuffer,
  quality: number,
  fileName: string
): Promise<File> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const context = doc.context

  // Enumerate all JPEG XObjects up front, then re-encode through the
  // JPEG worker pool with bounded concurrency. Old code awaited each
  // reencodeJpeg call on the main thread — on a 1000-page scan that
  // serialized ~1000 OffscreenCanvas encodes into a single main-thread
  // stall of several minutes. Routing through reencodeJpegCached hands
  // the work to the shared worker pool (identical images cache-hit
  // across the batch too).
  type Task = { ref: PDFRef; obj: PDFRawStream }
  const tasks: Task[] = []
  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue
    const subtype = obj.dict.get(PDFName.of('Subtype'))
    if (subtype?.toString() !== '/Image') continue
    const filter = obj.dict.get(PDFName.of('Filter'))
    if (filter?.toString() !== '/DCTDecode') continue
    tasks.push({ ref, obj })
  }

  const CONCURRENCY = isMobile() ? 2 : 4
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const chunk = tasks.slice(i, i + CONCURRENCY)
    const results = await Promise.all(
      chunk.map(async ({ obj }) => {
        try {
          return await reencodeJpegCached(obj.contents, quality)
        } catch {
          return null
        }
      })
    )
    for (let j = 0; j < chunk.length; j++) {
      const reencoded = results[j]
      if (!reencoded) continue
      const { ref, obj } = chunk[j]
      if (reencoded.byteLength >= obj.contents.byteLength) continue
      obj.dict.set(PDFName.of('Length'), PDFNumber.of(reencoded.byteLength))
      context.assign(ref, PDFRawStream.of(obj.dict, reencoded))
    }
  }

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
}

/**
 * Keep-text image-recompress pass. Extends `recompressImages` behavior by
 * ALSO downsampling Flate-encoded PNG-origin image XObjects (DeviceRGB and
 * DeviceGray, 8-bit) via `downsampleFlateImage`. Other codecs (JPX, JBIG2,
 * CCITT) and non-basic colorspaces (ICCBased, Indexed, DeviceN, Pattern, etc.)
 * are preserved as-is and collected into a local `preservedImages` diagnostic.
 *
 * The JPEG (`/DCTDecode`) path here matches `recompressImages` exactly so
 * behavior is preserved for the keep-text pipeline.
 */
// Item 5: plan/execute split. Parse the buffer once, enumerate image XObjects
// once, then reuse across every ladder rung. Between rungs, mutated refs are
// restored to their original PDFRawStream so the next rung starts pristine.
type JpegPlanItem = {
  kind: 'jpeg'
  ref: PDFRef
  originalObj: PDFRawStream
  // Populated when /Width and /Height are readable off the image dict. Used
  // to downsample JPEG pixels to `targetDpi` before re-encoding — matching
  // what Ghostscript/iLovePDF distiller presets do. Absent → quality-only.
  w?: number
  h?: number
  effectiveSourceDpi?: number
  // Raw JPEG bytes. For plain /DCTDecode this is a reference to
  // `originalObj.contents`. For chained filters like `[ /FlateDecode /DCTDecode ]`
  // (JPEG wrapped in an outer Flate layer) this holds the inflated bytes so
  // the encoder sees pure JPEG. When set alongside `unwrapFlate`, apply()
  // rewrites the dict with a single /DCTDecode filter.
  jpegBytes: Uint8Array
  unwrapFlate?: boolean
}
type FlatePlanItem = {
  kind: 'flate'
  ref: PDFRef
  originalObj: PDFRawStream
  w: number
  h: number
  cssnap: '/DeviceRGB' | '/DeviceGray'
  effectiveSourceDpi: number
}
export type KeepTextPlan = {
  doc: PDFDocument
  items: Array<JpegPlanItem | FlatePlanItem>
  preservedImages: string[]
  flateLevel?: number
  jpegCache?: JpegDecodeCache
  // Fix 2: pristine bytes cache. Computed on the first no-op rung and reused
  // by subsequent no-op rungs to avoid re-serializing an unchanged doc.
  pristineBytes?: Uint8Array
}

async function planImageRecompress(
  buffer: ArrayBuffer,
  opts: {
    sourceDpi: number
    imageRenderMap?: Record<string, number>
    flateLevel?: number
    jpegCache?: JpegDecodeCache
  }
): Promise<KeepTextPlan> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const context = doc.context
  const preservedImages: string[] = []
  const items: Array<JpegPlanItem | FlatePlanItem> = []

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue
    const subtype = obj.dict.get(PDFName.of('Subtype'))
    if (subtype?.toString() !== '/Image') continue

    const filter = obj.dict.get(PDFName.of('Filter'))
    const filterStr = filter?.toString() ?? ''

    // Detect JPEG payload. Plain `/DCTDecode` is the common case. Some PDFs
    // (notably scan-heavy exports) wrap JPEG in an outer Flate layer, stored
    // as a filter array `[ /FlateDecode /DCTDecode ]`. Without this branch
    // ~90% of a 181 MB scanned encyclopedia was skipped entirely.
    let jpegBytes: Uint8Array | null = null
    let unwrapFlate = false
    if (filterStr === '/DCTDecode') {
      jpegBytes = obj.contents
    } else if (filter instanceof PDFArray) {
      const filters = filter.asArray().map((f) => f.toString())
      const last = filters[filters.length - 1]
      if (last === '/DCTDecode') {
        // Any leading filters (typically /FlateDecode) must be applied to
        // decode down to the raw JPEG. Anything unexpected → preserve.
        let buf = obj.contents
        let ok = true
        for (let fi = 0; fi < filters.length - 1; fi++) {
          if (filters[fi] === '/FlateDecode') {
            try { buf = inflateSync(buf) } catch { ok = false; break }
          } else { ok = false; break }
        }
        if (ok) {
          jpegBytes = buf
          unwrapFlate = filters.length > 1
        }
      }
    }
    if (jpegBytes) {
      const jw = obj.dict.get(PDFName.of('Width'))
      const jh = obj.dict.get(PDFName.of('Height'))
      if (jw instanceof PDFNumber && jh instanceof PDFNumber) {
        const w = jw.asNumber()
        const h = jh.asNumber()
        let effectiveSourceDpi = opts.sourceDpi
        if (opts.imageRenderMap) {
          const key = `${w}x${h}`
          const renderedPoints = opts.imageRenderMap[key]
          if (typeof renderedPoints === 'number' && renderedPoints > 0) {
            const dpi = computeEffectiveDpi({ pixelWidth: w, renderedPoints })
            if (Number.isFinite(dpi) && dpi > 0) effectiveSourceDpi = dpi
          }
        }
        items.push({ kind: 'jpeg', ref, originalObj: obj, w, h, effectiveSourceDpi, jpegBytes, unwrapFlate })
      } else {
        items.push({ kind: 'jpeg', ref, originalObj: obj, jpegBytes, unwrapFlate })
      }
      continue
    }

    if (filterStr === '/FlateDecode') {
      const cs = obj.dict.get(PDFName.of('ColorSpace'))
      const csStr = cs?.toString() ?? ''
      if (csStr !== '/DeviceRGB' && csStr !== '/DeviceGray') {
        preservedImages.push(`${ref.toString()}:colorspace=${csStr || 'none'}`)
        continue
      }
      const width = obj.dict.get(PDFName.of('Width'))
      const height = obj.dict.get(PDFName.of('Height'))
      const bpc = obj.dict.get(PDFName.of('BitsPerComponent'))
      if (!(width instanceof PDFNumber) || !(height instanceof PDFNumber) || !(bpc instanceof PDFNumber)) {
        preservedImages.push(`${ref.toString()}:missing-dims`)
        continue
      }
      if (bpc.asNumber() !== 8) {
        preservedImages.push(`${ref.toString()}:bpc=${bpc.asNumber()}`)
        continue
      }
      if (obj.dict.get(PDFName.of('SMask'))) {
        preservedImages.push(`${ref.toString()}:has-smask`)
        continue
      }
      if (obj.dict.get(PDFName.of('Decode'))) {
        preservedImages.push(`${ref.toString()}:has-decode`)
        continue
      }

      const w = width.asNumber()
      const h = height.asNumber()
      let effectiveSourceDpi = opts.sourceDpi
      if (opts.imageRenderMap) {
        const key = `${w}x${h}`
        const renderedPoints = opts.imageRenderMap[key]
        if (typeof renderedPoints === 'number' && renderedPoints > 0) {
          const dpi = computeEffectiveDpi({ pixelWidth: w, renderedPoints })
          if (Number.isFinite(dpi) && dpi > 0) effectiveSourceDpi = dpi
        }
      }

      items.push({
        kind: 'flate',
        ref,
        originalObj: obj,
        w,
        h,
        cssnap: csStr as '/DeviceRGB' | '/DeviceGray',
        effectiveSourceDpi,
      })
      continue
    }

    preservedImages.push(`${ref.toString()}:filter=${filterStr || 'none'}`)
  }

  return {
    doc,
    items,
    preservedImages,
    flateLevel: opts.flateLevel,
    jpegCache: opts.jpegCache,
  }
}

async function executeImageRecompress(
  plan: KeepTextPlan,
  quality: number,
  targetDpi: number,
  fileName: string
): Promise<{ file: File; preservedImages: string[]; mutationCount: number }> {
  const { doc, items, jpegCache, flateLevel } = plan
  const context = doc.context
  const preservedImages: string[] = [...plan.preservedImages]

  type Mutation = { ref: PDFRef; apply: () => void }
  const tasks: Array<Promise<Mutation | null>> = []

  for (const item of items) {
    if (item.kind === 'jpeg') {
      const { ref: jpegRef, originalObj: jpegObj, w: jw, h: jh, effectiveSourceDpi: jSrcDpi, jpegBytes, unwrapFlate } = item
      let targetWidth: number | undefined
      let targetHeight: number | undefined
      if (jw && jh && jSrcDpi && jSrcDpi > targetDpi) {
        const scale = targetDpi / jSrcDpi
        targetWidth = Math.max(1, Math.round(jw * scale))
        targetHeight = Math.max(1, Math.round(jh * scale))
      }
      tasks.push((async () => {
        try {
          const reencoded = await reencodeJpegCached(
            jpegBytes,
            quality,
            jpegCache,
            targetWidth,
            targetHeight,
          )
          // Compare against stored size (post-any-Flate-wrap). When the
          // original was Flate+DCT, dropping the outer Flate wrap alone can
          // shrink storage; we still want to gate on final stored bytes.
          if (reencoded.byteLength >= jpegObj.contents.byteLength && !unwrapFlate) return null
          if (reencoded.byteLength >= jpegBytes.byteLength && unwrapFlate) {
            // Even after unwrap, re-encode didn't help. Skip so we don't
            // trade lossless Flate wrap for a no-op re-encode.
            return null
          }
          const didResize = !!(targetWidth && targetHeight && jw && jh && (targetWidth < jw || targetHeight < jh))
          return {
            ref: jpegRef,
            apply: () => {
              const newDict = jpegObj.dict.clone(context)
              if (unwrapFlate) {
                // Rewrite filter chain as plain /DCTDecode — the outer Flate
                // wrap is dropped because we're storing raw JPEG bytes.
                newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'))
                newDict.delete(PDFName.of('DecodeParms'))
              }
              newDict.set(PDFName.of('Length'), PDFNumber.of(reencoded.byteLength))
              if (didResize) {
                newDict.set(PDFName.of('Width'), PDFNumber.of(targetWidth!))
                newDict.set(PDFName.of('Height'), PDFNumber.of(targetHeight!))
              }
              context.assign(jpegRef, PDFRawStream.of(newDict, reencoded))
            },
          }
        } catch {
          preservedImages.push(`${jpegRef.toString()}:jpeg-reencode-failed`)
          return null
        }
      })())
      continue
    }

    // flate
    const { ref: flateRef, originalObj: flateObj, w, h, cssnap, effectiveSourceDpi } = item
    tasks.push((async () => {
      try {
        const result = await downsampleFlateImage(flateObj.contents, {
          sourceWidth: w,
          sourceHeight: h,
          sourceDpi: effectiveSourceDpi,
          targetDpi,
          colorSpace: cssnap === '/DeviceRGB' ? 'DeviceRGB' : 'DeviceGray',
          bitsPerComponent: 8,
          jpegQuality: quality / 100,
          flateLevel,
        })

        if (result.filter === 'FlateDecode') return null
        if (result.bytes.byteLength >= flateObj.contents.byteLength) return null

        return {
          ref: flateRef,
          apply: () => {
            const newDict = flateObj.dict.clone(context)
            newDict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'))
            newDict.set(PDFName.of('Width'), PDFNumber.of(result.width))
            newDict.set(PDFName.of('Height'), PDFNumber.of(result.height))
            newDict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8))
            newDict.set(PDFName.of('ColorSpace'), PDFName.of(
              cssnap === '/DeviceRGB' ? 'DeviceRGB' : 'DeviceGray'
            ))
            newDict.set(PDFName.of('Length'), PDFNumber.of(result.bytes.byteLength))
            newDict.delete(PDFName.of('DecodeParms'))
            newDict.delete(PDFName.of('Predictor'))
            context.assign(flateRef, PDFRawStream.of(newDict, result.bytes))
          },
        }
      } catch {
        preservedImages.push(`${flateRef.toString()}:downsample-failed`)
        return null
      }
    })())
  }

  const CONCURRENCY = 4
  const mutations: Mutation[] = []
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const chunk = tasks.slice(i, i + CONCURRENCY)
    const settled = await Promise.all(chunk)
    for (const m of settled) if (m) mutations.push(m)
  }
  // Fix 2: if no image reduced its own size, the resulting doc is byte-identical
  // to the pristine plan state. Serialize once, cache, and reuse.
  if (mutations.length === 0) {
    if (!plan.pristineBytes) {
      const pristine = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      plan.pristineBytes = pristine as Uint8Array
    }
    return {
      file: new File([plan.pristineBytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' }),
      preservedImages,
      mutationCount: 0,
    }
  }

  for (const { apply } of mutations) apply()

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })

  // Restore mutated refs so the next rung starts from the pristine plan state.
  for (const { ref } of mutations) {
    const item = items.find((it) => it.ref === ref)
    if (item) context.assign(ref, item.originalObj)
  }

  return {
    file: new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' }),
    preservedImages,
    mutationCount: mutations.length,
  }
}

async function recompressImagesKeepText(
  buffer: ArrayBuffer,
  quality: number,
  fileName: string,
  opts: {
    targetDpi: number;
    sourceDpi: number;
    imageRenderMap?: Record<string, number>;
    flateLevel?: number;
    jpegCache?: JpegDecodeCache;
  } = { targetDpi: 150, sourceDpi: 300 }
): Promise<{ file: File; preservedImages: string[] }> {
  const plan = await planImageRecompress(buffer, {
    sourceDpi: opts.sourceDpi,
    imageRenderMap: opts.imageRenderMap,
    flateLevel: opts.flateLevel,
    jpegCache: opts.jpegCache,
  })
  return executeImageRecompress(plan, quality, opts.targetDpi, fileName)
}

// Pipeline depth: how many renderPage calls to keep in flight against the
// single mupdf worker. Higher depth = more overlap between worker rendering
// page N+k and main-thread embed/addPage for page N. Kept small on mobile
// to bound peak memory (each in-flight JPEG buffer sits in the queue).
function rasterPipelineDepth(): number {
  return isMobile() ? 2 : 4
}

// Consume an ordered async page pipeline: kicks off `depth` renders upfront,
// yields each page's bytes in order, refilling the queue as pages are drained.
// The overlap between worker render and main-thread embed/addPage is where
// the speedup comes from — mupdf serializes inside its worker, but its work
// runs in parallel with main-thread pdf-lib and canvas work.
async function* pipelineRasterPages(
  pageCount: number,
  depth: number,
  renderOne: (pageIndex: number) => Promise<Uint8Array>
): AsyncGenerator<Uint8Array, void, void> {
  const queue: Promise<Uint8Array>[] = []
  let next = 0
  const enqueueNext = () => {
    if (next < pageCount) {
      queue.push(renderOne(next))
      next++
    }
  }
  for (let i = 0; i < Math.min(depth, pageCount); i++) enqueueNext()
  for (let p = 0; p < pageCount; p++) {
    const bytes = await queue.shift()!
    enqueueNext()
    yield bytes
  }
}

/**
 * Read a JPEG's SOF marker to get intrinsic dimensions + component count.
 * Component count picks the correct /ColorSpace when embedding: 1 = Gray,
 * 3 = RGB, 4 = CMYK. Walks segments cheaply; only needs the header.
 */
function parseJpegDims(bytes: Uint8Array): { width: number; height: number; components: number } {
  if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) throw new Error('not a JPEG')
  let i = 2
  while (i < bytes.length - 9) {
    if (bytes[i] !== 0xFF) throw new Error('bad JPEG marker')
    const marker = bytes[i + 1]
    // SOFn (0xC0..0xCF except 0xC4 DHT, 0xC8 JPG, 0xCC DAC) — has the frame header.
    if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
      const height = (bytes[i + 5] << 8) | bytes[i + 6]
      const width = (bytes[i + 7] << 8) | bytes[i + 8]
      const components = bytes[i + 9]
      return { width, height, components }
    }
    // Stand-alone markers (SOI, EOI, RSTn) have no length; the rest do.
    if (marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      i += 2
      continue
    }
    const segLen = (bytes[i + 2] << 8) | bytes[i + 3]
    if (segLen < 2) throw new Error('bad JPEG segment length')
    i += 2 + segLen
  }
  throw new Error('no SOF marker in JPEG')
}

/**
 * Hand-rolled PDF writer for image-only pages. Skips pdf-lib entirely:
 * on 1000-page scans, pdf-lib's per-page embedJpg + addPage + drawImage
 * plus the final save() serialize is the wall-time bottleneck (single-
 * threaded, tens of seconds). This assembler writes one XObject +
 * content stream + page dict per page and streams them into a flat
 * byte array with a classic xref — no object parsing, no re-encoding.
 *
 * Output PDF is a plain 1.5 file with an uncompressed xref. Not as
 * compact as pdf-lib's object-stream output but faster to produce and
 * still passes through mupdf's save-compressed at the end for the
 * final structural squeeze.
 */
function assembleImagePdf(
  pages: Array<{ jpegBytes: Uint8Array; width: number; height: number; components: number }>
): Uint8Array {
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  let bytePos = 0
  const write = (v: string | Uint8Array) => {
    const c = typeof v === 'string' ? enc.encode(v) : v
    chunks.push(c)
    bytePos += c.length
  }

  const totalObjs = 2 + pages.length * 3 // catalog, pages tree, then 3 per page
  const offsets = new Array<number>(totalObjs + 1).fill(0)
  const catalogNum = 1
  const pagesNum = 2

  const startObj = (num: number) => {
    offsets[num] = bytePos
    write(`${num} 0 obj\n`)
  }
  const endObj = () => write('endobj\n')

  write('%PDF-1.5\n%\xE2\xE3\xCF\xD3\n')

  // Catalog
  startObj(catalogNum)
  write(`<< /Type /Catalog /Pages ${pagesNum} 0 R >>\n`)
  endObj()

  // Pages tree — collect page dict object numbers first
  const pageDictNums: number[] = []
  for (let k = 0; k < pages.length; k++) {
    pageDictNums.push(2 + 3 * k + 3) // page dict is the third object per page
  }
  startObj(pagesNum)
  write(`<< /Type /Pages /Kids [${pageDictNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>\n`)
  endObj()

  // Per-page objects: image XObject, content stream, page dict
  for (let k = 0; k < pages.length; k++) {
    const imageNum = 2 + 3 * k + 1
    const contentNum = 2 + 3 * k + 2
    const pageNum = 2 + 3 * k + 3
    const { jpegBytes, width, height, components } = pages[k]
    const colorSpace = components === 1 ? '/DeviceGray' : components === 4 ? '/DeviceCMYK' : '/DeviceRGB'

    // Image XObject
    startObj(imageNum)
    write(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace ${colorSpace} /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`)
    write(jpegBytes)
    write('\nendstream\n')
    endObj()

    // Content stream — draw image at MediaBox size (1:1 with pixel dims,
    // matches prior pdf-lib output so page rendering stays visually identical).
    const contentStr = `q ${width} 0 0 ${height} 0 0 cm /Im Do Q`
    const contentBytes = enc.encode(contentStr)
    startObj(contentNum)
    write(`<< /Length ${contentBytes.length} >>\nstream\n`)
    write(contentBytes)
    write('\nendstream\n')
    endObj()

    // Page dict
    startObj(pageNum)
    write(`<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im ${imageNum} 0 R >> >> /Contents ${contentNum} 0 R >>\n`)
    endObj()
  }

  // xref
  const xrefOffset = bytePos
  write(`xref\n0 ${totalObjs + 1}\n`)
  write('0000000000 65535 f \n')
  for (let n = 1; n <= totalObjs; n++) {
    const off = offsets[n].toString().padStart(10, '0')
    write(`${off} 00000 n \n`)
  }

  write(`trailer\n<< /Size ${totalObjs + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  // Concat once at the end.
  const out = new Uint8Array(bytePos)
  let pos = 0
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}

async function rasterizePdf(file: File, dpi: number, fileName: string): Promise<File> {
  const buffer = await file.arrayBuffer()
  // Transfer the source PDF to the worker once, then reference by docId.
  // Prior code cloned `buffer` on every renderPage call → ~2× memory per page
  // and Safari OOM-refresh on files ≥ ~150MB.
  const handle = await openPdf(buffer)
  try {
    const pageCount = await getPageCount(handle)
    const doc = await PDFDocument.create()

    const pages = pipelineRasterPages(pageCount, rasterPipelineDepth(), async (p) => {
      const jpegBuffer = await renderPage(handle, p, dpi, 85)
      return new Uint8Array(jpegBuffer)
    })
    for await (const jpegBytes of pages) {
      const image = await doc.embedJpg(jpegBytes)
      const page = doc.addPage([image.width, image.height])
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    }

    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
    return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
  } finally {
    await closePdf(handle).catch(() => { /* best effort */ })
  }
}

// Variant that takes an ArrayBuffer or an already-open mupdf handle. In
// target-size mode the caller opens the PDF once and reuses the handle
// across every DPI/quality rung, so we skip the buffer clone + worker
// re-parse per rung. Legacy callers still pass a buffer.
async function rasterizeForTarget(
  source: PdfSource,
  fileName: string,
  dpi: number,
  quality: number,
  onProgress?: (fraction: number) => void
): Promise<File> {
  const ownsHandle = source instanceof ArrayBuffer
  const handle = ownsHandle ? await openPdf(source.slice(0)) : source
  try {
    const pageCount = await getPageCount(handle)

    // Accumulate rendered pages, then assemble the PDF ourselves. On
    // 1000-page scans this replaces pdf-lib's per-page embedJpg + doc.save
    // (single-threaded, tens of seconds) with a flat byte writer.
    const assembled: Array<{ jpegBytes: Uint8Array; width: number; height: number; components: number }> = []
    const pages = pipelineRasterPages(pageCount, rasterPipelineDepth(), async (p) => {
      const jpegBuffer = await renderPage(handle, p, dpi, quality)
      return new Uint8Array(jpegBuffer)
    })
    let pagesDone = 0
    for await (const jpegBytes of pages) {
      const { width, height, components } = parseJpegDims(jpegBytes)
      assembled.push({ jpegBytes, width, height, components })
      pagesDone++
      // Reserve ~5% for the final assemble step on large PDFs.
      onProgress?.(Math.min(0.95, pagesDone / pageCount))
    }

    const bytes = assembleImagePdf(assembled)
    onProgress?.(1)
    return new File([bytes as unknown as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
  } finally {
    if (ownsHandle) await closePdf(handle).catch(() => { /* best effort */ })
  }
}

// Grayscale rasterization — maximum size reduction. The OffscreenCanvas
// filter step runs on the main thread, so pipelining renderPage against it
// gives a larger overlap win than the plain rasterize path.
async function rasterizeGrayscaleForTarget(
  source: PdfSource,
  fileName: string,
  dpi: number,
  quality: number,
  onProgress?: (fraction: number) => void
): Promise<File> {
  const ownsHandle = source instanceof ArrayBuffer
  const handle = ownsHandle ? await openPdf(source.slice(0)) : source
  try {
    const pageCount = await getPageCount(handle)

    const assembled: Array<{ jpegBytes: Uint8Array; width: number; height: number; components: number }> = []
    const pages = pipelineRasterPages(pageCount, rasterPipelineDepth(), async (p) => {
      const jpegBuffer = await renderPage(handle, p, dpi, quality)
      const jpegBytes = new Uint8Array(jpegBuffer)
      const blob = new Blob([jpegBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
      const bmp = await createImageBitmap(blob)
      const canvas = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = canvas.getContext('2d')!
      ctx.filter = 'grayscale(1)'
      ctx.drawImage(bmp, 0, 0)
      bmp.close()
      const grayBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
      return new Uint8Array(await grayBlob.arrayBuffer())
    })
    let pagesDone = 0
    for await (const grayBytes of pages) {
      // Canvas emits RGB JPEG even when drawn content is grayscale, so
      // parseJpegDims usually returns components=3. That's fine — the PDF
      // is still visually grayscale; storage overhead is ~10%.
      const { width, height, components } = parseJpegDims(grayBytes)
      assembled.push({ jpegBytes: grayBytes, width, height, components })
      pagesDone++
      onProgress?.(Math.min(0.95, pagesDone / pageCount))
    }

    const bytes = assembleImagePdf(assembled)
    onProgress?.(1)
    return new File([bytes as unknown as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
  } finally {
    if (ownsHandle) await closePdf(handle).catch(() => { /* best effort */ })
  }
}

/**
 * Bilevel (1-bit) rasterization — for the most aggressive target-size
 * scenarios on scanned text. Renders each page at high DPI, thresholds
 * pixels to pure black/white, and embeds as PNG. Text edges stay razor
 * sharp because there are no JPEG blocks; PNG's Flate filter compresses
 * two-tone content extremely well (10–20× smaller than grayscale JPEG
 * at the same DPI). Photos and grayscale illustrations will look bad —
 * this rung is for text-heavy scans only, applied last.
 */
async function rasterizeBilevelForTarget(
  source: PdfSource,
  fileName: string,
  dpi: number,
  onProgress?: (fraction: number) => void
): Promise<File> {
  const ownsHandle = source instanceof ArrayBuffer
  const handle = ownsHandle ? await openPdf(source.slice(0)) : source
  try {
    const pageCount = await getPageCount(handle)
    const doc = await PDFDocument.create()

    const pages = pipelineRasterPages(pageCount, rasterPipelineDepth(), async (p) => {
      // Render as high-quality JPEG then threshold — cheaper than routing
      // a new PNG-per-page path through mupdf and enough fidelity for
      // binarization (we're about to snap every pixel to 0/255 anyway).
      const jpegBuffer = await renderPage(handle, p, dpi, 90)
      const blob = new Blob([new Uint8Array(jpegBuffer) as unknown as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
      const bmp = await createImageBitmap(blob)
      const canvas = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      bmp.close()
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = img.data
      // Threshold at luma 176 (slightly above midpoint) — biases toward
      // white background on faintly-off-white scans without eating thin
      // strokes. Standard Rec. 709 luma weights.
      for (let k = 0; k < data.length; k += 4) {
        const luma = data[k] * 0.2126 + data[k + 1] * 0.7152 + data[k + 2] * 0.0722
        const v = luma >= 176 ? 255 : 0
        data[k] = v
        data[k + 1] = v
        data[k + 2] = v
      }
      ctx.putImageData(img, 0, 0)
      const pngBlob = await canvas.convertToBlob({ type: 'image/png' })
      return new Uint8Array(await pngBlob.arrayBuffer())
    })
    let pagesDone = 0
    for await (const pngBytes of pages) {
      const image = await doc.embedPng(pngBytes)
      const page = doc.addPage([image.width, image.height])
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
      pagesDone++
      onProgress?.(Math.min(0.95, pagesDone / pageCount))
    }

    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
    onProgress?.(1)
    return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
  } finally {
    if (ownsHandle) await closePdf(handle).catch(() => { /* best effort */ })
  }
}

// WinAnsi (Windows-1252) only covers specific Unicode code points. Any char
// outside that set causes pdf-lib to throw. Map common symbols to ASCII
// equivalents, then strip anything still outside the safe range.
const WINI_UNICODE_MAP: Record<string, string> = {
  // Whitespace / control
  ' ': ' ', '​': '', '‌': '', '‍': '', '﻿': '',
  ' ': ' ', ' ': ' ',
  // Quotation marks
  '‘': "'", '’': "'", '‚': "'", '‛': "'",
  '“': '"', '”': '"', '„': '"', '‟': '"',
  '‹': '<', '›': '>',
  // Dashes / hyphens
  '‐': '-', '‑': '-', '‒': '-', '–': '-', '—': '--',
  '―': '--', '−': '-',
  // Ellipsis
  '…': '...',
  // Arrows
  '←': '<-', '↑': '^', '→': '->', '↓': 'v',
  '⇐': '<=', '⇒': '=>', '⇔': '<=>',
  '➔': '->', '➡': '->',
  // Mathematical
  '·': '.', '⋅': '.', '∙': '.',
  '×': 'x', '⋆': '*', '∗': '*',
  '÷': '/',
  '≠': '!=', '≤': '<=', '≥': '>=',
  '∞': 'inf', '≈': '~=', '≡': '===',
  '±': '+/-', '′': "'", '″': '"',
  '²': '2', '³': '3', '¹': '1',
  '⁰': '0', '⁴': '4', '⁵': '5', '⁶': '6',
  '⁷': '7', '⁸': '8', '⁹': '9',
  // Greek (common in tech writing)
  'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta',
  'ε': 'epsilon', 'η': 'eta', 'θ': 'theta', 'λ': 'lambda',
  'μ': 'mu', 'ν': 'nu', 'π': 'pi', 'ρ': 'rho',
  'σ': 'sigma', 'τ': 'tau', 'φ': 'phi', 'ψ': 'psi',
  'ω': 'omega', 'Δ': 'Delta', 'Ω': 'Omega', 'Σ': 'Sigma',
  'Π': 'Pi', 'Φ': 'Phi', 'Ψ': 'Psi',
  // Misc symbols
  '•': '*', '‣': '>', '●': '*', '▪': '*',
  '✓': 'v', '✔': 'v', '✘': 'x', '✗': 'x',
  '✅': 'v', '❌': 'x',
  '©': '(c)', '®': '(R)', '™': '(TM)',
  '°': 'deg',
  '€': 'EUR', '£': 'GBP', '¥': 'JPY',
  '№': 'No.',
  '«': '<<', '»': '>>',
  '†': '+', '‡': '++', '‰': '%',
  // Box drawing / block elements (common in code blocks)
  '─': '-', '━': '-', '│': '|', '┃': '|',
  '┌': '+', '┐': '+', '└': '+', '┘': '+',
  '├': '+', '┤': '+', '┬': '+', '┴': '+', '┼': '+',
  '═': '=', '║': '|', '╔': '+', '╗': '+',
  '╚': '+', '╝': '+',
}

// WinAnsi supports U+0020-U+007E, U+00A0-U+00FF, plus these specific codepoints
const WINI_EXTENDED = new Set([
  0x0152, 0x0153, 0x0160, 0x0161, 0x0178, 0x017D, 0x017E,
  0x0192, 0x02C6, 0x02DC, 0x2013, 0x2014, 0x2018, 0x2019,
  0x201A, 0x201C, 0x201D, 0x201E, 0x2020, 0x2021, 0x2022,
  0x2026, 0x2030, 0x2039, 0x203A, 0x20AC, 0x2122,
])

export function sanitizePdfText(s: string): string {
  // Normalize line endings / tabs to space first
  let result = s.replace(/[\r\n\t]/g, ' ').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
  // Apply explicit Unicode → ASCII mappings
  for (const [from, to] of Object.entries(WINI_UNICODE_MAP)) {
    if (result.includes(from)) result = result.split(from).join(to)
  }
  // Strip any remaining chars outside WinAnsi
  return Array.from(result).filter(ch => {
    const cp = ch.codePointAt(0)!
    return (cp >= 0x20 && cp <= 0x7E) || (cp >= 0xA0 && cp <= 0xFF) || WINI_EXTENDED.has(cp)
  }).join('')
}

function isValidPdf(bytes: Uint8Array): boolean {
  const header = new TextDecoder().decode(bytes.slice(0, 8))
  return header.startsWith('%PDF-1.') || header.startsWith('%PDF-2.')
}

// ── Target-size compression ───────────────────────────────────────────────────

export type TargetSizeResult =
  | { ok: true; blob: Blob; bytes: number; passesRun: string[] }
  | {
      ok: false;
      reason: 'unachievable-keep-text';
      bestBlob: Blob;
      bestBytes: number;
      targetBytes: number;
      passesRun: string[];
    }

/**
 * Keep-text target-size compression: runs structural cleanup + JPEG re-encode
 * only. Never rasterizes. If neither pass reaches the target, returns
 * ok:false with the smallest achieved output for the caller to gate rasterize
 * behind explicit user consent.
 */
export async function compressPdfKeepText(
  input: File,
  targetBytes: number,
  onProgress?: (pct: number) => void
): Promise<TargetSizeResult> {
  const passesRun: string[] = []
  const inputBuffer = await input.arrayBuffer()

  onProgress?.(5)
  const structural = await compressStructural(inputBuffer, 'high', input.name)
  passesRun.push('structural-cleanup')
  onProgress?.(40)
  if (structural.size <= targetBytes) {
    return { ok: true, blob: structural, bytes: structural.size, passesRun }
  }

  // JPEG re-encode + Flate/PNG downsample operate on the structural output so
  // we keep the cumulative savings from both passes.
  let structuralBuffer = await structural.arrayBuffer()

  // Feature #3: dedup pass runs against the structural output BEFORE recompress.
  if (P1_FEATURES.dedupeImageXObjects) {
    try {
      const preDedup = await PDFDocument.load(structuralBuffer, { ignoreEncryption: true })
      const { dedupeImageXObjects } = await import('../pdf/dedupe-image-xobjects')
      const { collapsed } = await dedupeImageXObjects(preDedup)
      if (collapsed > 0) {
        const deduped = await preDedup.save({ useObjectStreams: true, addDefaultPage: false })
        structuralBuffer = deduped.buffer.slice(
          deduped.byteOffset,
          deduped.byteOffset + deduped.byteLength
        ) as ArrayBuffer
        passesRun.push(`image-dedup:collapsed-${collapsed}`)
      }
    } catch {
      // best-effort; fall through with the original structuralBuffer.
    }
  }

  // Feature #1: fetch per-image render map from mupdf if enabled. Skipped on
  // mobile — the mupdf-wasm parse costs 0.5–1.5 s and the DPI precision gain
  // is small vs. how much users care about wall time on phones.
  let imageRenderMap: Record<string, number> | undefined
  if (P1_FEATURES.perImageDpi && !isMobile()) {
    try {
      const { getImageBboxes } = await import('./mupdf-client')
      imageRenderMap = await getImageBboxes(structuralBuffer)
    } catch {
      imageRenderMap = undefined
    }
  }

  // Quality ladder: try highest quality first, stop at first pass that fits
  // under the target. Matches the "80 → 30% up to six passes" promise in the
  // FAQ. Each pass runs against the same structural+dedup buffer.
  //
  // Optimistic skip: after each pass we compare candidate.size / targetBytes.
  // If the result is far above target, jumping 2–3 rungs at once terminates
  // faster on inputs that need aggressive quality reduction. Worst case still
  // walks every remaining rung, so the "up to six passes" contract holds.
  // Ladder is now (quality, targetDpi) pairs. First 6 rungs match the legacy
  // ladder at 150 DPI. Last 3 rungs progressively downsample Flate/PNG images
  // (120 → 100 → 90 DPI) so scan-heavy PDFs can reach small targets without
  // rasterizing. Non-monotonic quality on the low-DPI tail is intentional:
  // fewer pixels dominates, and `best` tracks the smallest candidate seen.
  // Ladder trimmed from 9 rungs to 5. Each rung serializes the whole PDF
  // via pdf-lib, so cutting rungs directly cuts wall time. Predictive start
  // (below) and ratio-jump still let us skip further when the input is far
  // from target. Bigger quality steps between rungs mean the winning rung
  // may overshoot the target more (better compression), which is fine —
  // callers only care about ≤ target.
  const qualityLadder: Array<{ q: number; dpi: number }> = [
    { q: 80, dpi: 150 },
    { q: 60, dpi: 150 },
    { q: 40, dpi: 150 },
    { q: 45, dpi: 110 },
    { q: 30, dpi: 90 },
  ]
  let best: Blob = structural
  const ladderStart = 40
  const ladderEnd = 85
  let hitTarget = false

  // Shared across rungs: decode each JPEG XObject once, re-encode per rung.
  const jpegCache: JpegDecodeCache = new Map()

  // Item 5: plan the image-recompress work once, then execute per rung. Every
  // rung reuses the same parsed PDFDocument + enumerated XObject list, saving
  // 1× PDFDocument.load per rung on large PDFs. Between rungs, the plan is
  // restored so each rung starts from the pristine structural output.
  const plan = await planImageRecompress(structuralBuffer, {
    sourceDpi: 300,
    imageRenderMap,
    flateLevel: P1_FEATURES.flateLevel9 ? 9 : undefined,
    jpegCache,
  })

  // Fix 1: predictive ladder start. When structural output is already close to
  // the target, skip the top rungs (Q80/Q70) that would just overshoot and
  // waste a serialize each. Ratios come from real measurements on scan PDFs.
  const startRatio = structural.size / targetBytes
  let step =
    startRatio <= 1.15 ? 0 :
    startRatio <= 2.0  ? 1 :
    startRatio <= 3.5  ? 2 :
    startRatio <= 5.0  ? 3 :
                          4
  if (step > 0) passesRun.push(`ladder-start:step${step}`)

  while (step < qualityLadder.length) {
    const { q: quality, dpi: targetDpi } = qualityLadder[step]
    let candidate: Blob | null = null
    let mutationCount = 0
    try {
      const res = await executeImageRecompress(plan, quality, targetDpi, input.name)
      candidate = res.file
      mutationCount = res.mutationCount
      passesRun.push(`jpeg-recompress:q${quality}@dpi${targetDpi}${mutationCount === 0 ? ':noop' : ''}`)
    } catch {
      passesRun.push(`jpeg-recompress:q${quality}@dpi${targetDpi}:failed`)
    }

    onProgress?.(
      Math.round(ladderStart + ((step + 1) / qualityLadder.length) * (ladderEnd - ladderStart))
    )

    if (candidate && candidate.size < best.size) {
      best = candidate
    }
    if (candidate && candidate.size <= targetBytes) {
      hitTarget = true
      break
    }

    // Fix 2: if no image was reduced at this rung, the same-DPI rungs below
    // won't help either — JPEG quality alone can't shrink these images.
    // Skip to the next DPI tier.
    let jump = 1
    if (mutationCount === 0) {
      const currentDpi = qualityLadder[step].dpi
      let next = step + 1
      while (next < qualityLadder.length && qualityLadder[next].dpi === currentDpi) next++
      jump = Math.max(1, next - step)
    } else if (candidate) {
      // Predict jump size from how far we still are from the target.
      const ratio = candidate.size / targetBytes
      if (ratio > 4) jump = 3
      else if (ratio > 2) jump = 2
    }
    step += jump
  }

  // Feature #2: mupdf save-compressed final pass on the smallest candidate.
  if (P1_FEATURES.mupdfSaveCompressed) {
    try {
      const { saveCompressed } = await import('./mupdf-client')
      const bestBuffer = await best.arrayBuffer()
      const compressed = await saveCompressed(bestBuffer)
      if (compressed.byteLength < best.size) {
        best = new Blob([new Uint8Array(compressed)], { type: 'application/pdf' })
        passesRun.push('mupdf-save-compressed')
      } else {
        passesRun.push('mupdf-save-noop')
      }
    } catch {
      passesRun.push('mupdf-save-noop')
    }
  }

  if (hitTarget || best.size <= targetBytes) {
    onProgress?.(100)
    return { ok: true, blob: best, bytes: best.size, passesRun }
  }

  onProgress?.(100)
  return {
    ok: false,
    reason: 'unachievable-keep-text',
    bestBlob: best,
    bestBytes: best.size,
    targetBytes,
    passesRun,
  }
}

/**
 * Rasterize escalation. Called automatically when keep-text can't reach
 * the target — walks a ladder that keeps DPI high (≥ 120) and leans on
 * quality reduction, grayscale, then bilevel PNG so scanned text stays
 * sharp even at aggressive targets.
 */
export async function rasterizeToTargetSize(
  input: File,
  targetBytes: number,
  onProgress?: (pct: number) => void
): Promise<{ file: File; meta: CompressionMeta }> {
  const originalBytes = input.size
  const floor = targetBytes * 0.5
  // Open the source PDF into mupdf once and reuse the handle across every
  // rung. Previously each step called openPdf → transferring a fresh clone
  // of the (potentially 100MB+) buffer to the worker and re-parsing the doc.
  // On the escalation path that ran 5× per file.
  const inputBuffer = await input.arrayBuffer()
  const handle = await openPdf(inputBuffer)

  // Ladder ordering rule: DPI is what makes scan text sharp — text edges
  // need pixels. Dropping DPI from 200 → 72 saves ~85% of bytes but shreds
  // legibility. Dropping JPEG quality from 80 → 40 saves ~50% and stays
  // readable. Grayscale is a free ~60% win with zero sharpness cost.
  // So we exhaust quality + grayscale before we ever touch DPI, and never
  // fall below 120 DPI on the final rung.
  //
  // `produce` takes a fractional progress callback so we can move the
  // outer bar continuously per page inside a rung instead of leaping at
  // rung boundaries. `weight` is a rough wall-time estimate (proportional
  // to pixels × color-channels) so heavy rungs get a proportionally
  // larger slice of the outer 0–95% budget.
  // Ladder trimmed from 7 rungs to 6. Each rung renders every page — on a
  // 100-page scan that's 100 mupdf renders per rung. Bigger quality steps
  // between rungs mean the winning rung fewer rungs deep. Bilevel stays as
  // the final rung for text-heavy scans.
  const steps: Array<{
    label: string
    weight: number
    produce: (op?: (frac: number) => void) => Promise<File>
  }> = [
    { label: 'rasterize 200 DPI quality 80',      weight: 1.00, produce: (op) => rasterizeForTarget(handle, input.name, 200, 80, op) },
    { label: 'rasterize 200 DPI quality 55',      weight: 1.00, produce: (op) => rasterizeForTarget(handle, input.name, 200, 55, op) },
    { label: 'rasterize grayscale 200 DPI q 55',  weight: 0.60, produce: (op) => rasterizeGrayscaleForTarget(handle, input.name, 200, 55, op) },
    { label: 'rasterize grayscale 150 DPI q 40',  weight: 0.35, produce: (op) => rasterizeGrayscaleForTarget(handle, input.name, 150, 40, op) },
    { label: 'rasterize grayscale 120 DPI q 30',  weight: 0.22, produce: (op) => rasterizeGrayscaleForTarget(handle, input.name, 120, 30, op) },
    { label: 'rasterize bilevel 200 DPI',         weight: 0.75, produce: (op) => rasterizeBilevelForTarget(handle, input.name, 200, op) },
  ]

  // Predictive start: input:target ratios above ~3× mean the first rungs
  // will definitely overshoot. Rough per-rung compression estimates for
  // typical scan PDFs give us a starting point that skips wasted renders.
  // The last (bilevel) rung is never a start — it's a last resort for
  // text-heavy scans, not a color-preserving target.
  const inputTargetRatio = input.size / targetBytes
  const startRung =
    inputTargetRatio <= 2.0 ? 0 :
    inputTargetRatio <= 3.5 ? 1 :
    inputTargetRatio <= 6.0 ? 2 :
    inputTargetRatio <= 10  ? 3 :
                              4

  const totalWeight = steps.reduce((s, r) => s + r.weight, 0)
  const cumulativeWeight: number[] = []
  {
    let acc = 0
    for (const r of steps) {
      cumulativeWeight.push(acc)
      acc += r.weight
    }
  }
  // Reserve 5% for the initial mupdf open + 5% for the final result
  // handoff so the bar never sits at 0 or 100 during real work.
  const OUTER_BASE = 5
  const OUTER_SPAN = 90
  const reportRungProgress = (rungIdx: number, frac: number) => {
    const base = OUTER_BASE + (cumulativeWeight[rungIdx] / totalWeight) * OUTER_SPAN
    const span = (steps[rungIdx].weight / totalWeight) * OUTER_SPAN
    onProgress?.(Math.round(base + Math.min(1, Math.max(0, frac)) * span))
  }
  onProgress?.(OUTER_BASE)

  let prevBest: File = input
  let prevBestLabel = 'original'
  let iterationsUsed = 0

  try {
  for (let i = startRung; i < steps.length; i++) {
    let candidate: File
    try {
      candidate = await steps[i].produce((frac) => reportRungProgress(i, frac))
    } catch {
      // Rung failed — advance the bar to the rung boundary so the user
      // isn't stuck watching a stalled percent while we try the next one.
      reportRungProgress(i, 1)
      iterationsUsed++
      continue
    }
    reportRungProgress(i, 1)

    const bytes = new Uint8Array(await candidate.arrayBuffer())
    if (!isValidPdf(bytes)) {
      iterationsUsed++
      continue
    }

    iterationsUsed++

    if (candidate.size <= targetBytes) {
      if (candidate.size >= floor) {
        return await finalizeWithMupdfPass(candidate, steps[i].label, true)
      }
      if (prevBest.size > targetBytes) {
        return await finalizeWithMupdfPass(candidate, steps[i].label, true)
      }
      break
    }

    if (candidate.size < prevBest.size) {
      prevBest = candidate
      prevBestLabel = steps[i].label
    }
  }

  return await finalizeWithMupdfPass(prevBest, prevBestLabel, prevBest.size <= targetBytes)

  // Final structural squeeze: hand the winning file to mupdf which
  // re-serializes with object streams + Flate 9 across every stream.
  // Our hand-rolled image-PDF assembler writes a plain xref for speed,
  // so this pass typically reclaims another 5–15% on rasterized output
  // with zero visual change. Guarded by "keep whichever is smaller".
  async function finalizeWithMupdfPass(
    file: File,
    settingsLabel: string,
    reachedTarget: boolean
  ): Promise<{ file: File; meta: CompressionMeta }> {
    let finalFile = file
    try {
      const buf = await file.arrayBuffer()
      const { saveCompressed } = await import('./mupdf-client')
      const compressed = await saveCompressed(buf)
      if (compressed.byteLength > 0 && compressed.byteLength < file.size) {
        finalFile = new File([new Uint8Array(compressed) as unknown as Uint8Array<ArrayBuffer>], file.name, { type: 'application/pdf' })
      }
    } catch { /* best-effort */ }
    onProgress?.(100)
    return {
      file: finalFile,
      meta: {
        originalBytes,
        targetBytes,
        achievedBytes: finalFile.size,
        // If the mupdf pass pushed a marginal candidate UNDER the target,
        // upgrade reachedTarget accordingly. Never downgrade.
        reachedTarget: reachedTarget || finalFile.size <= targetBytes,
        isUnchanged: false,
        iterationsUsed,
        appliedSettings: settingsLabel,
        message: finalFile.size <= targetBytes
          ? undefined
          : `Couldn't reach ${formatBytes(targetBytes)} — smallest possible is ${formatBytes(finalFile.size)}`,
      },
    }
  }
  } finally {
    await closePdf(handle).catch(() => { /* best effort */ })
  }
}

/**
 * @deprecated: to remove in follow-up.
 *
 * Retained because size-target landing pages (/compress-pdf/to-100kb, etc.)
 * still route through `compressPDF` and rely on the auto-escalate-to-rasterize
 * behavior to hit their advertised size caps without user interaction. The
 * /compress-pdf tool page itself now bypasses this adapter and calls
 * `compressPdfKeepText` + `rasterizeToTargetSize` directly so it can show
 * a soft warning and auto-fall-through without user consent. Do NOT add
 * new callers.
 */
export async function compressPdfToTargetSize(
  input: File,
  targetBytes: number,
  onProgress?: (pct: number) => void
): Promise<{ file: File; meta: CompressionMeta }> {
  const originalBytes = input.size

  // INVARIANT 1: if input is already within target, return original unchanged
  if (originalBytes <= targetBytes) {
    onProgress?.(100)
    return {
      file: input,
      meta: {
        originalBytes,
        targetBytes,
        achievedBytes: originalBytes,
        reachedTarget: true,
        isUnchanged: true,
        iterationsUsed: 0,
        appliedSettings: 'none — file already within target',
      },
    }
  }

  const keepText = await compressPdfKeepText(input, targetBytes, (pct) =>
    onProgress?.(Math.round(pct * 0.4))
  )
  if (keepText.ok) {
    onProgress?.(100)
    const outFile = new File([keepText.blob], input.name, { type: 'application/pdf' })
    return {
      file: outFile,
      meta: {
        originalBytes,
        targetBytes,
        achievedBytes: keepText.bytes,
        reachedTarget: true,
        isUnchanged: false,
        iterationsUsed: keepText.passesRun.length,
        appliedSettings: keepText.passesRun.join(' + '),
      },
    }
  }

  return rasterizeToTargetSize(input, targetBytes, (pct) =>
    onProgress?.(Math.round(40 + pct * 0.6))
  )
}

// ── Compress ──────────────────────────────────────────────────────────────────

// Safari's per-tab WebAssembly heap is capped near 2GB on desktop and
// closer to ~1–1.5GB effective on iOS before the OS reaps the tab.
// Rasterization peaks at roughly 3× file size (main-thread buffer +
// worker doc + pixmap + growing pdf-lib doc), so gate on that. Reject
// oversized files with a real message instead of a silent OOM refresh.
const SAFARI_DESKTOP_MAX_PDF_BYTES = 300 * 1024 * 1024
const SAFARI_IOS_MAX_PDF_BYTES = 150 * 1024 * 1024

export async function compressPDF(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<Array<File | Error | { file: File; meta: CompressionMeta }>> {
  const targetSizeMode = options.targetSizeMode === true
  const results: Array<File | Error | { file: File; meta: CompressionMeta }> = new Array(files.length)

  const safari = isSafari()
  if (safari) {
    const limit = isIos() ? SAFARI_IOS_MAX_PDF_BYTES : SAFARI_DESKTOP_MAX_PDF_BYTES
    // Track rejections explicitly. `results` is a sparse array from
    // `new Array(files.length)` and Array.prototype.every SKIPS HOLES —
    // `[<empty>].every(cb)` returns true vacuously and would silently
    // short-circuit conversion for every Safari user with a small file.
    let rejectedCount = 0
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > limit) {
        results[i] = new Error(
          `This PDF is ${formatBytes(files[i].size)}. Safari can't compress files larger than ${formatBytes(limit)} without refreshing the tab. Try Chrome or Firefox, or split the PDF first.`
        )
        rejectedCount++
      }
    }
    // If every file was rejected, short-circuit.
    if (rejectedCount === files.length && files.length > 0) return results
  }

  // Fix 4: for target-size mode, run 2 files concurrently. Each file has its
  // own PDFDocument + jpegCache, and the JPEG worker pool is shared, so parallel
  // files overlap main-thread pdf-lib work with worker JPEG encoding.
  if (targetSizeMode) {
    const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 500
    const targetBytes = targetKB * 1024
    // Mobile: run sequentially. Two files in parallel doubles peak RAM and
    // usually slows total wall time due to thermal throttling.
    const CONCURRENCY = isMobile() ? 1 : 2
    for (let start = 0; start < files.length; start += CONCURRENCY) {
      const chunk = files.slice(start, start + CONCURRENCY)
      const chunkResults = await Promise.all(
        chunk.map(async (file, offset) => {
          const i = start + offset
          // Preserve Safari size-gate rejection from above.
          if (results[i] instanceof Error) return results[i] as Error
          try {
            return await compressPdfToTargetSize(file, targetBytes, (pct) => onProgress?.(i, pct))
          } catch (err) {
            return new Error(err instanceof Error ? err.message : 'Compression failed')
          }
        })
      )
      for (let offset = 0; offset < chunkResults.length; offset++) {
        results[start + offset] = chunkResults[offset]
      }
    }
    return results
  }

  for (let i = 0; i < files.length; i++) {
    // Preserve Safari size-gate rejection from above.
    if (results[i] instanceof Error) continue
    try {
      if (targetSizeMode) {
        // unreachable — handled above
        void 0
      } else {
        const level = (options.level as 'low' | 'medium' | 'high' | 'aggressive') ?? 'medium'
        // Preset profiles — each level bakes a full DPI cap + JPEG quality
        // combination. Prior behavior used a single 150 DPI / Q70 default for
        // every level, which made low/medium/high produce nearly identical
        // output. These profiles are tuned to beat iLovePDF's ebook/screen
        // distiller ratios at each level.
        const levelProfile = {
          low:        { dpi: 200, quality: 78 },
          medium:     { dpi: 140, quality: 62 },
          high:       { dpi: 100, quality: 48 },
          aggressive: { dpi: 140, quality: 68 },
        }[level]
        // Advanced-preset override: when the user applied a PresetBar preset
        // (Email/Web/Print/Archive/Maximum) or slid the Advanced quality
        // slider, honor those values instead of the level profile — that's
        // the whole point of the Advanced tab. The __presetSource marker is
        // set to 'advanced' by handlePresetApply in tool-shell.
        const advancedActive = options.__presetSource === 'advanced'
        // Custom DPI (advanced toggle) overrides the level's DPI cap.
        // Advanced-preset also overrides.
        const targetDpi = (advancedActive || options.dpiMode === true) && typeof options.targetDpi === 'number'
          ? options.targetDpi
          : levelProfile.dpi
        const jpegQuality = advancedActive && typeof options.jpegQuality === 'number'
          ? options.jpegQuality
          : levelProfile.quality
        const grayscale = options.grayscale === true
        const advancedStrip = {
          stripMetadata: options.stripMetadata !== false,
          stripAnnotations: options.stripAnnotations === true,
          stripBookmarks: options.stripBookmarks === true,
          stripEmbedded: options.stripEmbedded === true,
          stripJS: options.stripJS === true,
          // NEW:
          removeUnusedFonts: options.removeUnusedFonts === true,
          stripFormFields: options.stripFormFields === true,
          formFieldStrategy: (options.formFieldStrategy as 'flatten' | 'remove') ?? 'flatten',
          linearize: options.linearize === true,
          stripPrivateAppData: options.stripPrivateAppData === true,
        }
        if (level === 'aggressive') {
          onProgress?.(i, 10)
          const buffer = await files[i].arrayBuffer()
          let rasterized = grayscale
            ? await rasterizeGrayscaleForTarget(buffer, files[i].name, targetDpi, jpegQuality)
            : await rasterizeForTarget(buffer, files[i].name, targetDpi, jpegQuality)
          onProgress?.(i, 85)
          // Final mupdf pass: the hand-rolled image-PDF writer emits a plain
          // uncompressed xref. mupdf's saveCompressed re-serializes with
          // object streams + Flate 9, routinely reclaiming another 5–15% on
          // scan-heavy output. Skipped on the original preset path (was a
          // silent gap vs. non-aggressive levels).
          try {
            const rBuf = await rasterized.arrayBuffer()
            const { saveCompressed } = await import('./mupdf-client')
            const compressed = await saveCompressed(rBuf)
            if (compressed.byteLength > 0 && compressed.byteLength < rasterized.size) {
              rasterized = new File([new Uint8Array(compressed) as unknown as Uint8Array<ArrayBuffer>], files[i].name, { type: 'application/pdf' })
            }
          } catch { /* best-effort */ }
          onProgress?.(i, 100)
          // Guard: rasterization can bloat text/vector-heavy inputs. If the
          // output isn't smaller, return the original untouched.
          results[i] = rasterized.size < files[i].size ? rasterized : files[i]
        } else {
          onProgress?.(i, 10)
          const buffer = await files[i].arrayBuffer()
          let file = await compressStructural(buffer, level, files[i].name, advancedStrip)
          onProgress?.(i, 40)

          // Dedupe identical image XObjects. On scan-heavy PDFs with
          // recurring letterheads / stamps / page numbers this routinely
          // reclaims 5–15% with zero visual change. Safe at every level —
          // duplicate images render identically after collapse.
          {
            try {
              const dedupBuf = await file.arrayBuffer()
              const dedupDoc = await PDFDocument.load(dedupBuf, { ignoreEncryption: true })
              const { dedupeImageXObjects } = await import('../pdf/dedupe-image-xobjects')
              const { collapsed } = await dedupeImageXObjects(dedupDoc)
              if (collapsed > 0) {
                const bytes = await dedupDoc.save({ useObjectStreams: true, addDefaultPage: false })
                const deduped = new File([bytes as Uint8Array<ArrayBuffer>], files[i].name, { type: 'application/pdf' })
                if (deduped.size < file.size) file = deduped
              }
            } catch { /* best-effort */ }
          }
          onProgress?.(i, 55)

          if (grayscale) {
            const structBuf = await file.arrayBuffer()
            const rasterized = await rasterizeGrayscaleForTarget(structBuf, files[i].name, targetDpi, jpegQuality)
            // Guard: keep whichever is smallest across original, structural, rasterized.
            if (rasterized.size < file.size) file = rasterized
          } else {
            // Preset image pass. Previously called `recompressImages`, which
            // only re-encoded existing JPEG XObjects at the requested quality
            // — no downsampling, no touch on Flate/PNG images. Switching to
            // the keep-text pipeline gives us per-image DPI downsampling for
            // both JPEG (via cap on rendered DPI) and Flate images (via
            // downsampleFlateImage), which is where iLovePDF's presets pull
            // most of their compression ratio.
            const structBuf = await file.arrayBuffer()
            let imageRenderMap: Record<string, number> | undefined
            if (P1_FEATURES.perImageDpi && !isMobile()) {
              try {
                const { getImageBboxes } = await import('./mupdf-client')
                imageRenderMap = await getImageBboxes(structBuf)
              } catch {
                imageRenderMap = undefined
              }
            }
            try {
              const { file: recompressed } = await recompressImagesKeepText(
                structBuf,
                jpegQuality,
                files[i].name,
                {
                  targetDpi,
                  sourceDpi: 300,
                  imageRenderMap,
                  flateLevel: P1_FEATURES.flateLevel9 ? 9 : undefined,
                }
              )
              if (recompressed.size < file.size) file = recompressed
            } catch { /* best-effort — keep structural output */ }
          }
          onProgress?.(i, 80)

          // Final pass for every non-aggressive level: hand the result to
          // mupdf which re-serializes with object streams + Flate 9 across
          // every content/image stream. pdf-lib's save() writes at Flate's
          // default level and can't restream existing objects — mupdf routinely
          // reclaims another 5–20% on top with no quality change. Safe to
          // apply at low/medium/high; we keep whichever output is smaller.
          try {
            const finalBuf = await file.arrayBuffer()
            const { saveCompressed } = await import('./mupdf-client')
            const compressed = await saveCompressed(finalBuf)
            if (compressed.byteLength > 0 && compressed.byteLength < file.size) {
              file = new File([new Uint8Array(compressed) as unknown as Uint8Array<ArrayBuffer>], files[i].name, { type: 'application/pdf' })
            }
          } catch { /* best-effort */ }

          onProgress?.(i, 100)
          // Final safety: never return larger than input.
          results[i] = file.size < files[i].size ? file : files[i]
        }
      }
    } catch (err) {
      results[i] = new Error(err instanceof Error ? err.message : 'Compression failed')
    }
  }

  return results
}

// ── PDF to JPG ────────────────────────────────────────────────────────────────

export async function pdfToJpg(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const dpi = typeof options.dpi === 'number' ? options.dpi : 150
  const quality = typeof options.quality === 'number' ? options.quality : 85
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const pageCount = await getPageCount(buffer)
      const baseName = files[i].name.replace(/\.[^.]+$/, '')

      for (let p = 0; p < pageCount; p++) {
        const jpegBuffer = await renderPage(buffer, p, dpi, quality)
        const fileName = pageCount === 1
          ? `${baseName}.jpg`
          : `${baseName}-page-${p + 1}.jpg`
        results.push(new File([jpegBuffer], fileName, { type: 'image/jpeg' }))
        onProgress?.(i, Math.round(((p + 1) / pageCount) * 100))
      }
    } catch (err) {
      results.push(new Error(err instanceof Error ? err.message : 'Conversion failed'))
    }
  }

  return results
}

// ── PDF to PNG ────────────────────────────────────────────────────────────────

export async function pdfToPng(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const dpi = typeof options.dpi === 'number' ? options.dpi : 150
  const transparent = options.transparent === true
  const pageFrom = typeof options.pageFrom === 'number' ? Math.max(1, options.pageFrom) : 1
  const pageToOpt = typeof options.pageTo === 'number' ? options.pageTo : 9999
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const pageCount = await getPageCount(buffer)
      const baseName = files[i].name.replace(/\.[^.]+$/, '')
      const startIdx = pageFrom - 1
      const endIdx = Math.min(pageToOpt - 1, pageCount - 1)

      if (startIdx > endIdx) {
        const reason = startIdx >= pageCount
          ? `"From page" (${pageFrom}) is beyond this PDF's page count (${pageCount}).`
          : `"From page" (${pageFrom}) must be ≤ "To page" (${pageToOpt}).`
        results.push(new Error(reason))
        onProgress?.(i, 100)
        continue
      }

      const isAllPages = pageFrom === 1 && pageToOpt >= pageCount
      for (let p = startIdx; p <= endIdx; p++) {
        const pngBuffer = await renderPagePng(buffer, p, dpi, transparent)
        const fileName = pageCount === 1 && isAllPages
          ? `${baseName}.png`
          : `${baseName}-page-${p + 1}.png`
        results.push(new File([pngBuffer], fileName, { type: 'image/png' }))
        onProgress?.(i, Math.round(5 + ((p - startIdx + 1) / (endIdx - startIdx + 1)) * 95))
      }
    } catch (err) {
      results.push(new Error(err instanceof Error ? err.message : 'Conversion failed'))
    }
  }

  return results
}

// ── Split PDF ─────────────────────────────────────────────────────────────────

export async function splitPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const mode = (options.splitMode as string) ?? 'each-page'
  const everyN = typeof options.everyN === 'number' ? Math.max(1, options.everyN) : 1
  const pageFrom = typeof options.pageFrom === 'number' ? Math.max(1, options.pageFrom) : 1
  const pageToOpt = typeof options.pageTo === 'number' ? options.pageTo : 9999
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer)
      const pageCount = srcDoc.getPageCount()
      const baseName = files[i].name.replace(/\.[^.]+$/, '')

      // Build list of [startIdx, endIdx] chunks (0-indexed)
      const chunks: Array<[number, number]> = []
      if (mode === 'each-page') {
        for (let p = 0; p < pageCount; p++) chunks.push([p, p])
      } else if (mode === 'every-n') {
        for (let start = 0; start < pageCount; start += everyN) {
          chunks.push([start, Math.min(start + everyN - 1, pageCount - 1)])
        }
      } else {
        // page-range
        const start = Math.min(pageFrom - 1, pageCount - 1)
        const end = Math.min(pageToOpt - 1, pageCount - 1)
        if (start <= end) chunks.push([start, end])
      }

      for (let c = 0; c < chunks.length; c++) {
        const [start, end] = chunks[c]
        const outDoc = await PDFDocument.create()
        const indices = Array.from({ length: end - start + 1 }, (_, k) => start + k)
        const copied = await outDoc.copyPages(srcDoc, indices)
        for (const page of copied) outDoc.addPage(page)
        const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false })

        let suffix: string
        if (mode === 'each-page') {
          const padLen = String(pageCount).length
          suffix = pageCount === 1 ? '' : `-page-${String(start + 1).padStart(padLen, '0')}`
        } else if (mode === 'every-n') {
          suffix = chunks.length === 1 ? '' : `-part-${c + 1}`
        } else {
          suffix = start === end ? `-page-${start + 1}` : `-pages-${start + 1}-${end + 1}`
        }

        results.push(new File([bytes as Uint8Array<ArrayBuffer>], `${baseName}${suffix}.pdf`, { type: 'application/pdf' }))
        onProgress?.(i, Math.round(5 + ((c + 1) / chunks.length) * 95))
      }
    } catch (err) {
      results.push(new Error(err instanceof Error ? err.message : 'Split failed'))
    }
  }

  return results
}

// ── PDF to Text ───────────────────────────────────────────────────────────────

export async function pdfToText(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const pageMarkers = options.pageMarkers !== false
  const pageFrom = typeof options.pageFrom === 'number' ? Math.max(1, options.pageFrom) : 1
  const pageToOpt = typeof options.pageTo === 'number' ? options.pageTo : 9999
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 10)
      const buffer = await files[i].arrayBuffer()
      const allPages = await extractText(buffer)
      onProgress?.(i, 80)
      const selected = allPages.slice(pageFrom - 1, pageToOpt)
      const text = selected
        .map((t, idx) =>
          pageMarkers ? `--- Page ${pageFrom + idx} ---\n\n${t}` : t
        )
        .join('\n\n')
      if (text.replace(/\s/g, '').length < 30) {
        results.push(new Error(
          'No text found. This PDF appears to be a scanned document (image-based). ' +
          'Use the PDF to Word tool instead — it includes free OCR.'
        ))
        onProgress?.(i, 100)
        continue
      }
      const baseName = files[i].name.replace(/\.[^.]+$/, '')
      results.push(new File([text], `${baseName}.txt`, { type: 'text/plain' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(new Error(err instanceof Error ? err.message : 'Text extraction failed'))
    }
  }

  return results
}

// ── Images to PDF ─────────────────────────────────────────────────────────────

async function embedImagePage(doc: PDFDocument, inputFile: File, pageSize: string, orientation = 'auto'): Promise<void> {
  let file = inputFile

  // HEIC/HEIF: decode to PNG via heic2any before embedding
  if (file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name)) {
    const heic2any = (await import('heic2any')).default
    const result = await heic2any({ blob: file, toType: 'image/png' })
    const blob = Array.isArray(result) ? result[0] : result
    file = new File([blob as Blob], file.name.replace(/\.(heic|heif)$/i, '.png'), { type: 'image/png' })
  }

  const buffer = await file.arrayBuffer()
  let imgBytes: Uint8Array<ArrayBuffer>
  let embedFn: 'embedJpg' | 'embedPng'

  if (file.type === 'image/jpeg') {
    imgBytes = new Uint8Array(buffer) as Uint8Array<ArrayBuffer>
    embedFn = 'embedJpg'
  } else {
    // Convert any non-JPEG format to PNG via canvas
    const blob = new Blob([buffer], { type: file.type })
    const bmp = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bmp, 0, 0)
    bmp.close()
    const pngBlob = await canvas.convertToBlob({ type: 'image/png' })
    imgBytes = new Uint8Array(await pngBlob.arrayBuffer()) as Uint8Array<ArrayBuffer>
    embedFn = 'embedPng'
  }

  const image = await doc[embedFn](imgBytes)
  const { width, height } = image

  // Page dimensions in PDF points (1 pt = 1/72 inch)
  if (pageSize === 'fit-to-image') {
    const page = doc.addPage([width, height])
    page.drawImage(image, { x: 0, y: 0, width, height })
    return
  }

  let pageW: number, pageH: number
  if (pageSize === 'a4') {
    pageW = 595; pageH = 842
  } else {
    // letter
    pageW = 612; pageH = 792
  }

  // Resolve orientation BEFORE adding the page so dimensions are correct
  const isLandscapeImage = width > height
  const wantLandscape =
    orientation === 'landscape' ||
    (orientation === 'auto' && isLandscapeImage)
  if (wantLandscape && pageH > pageW) {
    ;[pageW, pageH] = [pageH, pageW]
  } else if (!wantLandscape && pageW > pageH) {
    ;[pageW, pageH] = [pageH, pageW]
  }

  const page = doc.addPage([pageW, pageH])
  const margin = 36
  const availW = pageW - 2 * margin
  const availH = pageH - 2 * margin
  const scale = Math.min(availW / width, availH / height)
  const drawW = width * scale
  const drawH = height * scale
  page.drawImage(image, {
    x: (pageW - drawW) / 2,
    y: (pageH - drawH) / 2,
    width: drawW,
    height: drawH,
  })
}

export async function imagesToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const pageSize = typeof options.pageSize === 'string' ? options.pageSize : 'fit-to-image'
  const outputMode = typeof options.outputMode === 'string' ? options.outputMode : 'all-in-one'
  const orientation = typeof options.orientation === 'string' ? options.orientation : 'auto'
  const results: ConversionResult[] = []

  if (outputMode === 'all-in-one') {
    const doc = await PDFDocument.create()
    for (let i = 0; i < files.length; i++) {
      try {
        await embedImagePage(doc, files[i], pageSize, orientation)
      } catch {
        // skip unreadable images and continue building the PDF
      }
      onProgress?.(i, Math.round(((i + 1) / files.length) * 90))
    }
    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
    if (doc.getPageCount() === 0) {
      return [new Error('No images could be embedded')]
    }
    const baseName = files[0].name.replace(/\.[^.]+$/, '')
    const outName = files.length === 1 ? `${baseName}.pdf` : `${baseName}-and-${files.length - 1}-more.pdf`
    results.push(new File([bytes as unknown as Uint8Array<ArrayBuffer>], outName, { type: 'application/pdf' }))
  } else {
    // one-per-image
    for (let i = 0; i < files.length; i++) {
      try {
        const doc = await PDFDocument.create()
        await embedImagePage(doc, files[i], pageSize, orientation)
        const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
        const baseName = files[i].name.replace(/\.[^.]+$/, '')
        results.push(new File([bytes as unknown as Uint8Array<ArrayBuffer>], `${baseName}.pdf`, { type: 'application/pdf' }))
        onProgress?.(i, 100)
      } catch (err) {
        results.push(new Error(err instanceof Error ? err.message : 'Conversion failed'))
      }
    }
  }

  return results
}

// ── PDF to Word ───────────────────────────────────────────────────────────────

export async function pdfToWord(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const pageFrom = typeof options.pageFrom === 'number' ? Math.max(1, options.pageFrom) : 1
  const pageTo = typeof options.pageTo === 'number' ? options.pageTo : 9999
  const includeImages = options.includeImages !== false
  const ocrLanguage = typeof options.ocrLanguage === 'string' ? options.ocrLanguage : 'eng'
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const outFile = await convertPdfToWord(files[i], (pct) => onProgress?.(i, pct), { pageFrom, pageTo, includeImages, ocrLanguage })
      results.push(outFile)
    } catch (err) {
      results.push(new Error(err instanceof Error ? err.message : 'Conversion failed'))
    }
  }

  return results
}

// ── Rotate PDF ────────────────────────────────────────────────────────────────

export async function rotatePdf(
  file: File,
  rotations: Record<number, number>  // pageIndex -> absolute degrees (0|90|180|270)
): Promise<File> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const pages = doc.getPages()
  for (const [idxStr, deg] of Object.entries(rotations)) {
    const idx = Number(idxStr)
    if (idx >= 0 && idx < pages.length) {
      pages[idx].setRotation(degrees(deg))
    }
  }
  const bytes = await doc.save({ useObjectStreams: true })
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([bytes as Uint8Array<ArrayBuffer>], `${baseName}-rotated.pdf`, { type: 'application/pdf' })
}

// ── Reorder PDF Pages ─────────────────────────────────────────────────────────

export async function reorderPdf(
  file: File,
  pageOrder: number[]  // original 0-based page indices in desired output order; duplicates allowed for duplicated pages
): Promise<File> {
  const buffer = await file.arrayBuffer()
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const outDoc = await PDFDocument.create()
  const copied = await outDoc.copyPages(srcDoc, pageOrder)
  for (const page of copied) outDoc.addPage(page)
  const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false })
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([bytes as Uint8Array<ArrayBuffer>], `${baseName}-reordered.pdf`, { type: 'application/pdf' })
}

// ── Redact PDF ────────────────────────────────────────────────────────────────

export interface RedactionRegion {
  page: number      // 0-based page index
  x: number         // 0-1 fraction of rendered page width
  y: number         // 0-1 fraction of rendered page height
  width: number     // 0-1 fraction
  height: number    // 0-1 fraction
  label?: string    // e.g. "SSN", "Email" — for the redaction report (NOT the matched text)
}

export interface RedactionReport {
  fileName: string
  appliedAt: string  // ISO datetime
  count: number
  items: { page: number; label?: string }[]  // page is 1-based in the report
}

export async function redactPdf(
  file: File,
  redactions: RedactionRegion[],
  onProgress?: (pct: number) => void
): Promise<{ file: File; report: RedactionReport }> {
  const buffer = await file.arrayBuffer()
  const pageCount = await getPageCount(buffer.slice(0))

  // Group redactions by page
  const byPage = new Map<number, RedactionRegion[]>()
  for (const r of redactions) {
    if (!byPage.has(r.page)) byPage.set(r.page, [])
    byPage.get(r.page)!.push(r)
  }

  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const outDoc = await PDFDocument.create()
  const renderDpi = 150

  for (let p = 0; p < pageCount; p++) {
    onProgress?.(Math.round((p / pageCount) * 90))
    const pageRedactions = byPage.get(p)

    if (!pageRedactions || pageRedactions.length === 0) {
      // Copy page as-is — text remains selectable, file remains lossless
      const [copied] = await outDoc.copyPages(srcDoc, [p])
      outDoc.addPage(copied)
    } else {
      // Flatten to raster: render → burn black rects → embed as JPEG image
      const jpegBuf = await renderPage(buffer.slice(0), p, renderDpi, 95)
      const srcBlob = new Blob([new Uint8Array(jpegBuf)], { type: 'image/jpeg' })
      const bmp = await createImageBitmap(srcBlob)
      const canvas = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      bmp.close()

      ctx.fillStyle = '#000000'
      for (const r of pageRedactions) {
        ctx.fillRect(
          Math.floor(r.x * canvas.width),
          Math.floor(r.y * canvas.height),
          Math.ceil(r.width * canvas.width),
          Math.ceil(r.height * canvas.height)
        )
      }

      const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 })
      const outBytes = new Uint8Array(await outBlob.arrayBuffer())
      const image = await outDoc.embedJpg(outBytes)
      const page = outDoc.addPage([image.width, image.height])
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    }
  }

  onProgress?.(95)
  const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false })
  onProgress?.(100)

  const baseName = file.name.replace(/\.[^.]+$/, '')
  const outputFile = new File(
    [bytes as Uint8Array<ArrayBuffer>],
    `${baseName}-redacted.pdf`,
    { type: 'application/pdf' }
  )

  const report: RedactionReport = {
    fileName: file.name,
    appliedAt: new Date().toISOString(),
    count: redactions.length,
    items: redactions.map(r => ({ page: r.page + 1, label: r.label })),
  }

  return { file: outputFile, report }
}

// ── PDF to CSV ────────────────────────────────────────────────────────────────

interface StructuredLineBbox { x: number; y: number; w: number; h: number; flags?: number }
interface StructuredSpan { text?: string; bbox?: number[] }
interface StructuredLine {
  spans?: StructuredSpan[]
  text?: string
  x?: number
  y?: number
  bbox?: StructuredLineBbox | number[]
}
interface StructuredBlock { lines?: StructuredLine[] }
interface StructuredPage { blocks?: StructuredBlock[] }

export interface CsvPageResult {
  page: number      // 1-based
  rows: string[][]  // rows[i][j] = cell text
  csv: string       // full CSV string for this page
}

function escapeCsvCell(cell: string): string {
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')) {
    return `"${cell.replace(/"/g, '""')}"`
  }
  return cell
}

function pageToRows(structuredJson: string): string[][] {
  let pageData: StructuredPage
  try { pageData = JSON.parse(structuredJson) } catch { return [] }

  const items: Array<{ text: string; x: number; y: number }> = []
  for (const block of pageData.blocks ?? []) {
    for (const line of block.lines ?? []) {
      // MuPDF 1.27.x puts text, x, y directly on the line object
      const lineText = typeof line.text === 'string' ? line.text.trim() : ''
      if (lineText && typeof line.x === 'number' && typeof line.y === 'number') {
        items.push({ text: lineText, x: line.x, y: line.y })
        continue
      }
      // Fallback for older formats that use span objects
      for (const span of line.spans ?? []) {
        const text = span.text?.trim()
        if (!text || !span.bbox || span.bbox.length < 4) continue
        const [x0, y0, , y1] = span.bbox
        items.push({ text, x: x0, y: (y0 + y1) / 2 })
      }
    }
  }
  if (items.length === 0) return []

  // Sort top-to-bottom, then left-to-right
  items.sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x)

  // MuPDF already segments visual lines correctly: all items on the same visual row share
  // the same y value (or within 3pt for floating-point noise). Use a tight tolerance so
  // distinct rows are never collapsed — the old 2.5× median-gap approach merged all rows
  // into one whenever within-row y-variation was zero (every gap was an inter-row gap,
  // making tolerance > inter-row gap).
  const ROW_TOL = 3
  const rowGroups: Array<typeof items> = []
  let currentRow: typeof items = [items[0]]
  let rowAnchorY = items[0].y

  for (let i = 1; i < items.length; i++) {
    const item = items[i]
    if (item.y - rowAnchorY > ROW_TOL) {
      rowGroups.push(currentRow)
      currentRow = [item]
      rowAnchorY = item.y
    } else {
      currentRow.push(item)
    }
  }
  rowGroups.push(currentRow)

  // Build canonical column positions from ALL rows so blank columns are preserved.
  // Items are considered the same column if within COL_TOL points horizontally.
  const COL_TOL = 10
  const allXs = rowGroups.flatMap(rowItems => rowItems.map(item => item.x)).sort((a, b) => a - b)
  const canonicalCols: number[] = []
  for (const x of allXs) {
    const anchor = canonicalCols[canonicalCols.length - 1]
    if (anchor === undefined || x - anchor > COL_TOL) canonicalCols.push(x)
  }

  return rowGroups.map(rowItems => {
    rowItems.sort((a, b) => a.x - b.x)
    // Group within-row items that share an x position (sub-tolerance ±5 pt)
    const colGroups: Array<{ x: number; texts: string[] }> = []
    for (const item of rowItems) {
      const last = colGroups[colGroups.length - 1]
      if (last && Math.abs(item.x - last.x) <= 5) {
        last.texts.push(item.text)
      } else {
        colGroups.push({ x: item.x, texts: [item.text] })
      }
    }
    // Map each group to its canonical column index, leaving gaps as empty strings
    const cells: string[] = new Array(canonicalCols.length).fill('')
    for (const cg of colGroups) {
      const idx = canonicalCols.findIndex(cx => Math.abs(cg.x - cx) <= COL_TOL)
      if (idx >= 0) cells[idx] = cg.texts.join(' ')
    }
    return cells
  })
}

export async function pdfToCsv(
  file: File,
  pageFrom: number,
  pageTo: number,
  onProgress?: (pct: number) => void
): Promise<CsvPageResult[]> {
  const buffer = await file.arrayBuffer()
  const structuredPages = await extractStructuredText(buffer)
  const pageCount = structuredPages.length

  const from = Math.max(1, Math.min(pageCount, pageFrom))
  const to = Math.max(from, Math.min(pageCount, pageTo))
  const results: CsvPageResult[] = []

  for (let p = from - 1; p < to; p++) {
    const rows = pageToRows(structuredPages[p])
    const csv = rows.length === 0
      ? `# No extractable text on page ${p + 1}\n`
      : rows.map(row => row.map(escapeCsvCell).join(',')).join('\n')
    results.push({ page: p + 1, rows, csv })
    onProgress?.(Math.round(((p + 1 - from) / (to - from + 1)) * 100))
  }

  onProgress?.(100)
  return results
}

// ── Fill PDF Forms ────────────────────────────────────────────────────────────

export interface FormField {
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'dropdown'
  options?: string[]
  defaultValue?: string | boolean
}

export async function getPdfFormFields(file: File): Promise<FormField[]> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const form = doc.getForm()
  const rawFields = form.getFields()

  const fields: FormField[] = []
  for (const field of rawFields) {
    const name = field.getName()
    // pdf-lib bug: when AcroForm parent nodes lack a /T entry, getName() returns
    // strings like "undefined.FieldName" via JS string coercion. Skip fields
    // where every segment is "undefined" — they have no usable identity.
    if (!name || name.split('.').every(s => !s || s === 'undefined')) continue

    if (field instanceof PDFTextField) {
      fields.push({ name, type: 'text', defaultValue: field.getText() ?? '' })
    } else if (field instanceof PDFCheckBox) {
      fields.push({ name, type: 'checkbox', defaultValue: field.isChecked() })
    } else if (field instanceof PDFRadioGroup) {
      const options = field.getOptions()
      fields.push({ name, type: 'radio', options, defaultValue: field.getSelected() ?? '' })
    } else if (field instanceof PDFDropdown) {
      const options = field.getOptions()
      const selected = field.getSelected()
      fields.push({ name, type: 'dropdown', options, defaultValue: selected[0] ?? '' })
    }
    // Unknown field types are silently skipped
  }

  return fields
}

export async function fillPdfForm(
  file: File,
  values: Record<string, string | boolean>,
  flatten: boolean
): Promise<File> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const form = doc.getForm()

  // Build a name→field map to avoid form.getField() throwing on missing names
  const fieldMap = new Map(form.getFields().map(f => [f.getName(), f]))

  for (const [name, value] of Object.entries(values)) {
    const field = fieldMap.get(name)
    if (!field) continue
    try {
      if (field instanceof PDFTextField) {
        field.setText(value as string)
      } else if (field instanceof PDFCheckBox) {
        if (value as boolean) field.check(); else field.uncheck()
      } else if (field instanceof PDFRadioGroup) {
        if (value) field.select(value as string)
      } else if (field instanceof PDFDropdown) {
        if (value) field.select(value as string)
      }
    } catch {
      // Skip fields that fail (e.g., locked or malformed)
    }
  }

  if (flatten) form.flatten()

  const bytes = await doc.save({ useObjectStreams: true })
  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([bytes as Uint8Array<ArrayBuffer>], `${baseName}-filled.pdf`, { type: 'application/pdf' })
}

function ocrTextToRows(text: string): string[][] {
  return text
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      // Split on tabs or 2+ spaces to recover columnar structure from scanned tables
      const cols = line.trim().split(/\t|\s{2,}/).map(c => c.trim()).filter(c => c.length > 0)
      return cols.length > 1 ? cols : [line.trim()]
    })
}

// ── PDF → Excel ───────────────────────────────────────────────────────────────

export async function pdfToExcel(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const XLSX = await import('xlsx')
  const results: ConversionResult[] = []
  const ocrLanguage = typeof options.ocrLanguage === 'string' ? options.ocrLanguage : 'eng'

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      onProgress?.(i, 0)

      try {
        const buffer = await file.arrayBuffer()
        onProgress?.(i, 10)

        const structuredPages = await extractStructuredText(buffer)
        onProgress?.(i, 50)

        const wb = XLSX.utils.book_new()
        const combineSheets = !!(options.combineSheets)

        if (combineSheets) {
          const allRows: string[][] = []
          for (let p = 0; p < structuredPages.length; p++) {
            let rows = pageToRows(structuredPages[p])
            if (rows.length === 0) {
              const pngBuffer = await renderPagePng(buffer, p, 300)
              const blob = new Blob([pngBuffer], { type: 'image/png' })
              const ocrResult = await recognizePage(blob, ocrLanguage)
              rows = ocrTextToRows(ocrResult.text)
            }
            if (rows.length > 0) {
              if (allRows.length > 0) allRows.push([])
              allRows.push(...rows)
            } else {
              if (allRows.length > 0) allRows.push([])
              allRows.push(['(no extractable text)'])
            }
            onProgress?.(i, Math.round(50 + (40 * (p + 1)) / structuredPages.length))
          }
          const ws = XLSX.utils.aoa_to_sheet(allRows)
          XLSX.utils.book_append_sheet(wb, ws, 'All Pages')
        } else {
          for (let p = 0; p < structuredPages.length; p++) {
            let rows = pageToRows(structuredPages[p])
            if (rows.length === 0) {
              const pngBuffer = await renderPagePng(buffer, p, 300)
              const blob = new Blob([pngBuffer], { type: 'image/png' })
              const ocrResult = await recognizePage(blob, ocrLanguage)
              rows = ocrTextToRows(ocrResult.text)
            }
            const sheetRows = rows.length > 0 ? rows : [['(no extractable text)']]
            const ws = XLSX.utils.aoa_to_sheet(sheetRows)
            XLSX.utils.book_append_sheet(wb, ws, `Page ${p + 1}`)
            onProgress?.(i, Math.round(50 + (40 * (p + 1)) / structuredPages.length))
          }
        }

        const xlsxBuffer: ArrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
        const outName = file.name.replace(/\.pdf$/i, '') + '.xlsx'
        results.push(new File([xlsxBuffer], outName, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }))
        onProgress?.(i, 100)
      } catch (err) {
        results.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
  } finally {
    await terminateOcrWorker()
  }

  return results
}

// ── Watermark PDF ─────────────────────────────────────────────────────────────

function resolveWatermarkPosition(
  position: string,
  pw: number,
  ph: number,
  itemW: number,
  itemH: number,
  rotationDeg = 0
): [number, number] {
  const rotRad = rotationDeg * (Math.PI / 180)
  const col = position.includes('left') ? 0 : position.includes('right') ? 2 : 1
  const row = position.includes('bottom') ? 0 : position.includes('top') ? 2 : 1

  const cx =
    col === 0 ? pw * 0.1 + itemW / 2 :
    col === 2 ? pw * 0.9 - itemW / 2 :
    pw / 2
  const cy =
    row === 0 ? ph * 0.1 + itemH / 2 :
    row === 2 ? ph * 0.9 - itemH / 2 :
    ph / 2

  // Back-compute drawing origin so item center lands at (cx,cy) after CCW rotation
  const x = cx - (itemW / 2) * Math.cos(rotRad) + (itemH / 2) * Math.sin(rotRad)
  const y = cy - (itemW / 2) * Math.sin(rotRad) - (itemH / 2) * Math.cos(rotRad)
  return [x, y]
}

function parseHexColor(hex: string): [number, number, number] {
  const clean = (hex ?? '#cc0000').replace(/^#/, '').padEnd(6, '0')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return [
    isNaN(r) ? 0.8 : r / 255,
    isNaN(g) ? 0 : g / 255,
    isNaN(b) ? 0 : b / 255,
  ]
}

// Vector path: pdf-lib modifies the existing PDF (preserves text searchability).
// Throws on complex/large PDFs with malformed internal objects.
async function watermarkPdfVector(
  file: File,
  options: ToolOptions,
  onProgress?: (pct: number) => void
): Promise<File> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
    updateMetadata: false,
  })
  const pages = doc.getPages()
  if (pages.length === 0) throw new Error('PDF has no pages.')

  const wmType = (options.watermarkType as string) ?? 'text'
  const applyTo = (options.applyTo as string) ?? 'all'
  const position = (options.position as string) ?? 'center'
  const opacity = Math.min(1, Math.max(0, ((options.opacity as number) ?? 30) / 100))
  const rotation = (options.rotation as number) ?? 45
  const layer = (options.layer as string) ?? 'above'
  const targetIndices = applyTo === 'first' ? [0] : pages.map((_, idx) => idx)

  if (wmType === 'text') {
    const text = (options.watermarkText as string) ?? 'CONFIDENTIAL'
    const sizeKey = (options.fontSize as string) ?? 'medium'
    const fontSize = sizeKey === 'small' ? 24 : sizeKey === 'large' ? 72 : 48
    const [r, g, b] = parseHexColor(options.textColor as string)
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const textWidth = font.widthOfTextAtSize(text, fontSize)

    for (let j = 0; j < targetIndices.length; j++) {
      const page = pages[targetIndices[j]]
      const { width: pw, height: ph } = page.getSize()
      const [tx, ty] = resolveWatermarkPosition(position, pw, ph, textWidth, fontSize, rotation)
      page.drawText(text, {
        x: tx, y: ty, size: fontSize, font,
        color: rgb(r, g, b),
        opacity: layer === 'behind' ? opacity * 0.6 : opacity,
        rotate: degrees(rotation),
      })
      onProgress?.(Math.round(5 + ((j + 1) / targetIndices.length) * 80))
    }
  } else {
    const imageFile = options.watermarkImage as File | null
    if (!imageFile) throw new Error('No watermark image provided.')
    const imgBuffer = await imageFile.arrayBuffer()
    const isPng = imageFile.type === 'image/png' || imageFile.name.toLowerCase().endsWith('.png')
    const embedded = isPng ? await doc.embedPng(imgBuffer) : await doc.embedJpg(imgBuffer)
    const imgSizePct = Math.min(100, Math.max(5, (options.imageSizePct as number) ?? 30)) / 100

    for (let j = 0; j < targetIndices.length; j++) {
      const page = pages[targetIndices[j]]
      const { width: pw, height: ph } = page.getSize()
      const imgW = pw * imgSizePct
      const imgH = (embedded.height / embedded.width) * imgW
      const [ix, iy] = resolveWatermarkPosition(position, pw, ph, imgW, imgH, rotation)
      page.drawImage(embedded, { x: ix, y: iy, width: imgW, height: imgH, opacity, rotate: degrees(rotation) })
      onProgress?.(Math.round(5 + ((j + 1) / targetIndices.length) * 80))
    }
  }

  onProgress?.(90)
  const pdfBytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  const outName = file.name.replace(/\.pdf$/i, '') + '-watermarked.pdf'
  return new File([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], outName, { type: 'application/pdf' })
}

// Raster fallback: mupdf renders each page → Canvas 2D draws watermark → new PDF.
// Works for any PDF regardless of complexity. Loses text searchability.
async function watermarkPdfRaster(
  file: File,
  options: ToolOptions,
  onProgress?: (pct: number) => void
): Promise<File> {
  const buffer = await file.arrayBuffer()
  const pageCount = await getPageCount(buffer)
  if (pageCount === 0) throw new Error('PDF has no pages.')

  const wmType = (options.watermarkType as string) ?? 'text'
  const applyTo = (options.applyTo as string) ?? 'all'
  const position = (options.position as string) ?? 'center'
  const opacity = Math.min(1, Math.max(0, ((options.opacity as number) ?? 30) / 100))
  const rotationDeg = (options.rotation as number) ?? 45

  // Pre-load image watermark once
  let imageBitmap: ImageBitmap | null = null
  if (wmType === 'image') {
    const imageFile = options.watermarkImage as File | null
    if (!imageFile) throw new Error('No watermark image provided.')
    const blob = new Blob([await imageFile.arrayBuffer()], { type: imageFile.type })
    imageBitmap = await createImageBitmap(blob)
  }

  const doc = await PDFDocument.create()

  for (let p = 0; p < pageCount; p++) {
    const applyWatermark = applyTo === 'all' || p === 0
    const jpegBuffer = await renderPage(buffer, p, 150, 92)
    const jpegBytes = new Uint8Array(jpegBuffer)

    if (applyWatermark) {
      const bmp = await createImageBitmap(new Blob([jpegBytes], { type: 'image/jpeg' }))
      const canvas = new OffscreenCanvas(bmp.width, bmp.height)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bmp, 0, 0)
      bmp.close()

      // Resolve visual center in canvas space (top-left origin, Y down)
      const col = position.includes('left') ? 0 : position.includes('right') ? 2 : 1
      const row = position.includes('top') ? 0 : position.includes('bottom') ? 2 : 1
      const wmCx =
        col === 0 ? canvas.width * 0.15 :
        col === 2 ? canvas.width * 0.85 :
        canvas.width / 2
      const wmCy =
        row === 0 ? canvas.height * 0.15 :
        row === 2 ? canvas.height * 0.85 :
        canvas.height / 2

      ctx.save()
      ctx.globalAlpha = opacity
      ctx.translate(wmCx, wmCy)
      // Canvas Y-axis is inverted vs PDF, so negate rotation to match visual direction
      ctx.rotate(-rotationDeg * (Math.PI / 180))

      if (wmType === 'text') {
        const text = (options.watermarkText as string) ?? 'CONFIDENTIAL'
        const sizeKey = (options.fontSize as string) ?? 'medium'
        const fontPx =
          sizeKey === 'small' ? Math.round(canvas.width * 0.06) :
          sizeKey === 'large' ? Math.round(canvas.width * 0.18) :
          Math.round(canvas.width * 0.12)
        const hexColor = (options.textColor as string) ?? '#cc0000'
        ctx.font = `bold ${fontPx}px Helvetica, Arial, sans-serif`
        ctx.fillStyle = /^#[0-9a-fA-F]{3,6}$/.test(hexColor) ? hexColor : '#cc0000'
        const textW = ctx.measureText(text).width
        ctx.fillText(text, -textW / 2, fontPx / 3)
      } else if (imageBitmap) {
        const imgSizePct = Math.min(100, Math.max(5, (options.imageSizePct as number) ?? 30)) / 100
        const imgW = canvas.width * imgSizePct
        const imgH = (imageBitmap.height / imageBitmap.width) * imgW
        ctx.drawImage(imageBitmap, -imgW / 2, -imgH / 2, imgW, imgH)
      }

      ctx.restore()

      const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
      const outBytes = new Uint8Array(await outBlob.arrayBuffer())
      const image = await doc.embedJpg(outBytes)
      const page = doc.addPage([image.width, image.height])
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    } else {
      const image = await doc.embedJpg(jpegBytes)
      const page = doc.addPage([image.width, image.height])
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
    }

    onProgress?.(Math.round(((p + 1) / pageCount) * 90))
  }

  imageBitmap?.close()
  const pdfBytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  const outName = file.name.replace(/\.pdf$/i, '') + '-watermarked.pdf'
  return new File([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], outName, { type: 'application/pdf' })
}

export async function watermarkPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i, 0)
    try {
      // Vector path first: faster, preserves text searchability
      const result = await watermarkPdfVector(file, options, (pct) => onProgress?.(i, pct))
      results.push(result)
    } catch {
      // Raster fallback: mupdf renders pages, Canvas 2D draws watermark
      // Works for any PDF complexity/size including large textbooks
      try {
        const result = await watermarkPdfRaster(file, options, (pct) => onProgress?.(i, pct))
        results.push(result)
      } catch (err) {
        results.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }

  return results
}

// ── PDF → PowerPoint ──────────────────────────────────────────────────────────

export async function pdfToPptx(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const PptxGenJS = (await import('pptxgenjs')).default
  const results: ConversionResult[] = []

  const dpiMap: Record<string, number> = { '72': 72, '150': 150, '300': 300 }
  const dpi = dpiMap[(options.dpi as string) ?? '150'] ?? 150
  const slideSize = (options.slideSize as string) ?? '16:9'

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i, 0)

    try {
      const buffer = await file.arrayBuffer()
      const pageCount = await getPageCount(buffer)
      onProgress?.(i, 5)

      const prs = new PptxGenJS()
      if (slideSize === '4:3') {
        (prs as any).layout = 'LAYOUT_4x3'
      } else {
        (prs as any).layout = 'LAYOUT_16x9'
      }

      // Slide dimensions in inches
      const slideW = 10
      const slideH = slideSize === '4:3' ? 7.5 : 5.625

      for (let p = 0; p < pageCount; p++) {
        const jpegBuffer = await renderPage(buffer, p, dpi, 85)
        const jpegBytes = new Uint8Array(jpegBuffer)
        const jpegBlob = new Blob([jpegBytes], { type: 'image/jpeg' })
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(jpegBlob)
        })

        // Read rendered image dimensions to compute contain-fit (letterbox)
        const { imgW, imgH } = await new Promise<{ imgW: number; imgH: number }>((resolve) => {
          const img = new window.Image()
          img.onload = () => resolve({ imgW: img.naturalWidth, imgH: img.naturalHeight })
          img.src = dataUrl
        })

        const imgAspect = imgW / imgH
        const slideAspect = slideW / slideH
        let fitW: number, fitH: number, fitX: number, fitY: number
        if (imgAspect > slideAspect) {
          fitW = slideW
          fitH = slideW / imgAspect
          fitX = 0
          fitY = (slideH - fitH) / 2
        } else {
          fitH = slideH
          fitW = slideH * imgAspect
          fitX = (slideW - fitW) / 2
          fitY = 0
        }

        const slide = prs.addSlide()
        slide.background = { color: 'FFFFFF' }
        slide.addImage({
          data: dataUrl,
          x: fitX,
          y: fitY,
          w: fitW,
          h: fitH,
        })

        onProgress?.(i, Math.round(5 + (90 * (p + 1)) / pageCount))
      }

      const base64 = (await prs.write({ outputType: 'base64' })) as string
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let b = 0; b < binary.length; b++) {
        bytes[b] = binary.charCodeAt(b)
      }

      const outName = file.name.replace(/\.pdf$/i, '') + '.pptx'
      results.push(
        new File([bytes.buffer as ArrayBuffer], outName, {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        })
      )
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

// ── Page Range Parser ─────────────────────────────────────────────────────────

export function parsePageRanges(input: string, pageCount: number): number[] {
  const indices = new Set<number>()
  const parts = input.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) throw new Error('Page range is empty.')

  for (const part of parts) {
    if (part.includes('-')) {
      const dashIdx = part.indexOf('-')
      const fromStr = part.slice(0, dashIdx).trim()
      const toStr = part.slice(dashIdx + 1).trim()
      const from = parseInt(fromStr, 10)
      const to = parseInt(toStr, 10)
      if (isNaN(from) || isNaN(to) || from < 1 || to < from) throw new Error(`Invalid range: "${part}".`)
      for (let p = from; p <= to; p++) {
        if (p >= 1 && p <= pageCount) indices.add(p - 1)
      }
    } else {
      const n = parseInt(part, 10)
      if (isNaN(n) || n < 1) throw new Error(`Invalid page number: "${part}".`)
      if (n <= pageCount) indices.add(n - 1)
    }
  }

  if (indices.size === 0) {
    throw new Error(`No valid pages found. This PDF has ${pageCount} page${pageCount !== 1 ? 's' : ''}.`)
  }
  return Array.from(indices).sort((a, b) => a - b)
}

// ── Extract Pages ─────────────────────────────────────────────────────────────

export async function extractPages(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const pageRange = (options.pageRange as string) ?? '1'
  const separatePages = options.separatePages === true || options.separatePages === 'true'

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const pageCount = srcDoc.getPageCount()
      const indices = parsePageRanges(pageRange, pageCount)
      const baseName = files[i].name.replace(/\.[^.]+$/, '')

      onProgress?.(i, 20)

      if (separatePages) {
        for (let j = 0; j < indices.length; j++) {
          const outDoc = await PDFDocument.create()
          const [copied] = await outDoc.copyPages(srcDoc, [indices[j]])
          outDoc.addPage(copied)
          const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false })
          const outName = `${baseName}-page-${indices[j] + 1}.pdf`
          results.push(new File([bytes as Uint8Array<ArrayBuffer>], outName, { type: 'application/pdf' }))
          onProgress?.(i, Math.round(20 + ((j + 1) / indices.length) * 75))
        }
      } else {
        const outDoc = await PDFDocument.create()
        const copied = await outDoc.copyPages(srcDoc, indices)
        for (const page of copied) outDoc.addPage(page)
        const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false })
        const outName = `${baseName}-extracted.pdf`
        results.push(new File([bytes as Uint8Array<ArrayBuffer>], outName, { type: 'application/pdf' }))
        onProgress?.(i, 95)
      }

      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

// ── Delete Pages ──────────────────────────────────────────────────────────────

export async function deletePages(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const pageRange = (options.pageRange as string) ?? '1'

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const pageCount = srcDoc.getPageCount()
      const deleteSet = new Set(parsePageRanges(pageRange, pageCount))

      const keepIndices = Array.from({ length: pageCount }, (_, k) => k).filter(k => !deleteSet.has(k))
      if (keepIndices.length === 0) throw new Error('Cannot delete all pages from the PDF.')

      onProgress?.(i, 20)
      const outDoc = await PDFDocument.create()
      const copied = await outDoc.copyPages(srcDoc, keepIndices)
      for (const page of copied) outDoc.addPage(page)
      const bytes = await outDoc.save({ useObjectStreams: true, addDefaultPage: false })
      const outName = files[i].name.replace(/\.pdf$/i, '') + '-trimmed.pdf'
      results.push(new File([bytes as Uint8Array<ArrayBuffer>], outName, { type: 'application/pdf' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

// ── Crop PDF ──────────────────────────────────────────────────────────────────

const MM_TO_PT = 2.8346

export async function cropPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const preset = (options.preset as string) ?? '10mm'
  let topMm = 10, rightMm = 10, bottomMm = 10, leftMm = 10

  if (preset === 'custom') {
    topMm = typeof options.topMm === 'number' ? options.topMm : 10
    rightMm = typeof options.rightMm === 'number' ? options.rightMm : 10
    bottomMm = typeof options.bottomMm === 'number' ? options.bottomMm : 10
    leftMm = typeof options.leftMm === 'number' ? options.leftMm : 10
  } else {
    const mm = parseFloat(preset)
    if (!isNaN(mm)) { topMm = rightMm = bottomMm = leftMm = mm }
  }

  const topPt = topMm * MM_TO_PT
  const rightPt = rightMm * MM_TO_PT
  const bottomPt = bottomMm * MM_TO_PT
  const leftPt = leftMm * MM_TO_PT

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const pages = doc.getPages()

      for (const page of pages) {
        const mb = page.getMediaBox()
        const newX = mb.x + leftPt
        const newY = mb.y + bottomPt
        const newW = mb.width - leftPt - rightPt
        const newH = mb.height - topPt - bottomPt
        if (newW <= 0 || newH <= 0) throw new Error('Margins are too large for the page size.')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        page.node.set(PDFName.of('CropBox'), doc.context.obj([newX, newY, newX + newW, newY + newH]) as any)
      }

      onProgress?.(i, 80)
      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      const outName = files[i].name.replace(/\.pdf$/i, '') + '-cropped.pdf'
      results.push(new File([bytes as Uint8Array<ArrayBuffer>], outName, { type: 'application/pdf' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

// ── Add Page Numbers ──────────────────────────────────────────────────────────

export async function addPageNumbers(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []

  const position = (options.position as string) ?? 'bottom-center'
  const format = (options.format as string) ?? 'Page N of T'
  const fontSize = typeof options.fontSize === 'number' ? Math.max(6, Math.min(24, options.fontSize)) : 10
  const startNumber = typeof options.startNumber === 'number' ? Math.max(1, options.startNumber) : 1
  const MARGIN = typeof options.margin === 'number' ? Math.max(10, Math.min(100, options.margin)) : 30

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      const total = pages.length

      for (let p = 0; p < pages.length; p++) {
        const page = pages[p]
        const { width, height } = page.getSize()
        const pageNum = startNumber + p

        const label = format
          .replace('N', String(pageNum))
          .replace('T', String(total + startNumber - 1))

        const textWidth = font.widthOfTextAtSize(label, fontSize)

        let x: number, y: number
        const isTop = position.startsWith('top')
        const isLeft = position.endsWith('left')
        const isRight = position.endsWith('right')

        if (isLeft) x = MARGIN
        else if (isRight) x = width - textWidth - MARGIN
        else x = (width - textWidth) / 2

        if (isTop) y = height - MARGIN - fontSize
        else y = MARGIN

        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0, 0, 0), opacity: 1 })
        onProgress?.(i, Math.round(5 + ((p + 1) / pages.length) * 85))
      }

      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
      const outName = files[i].name.replace(/\.pdf$/i, '') + '-numbered.pdf'
      results.push(new File([bytes as Uint8Array<ArrayBuffer>], outName, { type: 'application/pdf' }))
      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

// ── Extract Images ────────────────────────────────────────────────────────────

export async function extractImages(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = []
  const mode = (options.mode as string) ?? 'embedded'
  const dpi = typeof options.dpi === 'number' ? Math.max(72, Math.min(300, options.dpi)) : 150

  for (let i = 0; i < files.length; i++) {
    try {
      onProgress?.(i, 5)
      const buffer = await files[i].arrayBuffer()
      const baseName = files[i].name.replace(/\.[^.]+$/, '')

      if (mode === 'rasterize') {
        const pageCount = await getPageCount(buffer)
        const padLen = String(pageCount).length
        const zipEntries: Record<string, Uint8Array> = {}

        for (let p = 0; p < pageCount; p++) {
          const pngBuffer = await renderPagePng(buffer, p, dpi)
          const name = `${baseName}/page-${String(p + 1).padStart(padLen, '0')}.png`
          zipEntries[name] = new Uint8Array(pngBuffer)
          onProgress?.(i, Math.round(10 + ((p + 1) / pageCount) * 80))
        }

        const zipped = zipSync(zipEntries)
        const outName = `${baseName}-pages.zip`
        results.push(new File([zipped], outName, { type: 'application/zip' }))
      } else {
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
        const context = doc.context
        const zipEntries: Record<string, Uint8Array> = {}
        let imgCount = 0

        for (const [, obj] of context.enumerateIndirectObjects()) {
          if (!(obj instanceof PDFRawStream)) continue
          const subtype = obj.dict.get(PDFName.of('Subtype'))
          if (subtype?.toString() !== '/Image') continue
          const filter = obj.dict.get(PDFName.of('Filter'))
          if (filter?.toString() !== '/DCTDecode') continue
          imgCount++
          const padded = String(imgCount).padStart(3, '0')
          zipEntries[`${baseName}/img-${padded}.jpg`] = obj.contents
        }

        if (imgCount === 0) {
          throw new Error('No embedded JPEG images found. Try "Render pages as PNG" mode instead.')
        }

        onProgress?.(i, 80)
        const zipped = zipSync(zipEntries)
        const outName = `${baseName}-images.zip`
        results.push(new File([zipped], outName, { type: 'application/zip' }))
      }

      onProgress?.(i, 100)
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return results
}

// ── Shared Text Rendering Engine ──────────────────────────────────────────────

export interface RenderToken {
  type:
    | 'heading'
    | 'paragraph'
    | 'code-block'
    | 'list-item'
    | 'rule'
    | 'blockquote'
    | 'space'
    | 'table'
    | 'image'
    | 'task-item'
    | 'page-break'
    | 'cover'
    | 'toc'
    | 'callout'
  text: string
  level?: 1 | 2 | 3 | 4 | 5 | 6
  ordered?: boolean
  index?: number
  inline?: Array<{
    text: string
    bold?: boolean
    italic?: boolean
    code?: boolean
    link?: string
    strike?: boolean
  }>
  // table
  headers?: string[]
  rows?: string[][]
  // task-item
  checked?: boolean
  // image
  src?: string
  alt?: string
  width?: number
  height?: number
  // code-block extras
  lang?: string
  highlights?: Array<{ text: string; color?: [number, number, number]; bold?: boolean; italic?: boolean }>
  // callout
  variant?: 'note' | 'warning' | 'tip' | 'danger'
  // cover
  title?: string
  author?: string
  date?: string
  subtitle?: string
  // toc
  entries?: Array<{ level: number; text: string; page?: number }>
  // list nesting
  depth?: number
}

export type PdfTheme = 'classic' | 'modern' | 'mono' | 'compact'

export async function renderTokensToPdf(
  tokens: RenderToken[],
  options: {
    pageSize: 'A4' | 'Letter'
    fontSize: number
    theme?: PdfTheme
    marginMm?: number
    accentColor?: [number, number, number]
  }
): Promise<Uint8Array> {
  const pageWidth = options.pageSize === 'A4' ? 595.28 : 612
  const pageHeight = options.pageSize === 'A4' ? 841.89 : 792
  const marginPt = options.marginMm ? (options.marginMm * 72) / 25.4 : 60
  const margin = marginPt
  const scale = options.fontSize / 12
  const theme: PdfTheme = options.theme ?? 'modern'
  const accent = options.accentColor ?? [0.11, 0.31, 0.85]

  const doc = await PDFDocument.create()

  // Theme font selection
  const [bodyFont, boldFont, italicFont, boldItalicFont, headingFont] =
    theme === 'classic'
      ? [
          StandardFonts.TimesRoman,
          StandardFonts.TimesRomanBold,
          StandardFonts.TimesRomanItalic,
          StandardFonts.TimesRomanBoldItalic,
          StandardFonts.TimesRomanBold,
        ]
      : theme === 'mono'
        ? [
            StandardFonts.Courier,
            StandardFonts.CourierBold,
            StandardFonts.CourierOblique,
            StandardFonts.CourierBoldOblique,
            StandardFonts.CourierBold,
          ]
        : [
            StandardFonts.Helvetica,
            StandardFonts.HelveticaBold,
            StandardFonts.HelveticaOblique,
            StandardFonts.HelveticaBoldOblique,
            StandardFonts.HelveticaBold,
          ]

  const fontHeading = await doc.embedFont(headingFont)
  const fontBody = await doc.embedFont(bodyFont)
  const fontBold = await doc.embedFont(boldFont)
  const fontItalic = await doc.embedFont(italicFont)
  const fontBoldItalic = await doc.embedFont(boldItalicFont)
  const fontCode = await doc.embedFont(StandardFonts.Courier)
  const fontCodeBold = await doc.embedFont(StandardFonts.CourierBold)

  type EmbeddedFont = Awaited<ReturnType<typeof doc.embedFont>>

  const pages: ReturnType<typeof doc.addPage>[] = []
  let cursorY = pageHeight - margin

  function addPage() {
    const p = doc.addPage([pageWidth, pageHeight])
    pages.push(p)
    cursorY = pageHeight - margin
    return p
  }

  function currentPage() {
    if (pages.length === 0) return addPage()
    return pages[pages.length - 1]
  }

  function ensurePage(neededHeight: number) {
    if (pages.length === 0 || cursorY - neededHeight < margin) {
      addPage()
    }
  }

  function wrapText(text: string, font: EmbeddedFont, size: number, maxWidth: number): string[] {
    if (!text?.trim()) return []
    const words = sanitizePdfText(text).split(' ').filter(Boolean)
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const test = current ? current + ' ' + word : word
      const w = font.widthOfTextAtSize(test, size)
      if (w > maxWidth && current) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
    return lines
  }

  addPage()

  for (const token of tokens) {
    if (token.type === 'space') {
      cursorY -= 8 * scale
      continue
    }

    if (token.type === 'rule') {
      ensurePage(16 * scale)
      const page = currentPage()
      page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: pageWidth - margin, y: cursorY },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      })
      cursorY -= 8 * scale
      continue
    }

    if (token.type === 'heading') {
      const lvl = token.level ?? 1
      const hSize = lvl === 1 ? 24 * scale : lvl === 2 ? 20 * scale : 16 * scale
      const lineH = hSize * 1.4
      const maxW = pageWidth - 2 * margin
      const lines = wrapText(token.text, fontHeading, hSize, maxW)
      const totalH = 8 * scale + lines.length * lineH + 4 * scale
      ensurePage(totalH)
      cursorY -= 8 * scale
      for (const line of lines) {
        currentPage().drawText(line, { x: margin, y: cursorY, font: fontHeading, size: hSize, color: rgb(0, 0, 0) })
        cursorY -= lineH
      }
      cursorY -= 4 * scale
      continue
    }

    if (token.type === 'paragraph') {
      const bodySize = options.fontSize
      const lineH = bodySize * 1.4
      const codeSize = 10 * scale
      const maxW = pageWidth - 2 * margin

      if (token.inline && token.inline.length > 0) {
        let lineBuffer: Array<{ text: string; font: EmbeddedFont; size: number }> = []

        const lineBufferWidth = () =>
          lineBuffer.reduce((acc, s) => acc + s.font.widthOfTextAtSize(s.text, s.size), 0)

        const flushLine = () => {
          ensurePage(lineH)
          const page = currentPage()
          let x = margin
          for (const span of lineBuffer) {
            page.drawText(span.text, { x, y: cursorY, font: span.font, size: span.size, color: rgb(0, 0, 0) })
            x += span.font.widthOfTextAtSize(span.text, span.size)
          }
          cursorY -= lineH
          lineBuffer = []
        }

        for (const span of token.inline) {
          const f: EmbeddedFont = span.code ? fontCode : span.bold ? fontBold : span.italic ? fontItalic : fontBody
          const sz = span.code ? codeSize : bodySize
          const words = sanitizePdfText(span.text).split(' ').filter(Boolean)
          for (let wi = 0; wi < words.length; wi++) {
            const word = words[wi]
            const piece = wi < words.length - 1 ? word + ' ' : word
            const w = f.widthOfTextAtSize(piece, sz)
            if (margin + lineBufferWidth() + w > pageWidth - margin && lineBuffer.length > 0) {
              flushLine()
            }
            lineBuffer.push({ text: piece, font: f, size: sz })
          }
        }
        if (lineBuffer.length > 0) {
          flushLine()
        }
      } else {
        const lines = wrapText(token.text, fontBody, bodySize, maxW)
        for (const line of lines) {
          ensurePage(lineH)
          currentPage().drawText(line, { x: margin, y: cursorY, font: fontBody, size: bodySize, color: rgb(0, 0, 0) })
          cursorY -= lineH
        }
      }
      cursorY -= 8 * scale
      continue
    }

    if (token.type === 'code-block') {
      const codeSize = 10 * scale
      const lineH = codeSize * 1.4
      const indent = 20
      const maxW = pageWidth - 2 * margin - indent
      const rawLines = token.text.split('\n')
      const allLines: string[] = []
      for (const rl of rawLines) {
        const wrapped = wrapText(rl || ' ', fontCode, codeSize, maxW)
        allLines.push(...wrapped)
      }
      for (const line of allLines) {
        ensurePage(lineH + 6)
        const page = currentPage()
        page.drawRectangle({
          x: margin,
          y: cursorY - 2,
          width: pageWidth - 2 * margin,
          height: lineH + 4,
          color: rgb(0.95, 0.95, 0.95),
        })
        page.drawText(line, { x: margin + 10, y: cursorY, font: fontCode, size: codeSize, color: rgb(0, 0, 0) })
        cursorY -= lineH
      }
      cursorY -= 8 * scale
      continue
    }

    if (token.type === 'list-item') {
      const listSize = 10 * scale
      const lineH = listSize * 1.4
      const indent = 20
      const prefix = token.ordered ? `${token.index ?? 1}. ` : '• '
      const maxW = pageWidth - margin - indent
      const lines = wrapText(token.text, fontBody, listSize, maxW)
      for (let li = 0; li < lines.length; li++) {
        ensurePage(lineH)
        const page = currentPage()
        const txt = li === 0 ? prefix + lines[li] : '  ' + lines[li]
        page.drawText(txt, { x: margin + indent, y: cursorY, font: fontBody, size: listSize, color: rgb(0, 0, 0) })
        cursorY -= lineH
      }
      continue
    }

    if (token.type === 'blockquote') {
      const bqSize = 11 * scale
      const lineH = bqSize * 1.5
      const indent = 24
      const maxW = pageWidth - 2 * margin - indent
      const lines = wrapText(token.text, fontItalic, bqSize, maxW)
      const startY = cursorY
      for (const line of lines) {
        ensurePage(lineH)
        const page = currentPage()
        page.drawLine({
          start: { x: margin + 6, y: cursorY + bqSize },
          end: { x: margin + 6, y: cursorY - 2 },
          thickness: 3,
          color: rgb(accent[0] * 0.8, accent[1] * 0.8, accent[2] * 0.8),
        })
        page.drawText(line, {
          x: margin + indent,
          y: cursorY,
          font: fontItalic,
          size: bqSize,
          color: rgb(0.35, 0.35, 0.35),
        })
        cursorY -= lineH
      }
      // suppress unused warning when only one line
      void startY
      cursorY -= 8 * scale
      continue
    }

    if (token.type === 'page-break') {
      addPage()
      continue
    }

    if (token.type === 'cover') {
      // Cover page: title centered, subtitle, author, date
      const p = pages.length === 0 ? addPage() : (addPage(), currentPage())
      const titleSize = 32 * scale
      const subSize = 16 * scale
      const metaSize = 11 * scale
      const cx = pageWidth / 2
      let y = pageHeight * 0.55
      const title = sanitizePdfText(token.title ?? token.text ?? 'Untitled')
      const titleLines = wrapText(title, fontHeading, titleSize, pageWidth - 2 * margin)
      for (const line of titleLines) {
        const w = fontHeading.widthOfTextAtSize(line, titleSize)
        p.drawText(line, { x: cx - w / 2, y, font: fontHeading, size: titleSize, color: rgb(0.08, 0.08, 0.12) })
        y -= titleSize * 1.2
      }
      if (token.subtitle) {
        y -= 10
        const sub = sanitizePdfText(token.subtitle)
        const subLines = wrapText(sub, fontItalic, subSize, pageWidth - 2 * margin)
        for (const line of subLines) {
          const w = fontItalic.widthOfTextAtSize(line, subSize)
          p.drawText(line, { x: cx - w / 2, y, font: fontItalic, size: subSize, color: rgb(0.35, 0.35, 0.4) })
          y -= subSize * 1.3
        }
      }
      // Accent line
      y -= 30
      p.drawLine({
        start: { x: cx - 40, y },
        end: { x: cx + 40, y },
        thickness: 2,
        color: rgb(accent[0], accent[1], accent[2]),
      })
      y -= 30
      if (token.author) {
        const a = sanitizePdfText(`by ${token.author}`)
        const w = fontBody.widthOfTextAtSize(a, metaSize)
        p.drawText(a, { x: cx - w / 2, y, font: fontBody, size: metaSize, color: rgb(0.3, 0.3, 0.35) })
        y -= metaSize * 1.5
      }
      if (token.date) {
        const d = sanitizePdfText(token.date)
        const w = fontBody.widthOfTextAtSize(d, metaSize)
        p.drawText(d, { x: cx - w / 2, y, font: fontBody, size: metaSize, color: rgb(0.5, 0.5, 0.55) })
      }
      // Force next content onto a fresh page
      cursorY = margin - 1
      continue
    }

    if (token.type === 'toc') {
      ensurePage(60 * scale)
      const title = 'Table of Contents'
      currentPage().drawText(title, {
        x: margin,
        y: cursorY,
        font: fontHeading,
        size: 18 * scale,
        color: rgb(0.08, 0.08, 0.12),
      })
      cursorY -= 22 * scale
      const entries = token.entries ?? []
      for (const entry of entries) {
        const indent = (entry.level - 1) * 16
        const size = entry.level === 1 ? 12 * scale : 11 * scale
        const lineH = size * 1.6
        ensurePage(lineH)
        const label = sanitizePdfText(entry.text)
        const truncated =
          label.length > 80 ? label.slice(0, 77) + '...' : label
        const font = entry.level === 1 ? fontBold : fontBody
        currentPage().drawText(truncated, {
          x: margin + indent,
          y: cursorY,
          font,
          size,
          color: rgb(0.15, 0.15, 0.2),
        })
        cursorY -= lineH
      }
      cursorY -= 12 * scale
      continue
    }

    if (token.type === 'task-item') {
      const listSize = 11 * scale
      const lineH = listSize * 1.5
      const indent = 24
      const boxSize = 10 * scale
      const maxW = pageWidth - margin - indent - boxSize - 8
      const lines = wrapText(token.text, fontBody, listSize, maxW)
      for (let li = 0; li < lines.length; li++) {
        ensurePage(lineH)
        const page = currentPage()
        if (li === 0) {
          const boxY = cursorY + 1
          page.drawRectangle({
            x: margin + indent,
            y: boxY,
            width: boxSize,
            height: boxSize,
            borderColor: rgb(0.4, 0.4, 0.45),
            borderWidth: 0.8,
            color: token.checked ? rgb(accent[0], accent[1], accent[2]) : rgb(1, 1, 1),
          })
          if (token.checked) {
            // Simple checkmark
            page.drawLine({
              start: { x: margin + indent + 2, y: boxY + boxSize / 2 },
              end: { x: margin + indent + boxSize / 2 - 1, y: boxY + 2 },
              thickness: 1.2,
              color: rgb(1, 1, 1),
            })
            page.drawLine({
              start: { x: margin + indent + boxSize / 2 - 1, y: boxY + 2 },
              end: { x: margin + indent + boxSize - 1, y: boxY + boxSize - 1 },
              thickness: 1.2,
              color: rgb(1, 1, 1),
            })
          }
        }
        page.drawText(lines[li], {
          x: margin + indent + boxSize + 8,
          y: cursorY,
          font: fontBody,
          size: listSize,
          color: rgb(0.15, 0.15, 0.15),
        })
        cursorY -= lineH
      }
      continue
    }

    if (token.type === 'table') {
      const headers = token.headers ?? []
      const rows = token.rows ?? []
      if (headers.length === 0 && rows.length === 0) continue

      const colCount = Math.max(headers.length, ...rows.map(r => r.length))
      const tableW = pageWidth - 2 * margin
      const cellSize = 10 * scale
      const cellPad = 6
      const lineH = cellSize * 1.4

      // Column widths: proportional to longest content
      const rawWidths: number[] = new Array(colCount).fill(0)
      const measure = (t: string) => fontBody.widthOfTextAtSize(sanitizePdfText(t), cellSize)
      for (let c = 0; c < colCount; c++) {
        rawWidths[c] = Math.max(rawWidths[c], measure(headers[c] ?? ''))
        for (const r of rows) rawWidths[c] = Math.max(rawWidths[c], measure(r[c] ?? ''))
      }
      const rawTotal = rawWidths.reduce((a, b) => a + b, 0) || 1
      const colWidths = rawWidths.map(w => (w / rawTotal) * (tableW - colCount * cellPad * 2))

      const drawRow = (cells: string[], isHeader: boolean) => {
        // First compute max lines across cells
        const wrappedCells = cells.map((cell, ci) => {
          const w = colWidths[ci] ?? 40
          return wrapText(cell, isHeader ? fontBold : fontBody, cellSize, w)
        })
        const maxLines = Math.max(1, ...wrappedCells.map(l => l.length))
        const rowH = maxLines * lineH + cellPad * 2
        ensurePage(rowH)
        const page = currentPage()
        if (isHeader) {
          page.drawRectangle({
            x: margin,
            y: cursorY - rowH + lineH,
            width: tableW,
            height: rowH,
            color: rgb(0.95, 0.96, 0.98),
          })
        }
        let x = margin
        for (let ci = 0; ci < colCount; ci++) {
          const wrapped = wrappedCells[ci] ?? []
          const w = colWidths[ci] ?? 40
          // Cell border
          page.drawRectangle({
            x,
            y: cursorY - rowH + lineH,
            width: w + cellPad * 2,
            height: rowH,
            borderColor: rgb(0.85, 0.85, 0.88),
            borderWidth: 0.5,
          })
          let ty = cursorY
          for (const line of wrapped) {
            page.drawText(line, {
              x: x + cellPad,
              y: ty,
              font: isHeader ? fontBold : fontBody,
              size: cellSize,
              color: isHeader ? rgb(0.08, 0.08, 0.12) : rgb(0.15, 0.15, 0.18),
            })
            ty -= lineH
          }
          x += w + cellPad * 2
        }
        cursorY -= rowH
      }

      if (headers.length > 0) drawRow(headers, true)
      for (const row of rows) drawRow(row, false)
      cursorY -= 10 * scale
      continue
    }

    if (token.type === 'image') {
      if (!token.src) continue
      try {
        let bytes: Uint8Array | null = null
        let format: 'png' | 'jpg' = 'png'
        const src = token.src
        if (src.startsWith('data:')) {
          const match = /^data:image\/(png|jpe?g);base64,(.*)$/i.exec(src)
          if (match) {
            format = match[1].toLowerCase().startsWith('jp') ? 'jpg' : 'png'
            const bin = atob(match[2])
            bytes = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
          }
        }
        if (!bytes) continue
        const image = format === 'jpg' ? await doc.embedJpg(bytes) : await doc.embedPng(bytes)
        const maxW = pageWidth - 2 * margin
        const naturalW = token.width ?? image.width
        const naturalH = token.height ?? image.height
        const ratio = Math.min(1, maxW / naturalW)
        const w = naturalW * ratio
        const h = naturalH * ratio
        ensurePage(h + 12)
        const page = currentPage()
        page.drawImage(image, {
          x: margin + (maxW - w) / 2,
          y: cursorY - h,
          width: w,
          height: h,
        })
        cursorY -= h + 8
        if (token.alt) {
          const captionSize = 9 * scale
          const alt = sanitizePdfText(token.alt)
          const w2 = fontItalic.widthOfTextAtSize(alt, captionSize)
          page.drawText(alt, {
            x: margin + (maxW - w2) / 2,
            y: cursorY,
            font: fontItalic,
            size: captionSize,
            color: rgb(0.45, 0.45, 0.5),
          })
          cursorY -= captionSize * 1.5
        }
        cursorY -= 6 * scale
      } catch {
        // skip broken images
      }
      continue
    }

    if (token.type === 'callout') {
      const variant = token.variant ?? 'note'
      const palette: Record<string, { bg: [number, number, number]; bar: [number, number, number]; label: string }> = {
        note: { bg: [0.94, 0.96, 1], bar: [0.15, 0.4, 0.9], label: 'NOTE' },
        tip: { bg: [0.93, 0.98, 0.94], bar: [0.15, 0.65, 0.35], label: 'TIP' },
        warning: { bg: [1, 0.97, 0.9], bar: [0.9, 0.6, 0.1], label: 'WARNING' },
        danger: { bg: [1, 0.93, 0.93], bar: [0.85, 0.2, 0.2], label: 'DANGER' },
      }
      const c = palette[variant]
      const bodySize = 11 * scale
      const lineH = bodySize * 1.5
      const labelSize = 9 * scale
      const indent = 16
      const maxW = pageWidth - 2 * margin - indent - 12
      const lines = wrapText(token.text, fontBody, bodySize, maxW)
      const boxH = labelSize * 1.4 + lines.length * lineH + 12
      ensurePage(boxH)
      const page = currentPage()
      page.drawRectangle({
        x: margin,
        y: cursorY - boxH + lineH,
        width: pageWidth - 2 * margin,
        height: boxH,
        color: rgb(c.bg[0], c.bg[1], c.bg[2]),
      })
      page.drawRectangle({
        x: margin,
        y: cursorY - boxH + lineH,
        width: 4,
        height: boxH,
        color: rgb(c.bar[0], c.bar[1], c.bar[2]),
      })
      let y = cursorY - 2
      page.drawText(c.label, {
        x: margin + indent,
        y,
        font: fontBold,
        size: labelSize,
        color: rgb(c.bar[0], c.bar[1], c.bar[2]),
      })
      y -= labelSize * 1.6
      for (const line of lines) {
        page.drawText(line, {
          x: margin + indent,
          y,
          font: fontBody,
          size: bodySize,
          color: rgb(0.15, 0.15, 0.18),
        })
        y -= lineH
      }
      cursorY = y - 6
      continue
    }
  }

  // Add page numbers footer (skip page 1 if it's a cover)
  const hasCover = tokens.length > 0 && tokens[0].type === 'cover'
  const totalPages = pages.length
  for (let pi = 0; pi < totalPages; pi++) {
    if (hasCover && pi === 0) continue
    const p = pages[pi]
    const label = `${pi + 1}`
    const w = fontBody.widthOfTextAtSize(label, 9)
    p.drawText(label, {
      x: pageWidth / 2 - w / 2,
      y: 24,
      font: fontBody,
      size: 9,
      color: rgb(0.55, 0.55, 0.6),
    })
  }

  // Suppress unused warnings for optional theme variants we may use later
  void fontBoldItalic
  void fontCodeBold

  return doc.save()
}

// ── Markdown to PDF ───────────────────────────────────────────────────────────

export async function markdownToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const { parseMarkdown, buildCoverToken, buildTocToken } = await import('./markdown-parser')

  const pageSize = (options.pageSize as 'A4' | 'Letter') ?? 'A4'
  const fontSize = typeof options.fontSize === 'number' ? options.fontSize : 12
  const theme = (options.theme as PdfTheme) ?? 'modern'
  const includeTOC = options.includeTOC !== false
  const includeCover = options.includeCover !== false
  const combine = options.combineIntoOne === true
  const marginMm = typeof options.marginMm === 'number' ? options.marginMm : undefined
  const renderOpts = { pageSize, fontSize, theme, marginMm }

  const results: ConversionResult[] = []

  if (combine && files.length > 1) {
    // Merge all files into single PDF with page breaks between
    const allTokens: RenderToken[] = []
    let firstCover: RenderToken | null = null
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const text = await file.text()
      const { tokens, frontMatter, headings } = await parseMarkdown(text)
      if (i === 0 && includeCover) {
        firstCover = buildCoverToken(frontMatter, file.name.replace(/\.[^.]+$/, ''))
      }
      if (i > 0) allTokens.push({ type: 'page-break', text: '' })
      // Section heading per file
      allTokens.push({
        type: 'heading',
        level: 1,
        text: (frontMatter?.title as string) || file.name.replace(/\.[^.]+$/, ''),
      })
      allTokens.push(...tokens)
      onProgress?.(i, Math.round(((i + 1) / files.length) * 80))
      void headings
    }
    // Build TOC from top-level headings of all files
    const tocEntries: Array<{ level: number; text: string }> = allTokens
      .filter(t => t.type === 'heading' && (t.level ?? 1) <= 2)
      .map(t => ({ level: t.level ?? 1, text: t.text }))
    const finalTokens: RenderToken[] = []
    if (firstCover) finalTokens.push(firstCover, { type: 'page-break', text: '' })
    if (includeTOC && tocEntries.length > 0) {
      finalTokens.push({ type: 'toc', text: 'Table of Contents', entries: tocEntries })
      finalTokens.push({ type: 'page-break', text: '' })
    }
    finalTokens.push(...allTokens)
    const pdfBytes = await renderTokensToPdf(finalTokens, renderOpts)
    const outName =
      files.length === 1
        ? files[0].name.replace(/\.[^.]+$/, '.pdf')
        : `combined-${files.length}-files.pdf`
    results.push(
      new File([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], outName, { type: 'application/pdf' })
    )
    onProgress?.(files.length - 1, 100)
    return results
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const text = await file.text()
    const { tokens, frontMatter, headings } = await parseMarkdown(text)
    const finalTokens: RenderToken[] = []
    const cover = includeCover ? buildCoverToken(frontMatter, file.name.replace(/\.[^.]+$/, '')) : null
    if (cover) {
      finalTokens.push(cover, { type: 'page-break', text: '' })
    }
    if (includeTOC) {
      const toc = buildTocToken(headings)
      if (toc) {
        finalTokens.push(toc, { type: 'page-break', text: '' })
      }
    }
    finalTokens.push(...tokens)
    const pdfBytes = await renderTokensToPdf(finalTokens, renderOpts)
    const basename = file.name.replace(/\.[^.]+$/, '')
    results.push(
      new File([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], `${basename}.pdf`, {
        type: 'application/pdf',
      })
    )
    onProgress?.(i, 100)
  }

  return results
}

// ── CSV to PDF ────────────────────────────────────────────────────────────────

function parseRfc4180(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  // Normalize line endings
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        // peek next
        if (src[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        field += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        row.push(field)
        field = ''
        i++
      } else if (ch === '\n') {
        row.push(field)
        field = ''
        rows.push(row)
        row = []
        i++
      } else {
        field += ch
        i++
      }
    }
  }
  // trailing field / row
  row.push(field)
  if (row.some(f => f !== '') || rows.length === 0) {
    rows.push(row)
  }
  return rows
}

export async function csvToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const headerRow = options.headerRow !== false
  const orientation = (options.orientation as string) ?? 'portrait'
  const fontSize = typeof options.fontSize === 'number' ? options.fontSize : 9

  const isLandscape = orientation === 'landscape'
  const pageWidth = isLandscape ? 841.89 : 595.28
  const pageHeight = isLandscape ? 595.28 : 841.89
  const leftMargin = 40
  const rightMargin = 40
  const topMargin = 40
  const bottomMargin = 40
  const rowHeight = fontSize * 2

  const results: ConversionResult[] = []

  for (let fi = 0; fi < files.length; fi++) {
    const file = files[fi]
    onProgress?.(fi, 0)

    const text = await file.text()
    const rows = parseRfc4180(text)

    const doc = await PDFDocument.create()
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

    if (rows.length === 0) {
      const emptyBytes = await doc.save()
      results.push(new File([new Uint8Array(emptyBytes.buffer as ArrayBuffer)], file.name.replace(/\.[^.]+$/, '') + '.pdf', { type: 'application/pdf' }))
      onProgress?.(fi, 100)
      continue
    }

    const colCount = Math.max(...rows.map(r => r.length))
    const availWidth = pageWidth - leftMargin - rightMargin
    const maxColWidth = availWidth / colCount

    // Calculate column widths based on content
    const colWidths: number[] = []
    for (let c = 0; c < colCount; c++) {
      let maxW = 0
      for (const row of rows) {
        const cell = row[c] ?? ''
        const font = headerRow && rows.indexOf(row) === 0 ? fontBold : fontRegular
        const w = font.widthOfTextAtSize(cell, fontSize)
        if (w > maxW) maxW = w
      }
      const colW = Math.max(40, Math.min(maxColWidth, maxW + 16))
      colWidths.push(colW)
    }

    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0)

    // Helpers to add page
    let page = doc.addPage([pageWidth, pageHeight])
    let cursorY = pageHeight - topMargin
    const tableTopY = cursorY

    function addPage() {
      page = doc.addPage([pageWidth, pageHeight])
      cursorY = pageHeight - topMargin
    }


    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]
      const isHeader = headerRow && ri === 0
      const font = isHeader ? fontBold : fontRegular

      // Page break check
      if (cursorY - rowHeight < bottomMargin) {
        addPage()
      }

      // Header background
      if (isHeader) {
        page.drawRectangle({
          x: leftMargin,
          y: cursorY - rowHeight,
          width: totalTableWidth,
          height: rowHeight,
          color: rgb(0.92, 0.92, 0.92),
        })
      }

      // Top horizontal line
      page.drawLine({
        start: { x: leftMargin, y: cursorY },
        end: { x: leftMargin + totalTableWidth, y: cursorY },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      })

      // Cells
      let xOffset = 0
      for (let ci = 0; ci < colCount; ci++) {
        const colW = colWidths[ci]
        let cellText = row[ci] ?? ''

        // Truncate if too wide
        const maxTextW = colW - 16
        if (font.widthOfTextAtSize(cellText, fontSize) > maxTextW) {
          while (cellText.length > 0 && font.widthOfTextAtSize(cellText + '…', fontSize) > maxTextW) {
            cellText = cellText.slice(0, -1)
          }
          cellText = cellText + '…'
        }

        page.drawText(cellText, {
          x: leftMargin + xOffset + 8,
          y: cursorY - fontSize - (rowHeight - fontSize) / 2,
          font,
          size: fontSize,
          color: rgb(0, 0, 0),
        })

        // Left vertical divider for each column
        page.drawLine({
          start: { x: leftMargin + xOffset, y: cursorY },
          end: { x: leftMargin + xOffset, y: cursorY - rowHeight },
          thickness: 0.5,
          color: rgb(0.6, 0.6, 0.6),
        })

        xOffset += colW
      }

      // Right border vertical line
      page.drawLine({
        start: { x: leftMargin + totalTableWidth, y: cursorY },
        end: { x: leftMargin + totalTableWidth, y: cursorY - rowHeight },
        thickness: 0.5,
        color: rgb(0.6, 0.6, 0.6),
      })

      cursorY -= rowHeight
      onProgress?.(fi, Math.round(((ri + 1) / rows.length) * 90))
    }

    // Final bottom line
    page.drawLine({
      start: { x: leftMargin, y: cursorY },
      end: { x: leftMargin + totalTableWidth, y: cursorY },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    })

    const bytes = await doc.save()
    const basename = file.name.replace(/\.[^.]+$/, '')
    results.push(new File([new Uint8Array(bytes.buffer as ArrayBuffer)], basename + '.pdf', { type: 'application/pdf' }))
    onProgress?.(fi, 100)
  }

  return results
}

// ── HEIC to PDF ───────────────────────────────────────────────────────────────

export { heicToPdf } from './heic-to-pdf'

// ── Extract Tables ────────────────────────────────────────────────────────────

export async function extractTables(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const pageRange = (options.pageRange as string) ?? 'all'
  const minColumns = typeof options.minColumns === 'number' ? Math.max(1, Math.floor(options.minColumns)) : 2

  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      const buffer = await file.arrayBuffer()
      const structuredPages = await extractStructuredText(buffer)

      // Determine page indices to scan
      let pageIndices: number[]
      if (!pageRange || pageRange === 'all') {
        pageIndices = Array.from({ length: structuredPages.length }, (_, idx) => idx)
      } else {
        const oneBasedPages = parsePageRanges(pageRange, structuredPages.length)
        pageIndices = oneBasedPages.map(p => p - 1)
      }

      // Detect tables across pages
      const allTables: { page: number; tableIndex: number; csv: string }[] = []

      for (const pageIdx of pageIndices) {
        if (pageIdx < 0 || pageIdx >= structuredPages.length) continue
        const rows = pageToRows(structuredPages[pageIdx])
        const pageNum = pageIdx + 1

        // Table detection: contiguous blocks with >= minColumns non-empty cells
        let currentTable: string[][] = []
        let tableIdx = 0

        const flushTable = () => {
          if (currentTable.length >= 2) {
            const csv = currentTable.map(r => r.map(escapeCsvCell).join(',')).join('\n')
            allTables.push({ page: pageNum, tableIndex: tableIdx, csv })
            tableIdx++
          }
          currentTable = []
        }

        for (const row of rows) {
          const nonEmpty = row.filter(c => c.trim()).length
          if (nonEmpty >= minColumns) {
            currentTable.push(row)
          } else {
            flushTable()
          }
        }
        flushTable()
      }

      // Build ZIP
      const baseName = file.name.replace(/\.pdf$/i, '')
      const enc = new TextEncoder()
      const zipEntries: Record<string, Uint8Array> = {}

      if (allTables.length === 0) {
        zipEntries[`${baseName}-no-tables.txt`] = enc.encode(`No tables detected in ${baseName}`)
      } else if (allTables.length === 1) {
        zipEntries[`${baseName}-table.csv`] = enc.encode(allTables[0].csv)
      } else {
        for (const t of allTables) {
          zipEntries[`${baseName}/page-${t.page}-table-${t.tableIndex}.csv`] = enc.encode(t.csv)
        }
      }

      const zipBytes = zipSync(zipEntries)
      results.push(new File([zipBytes], `${baseName}-tables.zip`, { type: 'application/zip' }))
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }
    onProgress?.(i, 100)
  }

  return results
}

// ── EPUB to PDF ───────────────────────────────────────────────────────────────

function extractInline(el: Element): Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> {
  const spans: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> = []
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) spans.push({ text })
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element
      const tag = child.tagName.toUpperCase()
      const text = child.textContent ?? ''
      if (tag === 'STRONG' || tag === 'B') {
        spans.push({ text, bold: true })
      } else if (tag === 'EM' || tag === 'I') {
        spans.push({ text, italic: true })
      } else if (tag === 'CODE') {
        spans.push({ text, code: true })
      } else {
        spans.push({ text })
      }
    }
  }
  return spans
}

function walkEpubNodes(nodes: NodeListOf<ChildNode>, tokens: RenderToken[]): void {
  for (const node of Array.from(nodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Skip bare text at top level
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const el = node as Element
    const tag = el.tagName.toUpperCase()

    if (tag === 'H1') {
      const text = el.textContent?.trim() ?? ''
      if (text) tokens.push({ type: 'heading', text, level: 1 })
    } else if (tag === 'H2') {
      const text = el.textContent?.trim() ?? ''
      if (text) tokens.push({ type: 'heading', text, level: 2 })
    } else if (tag === 'H3' || tag === 'H4' || tag === 'H5' || tag === 'H6') {
      const text = el.textContent?.trim() ?? ''
      if (text) tokens.push({ type: 'heading', text, level: 3 })
    } else if (tag === 'P') {
      const text = el.textContent?.trim() ?? ''
      if (text) tokens.push({ type: 'paragraph', text, inline: extractInline(el) })
    } else if (tag === 'PRE') {
      tokens.push({ type: 'code-block', text: el.textContent ?? '' })
    } else if (tag === 'UL') {
      for (const li of Array.from(el.querySelectorAll(':scope > li'))) {
        const text = li.textContent?.trim() ?? ''
        if (text) tokens.push({ type: 'list-item', text, ordered: false })
      }
    } else if (tag === 'OL') {
      let i = 0
      for (const li of Array.from(el.querySelectorAll(':scope > li'))) {
        const text = li.textContent?.trim() ?? ''
        if (text) tokens.push({ type: 'list-item', text, ordered: true, index: i + 1 })
        i++
      }
    } else if (tag === 'BLOCKQUOTE') {
      const text = el.textContent?.trim() ?? ''
      if (text) tokens.push({ type: 'blockquote', text })
    } else if (tag === 'HR') {
      tokens.push({ type: 'rule', text: '' })
    } else if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE' || tag === 'MAIN' || tag === 'BODY' || tag === 'NAV' || tag === 'ASIDE') {
      walkEpubNodes(el.childNodes, tokens)
    }
    // Skip IMG, FIGURE, SVG, CODE (inline only), SCRIPT, STYLE
  }
}

export async function epubToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const pageSize = (options.pageSize as 'A4' | 'Letter') ?? 'A4'
  const fontSize = typeof options.fontSize === 'number' ? options.fontSize : 12

  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i, 5)

    try {
      const buffer = await file.arrayBuffer()
      const { unzipSync } = await import('fflate')
      const filesMap = unzipSync(new Uint8Array(buffer))

      onProgress?.(i, 15)

      // Parse container.xml to find rootfile path
      const containerXmlBytes = filesMap['META-INF/container.xml']
      if (!containerXmlBytes) throw new Error('Invalid EPUB: missing META-INF/container.xml')

      const containerXml = new TextDecoder().decode(containerXmlBytes)
      const parser = new DOMParser()
      const containerDoc = parser.parseFromString(containerXml, 'text/xml')
      const rootfilePath = containerDoc.querySelector('rootfile')?.getAttribute('full-path') ?? 'OEBPS/content.opf'

      // Parse OPF
      const opfBytes = filesMap[rootfilePath]
      if (!opfBytes) throw new Error(`Invalid EPUB: missing OPF file at ${rootfilePath}`)

      const opfXml = new TextDecoder().decode(opfBytes)
      const opfDoc = parser.parseFromString(opfXml, 'text/xml')

      // Build item map: id → href
      const itemMap = new Map<string, string>()
      opfDoc.querySelectorAll('manifest item').forEach(item => {
        const id = item.getAttribute('id')
        const href = item.getAttribute('href')
        if (id && href) itemMap.set(id, href)
      })

      // Get spine order (hrefs)
      const spineItems: string[] = []
      opfDoc.querySelectorAll('spine itemref').forEach(itemref => {
        const idref = itemref.getAttribute('idref')
        if (idref && itemMap.has(idref)) spineItems.push(itemMap.get(idref)!)
      })

      // OPF directory prefix for resolving relative hrefs
      const opfDir = rootfilePath.includes('/')
        ? rootfilePath.split('/').slice(0, -1).join('/') + '/'
        : ''

      onProgress?.(i, 25)

      const allTokens: RenderToken[] = []
      let chaptersLoaded = 0

      for (let c = 0; c < spineItems.length; c++) {
        const href = spineItems[c]
        // Strip any fragment identifier
        const hrefClean = href.split('#')[0]

        // Try to find the chapter in the files map
        const chapterPath = opfDir + hrefClean
        const altPath = hrefClean

        const chapterBytes = filesMap[chapterPath] ?? filesMap[altPath]
        if (!chapterBytes) continue

        const html = new TextDecoder().decode(chapterBytes)
        const chapterDoc = parser.parseFromString(html, 'text/html')

        // Strip script and style
        chapterDoc.querySelectorAll('script, style').forEach(el => el.remove())

        // Add separator between chapters (except first)
        if (chaptersLoaded > 0) {
          allTokens.push({ type: 'space', text: '' })
        }

        walkEpubNodes(chapterDoc.body.childNodes, allTokens)
        chaptersLoaded++

        const pct = 25 + Math.round(((c + 1) / spineItems.length) * 50)
        onProgress?.(i, pct)
      }

      // Fallback if no content found
      if (allTokens.length === 0) {
        allTokens.push({ type: 'paragraph', text: 'No readable content found in this EPUB file.' })
      }

      onProgress?.(i, 80)

      const pdfBytes = await renderTokensToPdf(allTokens, { pageSize, fontSize })

      onProgress?.(i, 98)

      const basename = file.name
      const outName = basename.replace(/\.epub$/i, '') + '.pdf'
      results.push(new File([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], outName, { type: 'application/pdf' }))
    } catch (err) {
      results.push(err instanceof Error ? err : new Error(String(err)))
    }

    onProgress?.(i, 100)
  }

  return results
}
