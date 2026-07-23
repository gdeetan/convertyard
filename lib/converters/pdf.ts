import { PDFDocument, PDFRawStream, PDFName, PDFNumber, PDFDict, degrees, rgb, StandardFonts, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib'
import { zipSync } from 'fflate'
import { getPageCount, renderPage, renderPagePng, extractText, extractStructuredText } from './mupdf-client'
import { formatBytes } from '@/lib/utils/download'
import type { ConversionResult, ToolOptions, CompressionMeta } from '@/lib/types'
import { convertPdfToWord } from './pdf-to-word'
import { recognizePage, terminateOcrWorker } from '@/lib/ocr/tesseract-client'

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
  if ((level === 'medium' || level === 'high') && advanced?.stripMetadata !== false) {
    doc.setTitle('')
    doc.setAuthor('')
    doc.setSubject('')
    doc.setKeywords([])
    doc.setProducer('')
    doc.setCreator('')
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

async function reencodeJpeg(jpegBytes: Uint8Array, quality: number): Promise<Uint8Array> {
  const blob = new Blob([jpegBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
  const bmp = await createImageBitmap(blob)
  const canvas = new OffscreenCanvas(bmp.width, bmp.height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bmp, 0, 0)
  bmp.close()
  const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
  return new Uint8Array(await outBlob.arrayBuffer())
}

async function recompressImages(
  buffer: ArrayBuffer,
  quality: number,
  fileName: string
): Promise<File> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const context = doc.context

  for (const [ref, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue
    const subtype = obj.dict.get(PDFName.of('Subtype'))
    if (subtype?.toString() !== '/Image') continue
    const filter = obj.dict.get(PDFName.of('Filter'))
    if (filter?.toString() !== '/DCTDecode') continue

    try {
      const reencoded = await reencodeJpeg(obj.contents, quality)
      if (reencoded.byteLength >= obj.contents.byteLength) continue

      obj.dict.set(PDFName.of('Length'), PDFNumber.of(reencoded.byteLength))
      context.assign(ref, PDFRawStream.of(obj.dict, reencoded))
    } catch {
      // skip corrupt or non-decodable images
    }
  }

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
}

async function rasterizePdf(file: File, dpi: number, fileName: string): Promise<File> {
  const buffer = await file.arrayBuffer()
  const pageCount = await getPageCount(buffer)
  const doc = await PDFDocument.create()

  for (let p = 0; p < pageCount; p++) {
    const jpegBuffer = await renderPage(buffer, p, dpi, 85)
    const jpegBytes = new Uint8Array(jpegBuffer)
    const image = await doc.embedJpg(jpegBytes)
    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  }

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
}

// Variant that takes an ArrayBuffer directly — used by target-size mode to avoid re-reading File
async function rasterizeForTarget(
  buffer: ArrayBuffer,
  fileName: string,
  dpi: number,
  quality: number
): Promise<File> {
  const pageCount = await getPageCount(buffer)
  const doc = await PDFDocument.create()

  for (let p = 0; p < pageCount; p++) {
    const jpegBuffer = await renderPage(buffer, p, dpi, quality)
    const jpegBytes = new Uint8Array(jpegBuffer)
    const image = await doc.embedJpg(jpegBytes)
    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  }

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
}

// Grayscale rasterization — maximum size reduction
async function rasterizeGrayscaleForTarget(
  buffer: ArrayBuffer,
  fileName: string,
  dpi: number,
  quality: number
): Promise<File> {
  const pageCount = await getPageCount(buffer)
  const doc = await PDFDocument.create()

  for (let p = 0; p < pageCount; p++) {
    const jpegBuffer = await renderPage(buffer, p, dpi, quality)
    const jpegBytes = new Uint8Array(jpegBuffer)
    const blob = new Blob([jpegBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'image/jpeg' })
    const bmp = await createImageBitmap(blob)
    const canvas = new OffscreenCanvas(bmp.width, bmp.height)
    const ctx = canvas.getContext('2d')!
    ctx.filter = 'grayscale(1)'
    ctx.drawImage(bmp, 0, 0)
    bmp.close()
    const grayBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: quality / 100 })
    const grayBytes = new Uint8Array(await grayBlob.arrayBuffer())
    const image = await doc.embedJpg(grayBytes)
    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
  }

  const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false })
  return new File([bytes as Uint8Array<ArrayBuffer>], fileName, { type: 'application/pdf' })
}

function isValidPdf(bytes: Uint8Array): boolean {
  const header = new TextDecoder().decode(bytes.slice(0, 8))
  return header.startsWith('%PDF-1.') || header.startsWith('%PDF-2.')
}

// ── Target-size compression ───────────────────────────────────────────────────

export async function compressPdfToTargetSize(
  input: File,
  targetBytes: number,
  onProgress?: (pct: number) => void
): Promise<{ file: File; meta: CompressionMeta }> {
  const originalBytes = input.size
  // INVARIANT 3: never return a file smaller than 50% of target (that's over-compression)
  const floor = targetBytes * 0.5

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

  const inputBuffer = await input.arrayBuffer()

  // INVARIANT 6: monotonically escalating compression steps (1–6).
  // Steps 1–2 are lossless/JPEG-only (preserve text selectability).
  // Steps 3–6 rasterize at decreasing DPI to guarantee meaningful size reduction
  // regardless of PDF content type (text, vector, scanned images).
  // Graduated DPI steps prevent jumping past the target into the over-compression floor.
  const steps: Array<{ label: string; produce: () => Promise<File> }> = [
    { label: 'structural compression',           produce: () => compressStructural(inputBuffer, 'high', input.name) },
    { label: 'JPEG re-encode quality 60',        produce: () => recompressImages(inputBuffer, 60, input.name) },
    { label: 'rasterize 200 DPI quality 80',     produce: () => rasterizeForTarget(inputBuffer, input.name, 200, 80) },
    { label: 'rasterize 150 DPI quality 75',     produce: () => rasterizeForTarget(inputBuffer, input.name, 150, 75) },
    { label: 'rasterize 100 DPI quality 65',     produce: () => rasterizeForTarget(inputBuffer, input.name, 100, 65) },
    { label: 'rasterize 72 DPI quality 40',      produce: () => rasterizeForTarget(inputBuffer, input.name, 72, 40) },
    { label: 'rasterize grayscale 72 DPI q 35',  produce: () => rasterizeGrayscaleForTarget(inputBuffer, input.name, 72, 35) },
  ]

  // prevBest: smallest result still above target (to step back to if we over-compress)
  let prevBest: File = input
  let prevBestLabel = 'original'
  let iterationsUsed = 0

  for (let i = 0; i < steps.length; i++) {
    onProgress?.(Math.round(10 + ((i + 1) / steps.length) * 85))

    let candidate: File
    try {
      candidate = await steps[i].produce()
    } catch {
      iterationsUsed++
      continue
    }

    // INVARIANT 2: discard invalid PDF output
    const bytes = new Uint8Array(await candidate.arrayBuffer())
    if (!isValidPdf(bytes)) {
      iterationsUsed++
      continue
    }

    iterationsUsed++

    if (candidate.size <= targetBytes) {
      if (candidate.size >= floor) {
        // Perfect hit: within [floor, target] — stop at first success (INVARIANT 6)
        onProgress?.(100)
        return {
          file: candidate,
          meta: {
            originalBytes,
            targetBytes,
            achievedBytes: candidate.size,
            reachedTarget: true,
            isUnchanged: false,
            iterationsUsed,
            appliedSettings: steps[i].label,
          },
        }
      }
      // Below floor (over-compressed relative to target). INVARIANT 3: step back
      // to previous best. If the previous best is closer to target than this
      // over-compressed result, prefer it; otherwise keep the smaller file
      // (better too-small than never reaching the target at all).
      if (prevBest.size > targetBytes) {
        // Nothing has hit the target yet — the over-compressed result is the
        // smallest we can do. The file IS below the target, so reachedTarget=true;
        // we just couldn't stay within the preferred floor.
        onProgress?.(100)
        return {
          file: candidate,
          meta: {
            originalBytes,
            targetBytes,
            achievedBytes: candidate.size,
            reachedTarget: true,
            isUnchanged: false,
            iterationsUsed,
            appliedSettings: steps[i].label,
          },
        }
      }
      // A previous step already beat the target — step back to that
      break
    }

    // Still above target — track best so far
    if (candidate.size < prevBest.size) {
      prevBest = candidate
      prevBestLabel = steps[i].label
    }
  }

  onProgress?.(100)
  // INVARIANT 5: return best result achieved
  return {
    file: prevBest,
    meta: {
      originalBytes,
      targetBytes,
      achievedBytes: prevBest.size,
      reachedTarget: prevBest.size <= targetBytes,
      isUnchanged: false,
      iterationsUsed,
      appliedSettings: prevBestLabel,
      message: prevBest.size <= targetBytes
        ? undefined
        : `Couldn't reach ${formatBytes(targetBytes)} — smallest possible is ${formatBytes(prevBest.size)}`,
    },
  }
}

// ── Compress ──────────────────────────────────────────────────────────────────

export async function compressPDF(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<Array<File | Error | { file: File; meta: CompressionMeta }>> {
  const targetSizeMode = options.targetSizeMode === true
  const results: Array<File | Error | { file: File; meta: CompressionMeta }> = []

  for (let i = 0; i < files.length; i++) {
    try {
      if (targetSizeMode) {
        const targetKB = typeof options.targetKB === 'number' ? options.targetKB : 500
        const result = await compressPdfToTargetSize(
          files[i],
          targetKB * 1024,
          (pct) => onProgress?.(i, pct)
        )
        results.push(result)
      } else {
        const level = (options.level as 'low' | 'medium' | 'high' | 'aggressive') ?? 'medium'
        const targetDpi = typeof options.targetDpi === 'number' ? options.targetDpi : 150
        const jpegQuality = typeof options.jpegQuality === 'number' ? options.jpegQuality : 70
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
          const file = grayscale
            ? await rasterizeGrayscaleForTarget(buffer, files[i].name, targetDpi, jpegQuality)
            : await rasterizeForTarget(buffer, files[i].name, targetDpi, jpegQuality)
          onProgress?.(i, 100)
          results.push(file)
        } else {
          onProgress?.(i, 10)
          const buffer = await files[i].arrayBuffer()
          let file = await compressStructural(buffer, level, files[i].name, advancedStrip)
          onProgress?.(i, 50)

          if (grayscale) {
            const structBuf = await file.arrayBuffer()
            file = await rasterizeGrayscaleForTarget(structBuf, files[i].name, targetDpi, jpegQuality)
          } else if (jpegQuality < 80) {
            const structBuf = await file.arrayBuffer()
            file = await recompressImages(structBuf, jpegQuality, files[i].name)
          }

          onProgress?.(i, 100)
          results.push(file)
        }
      }
    } catch (err) {
      results.push(new Error(err instanceof Error ? err.message : 'Compression failed'))
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
  type: 'heading' | 'paragraph' | 'code-block' | 'list-item' | 'rule' | 'blockquote' | 'space'
  text: string
  level?: 1 | 2 | 3
  ordered?: boolean
  index?: number
  inline?: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }>
}

export async function renderTokensToPdf(
  tokens: RenderToken[],
  options: { pageSize: 'A4' | 'Letter'; fontSize: number }
): Promise<Uint8Array> {
  const pageWidth = options.pageSize === 'A4' ? 595.28 : 612
  const pageHeight = options.pageSize === 'A4' ? 841.89 : 792
  const margin = 60
  const scale = options.fontSize / 12

  const doc = await PDFDocument.create()
  const fontHeading = await doc.embedFont(StandardFonts.TimesRomanBold)
  const fontBody = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique)
  const fontCode = await doc.embedFont(StandardFonts.Courier)

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

  function sanitizeText(s: string): string {
    return s.replace(/[\r\n\t]/g, ' ').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
  }

  function wrapText(text: string, font: EmbeddedFont, size: number, maxWidth: number): string[] {
    if (!text?.trim()) return []
    const words = sanitizeText(text).split(' ').filter(Boolean)
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
          const words = sanitizeText(span.text).split(' ').filter(Boolean)
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
      const bqSize = 10 * scale
      const lineH = bqSize * 1.4
      const indent = 20
      const maxW = pageWidth - 2 * margin - indent
      const lines = wrapText(token.text, fontItalic, bqSize, maxW)
      for (const line of lines) {
        ensurePage(lineH)
        currentPage().drawText(line, { x: margin + indent, y: cursorY, font: fontItalic, size: bqSize, color: rgb(0, 0, 0) })
        cursorY -= lineH
      }
      cursorY -= 8 * scale
      continue
    }
  }

  return doc.save()
}

// ── Markdown to PDF ───────────────────────────────────────────────────────────

export async function markdownToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const { marked } = await import('marked')

  const pageSize = (options.pageSize as 'A4' | 'Letter') ?? 'A4'
  const fontSize = typeof options.fontSize === 'number' ? options.fontSize : 12

  type InlineToken = { type: string; text?: string; tokens?: InlineToken[] }

  function parseInline(
    tokens: InlineToken[]
  ): Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> {
    const result: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> = []
    for (const tok of tokens) {
      if (tok.type === 'text') {
        result.push({ text: tok.text ?? '' })
      } else if (tok.type === 'strong') {
        for (const inner of parseInline(tok.tokens ?? [])) {
          result.push({ ...inner, bold: true })
        }
      } else if (tok.type === 'em') {
        for (const inner of parseInline(tok.tokens ?? [])) {
          result.push({ ...inner, italic: true })
        }
      } else if (tok.type === 'codespan') {
        result.push({ text: tok.text ?? '', code: true })
      } else if (tok.type === 'link') {
        for (const inner of parseInline(tok.tokens ?? [])) {
          result.push(inner)
        }
      } else {
        result.push({ text: tok.text ?? '' })
      }
    }
    return result
  }

  type MarkedToken = {
    type: string
    text?: string
    depth?: number
    ordered?: boolean
    tokens?: MarkedToken[]
    items?: Array<{ text: string; tokens?: MarkedToken[] }>
  }

  function tokensToRenderTokens(lexerTokens: MarkedToken[]): RenderToken[] {
    const out: RenderToken[] = []
    for (const tok of lexerTokens) {
      if (tok.type === 'heading') {
        out.push({
          type: 'heading',
          text: tok.text ?? '',
          level: (tok.depth as 1 | 2 | 3) ?? 1,
          inline: parseInline(tok.tokens ?? []),
        })
      } else if (tok.type === 'paragraph') {
        out.push({
          type: 'paragraph',
          text: tok.text ?? '',
          inline: parseInline(tok.tokens ?? []),
        })
      } else if (tok.type === 'code') {
        out.push({ type: 'code-block', text: tok.text ?? '' })
      } else if (tok.type === 'list') {
        const items = tok.items ?? []
        items.forEach((item, i) => {
          out.push({
            type: 'list-item',
            text: item.text,
            ordered: tok.ordered ?? false,
            index: i + 1,
          })
        })
      } else if (tok.type === 'hr') {
        out.push({ type: 'rule', text: '' })
      } else if (tok.type === 'blockquote') {
        const inner = tokensToRenderTokens(tok.tokens ?? [])
        const firstPara = inner.find(t => t.type === 'paragraph')
        out.push({ type: 'blockquote', text: firstPara?.text ?? '' })
      } else if (tok.type === 'space') {
        out.push({ type: 'space', text: '' })
      }
      // other types: skip
    }
    return out
  }

  const results: ConversionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const text = await file.text()
    const lexerTokens = marked.lexer(text) as MarkedToken[]
    const renderTokens = tokensToRenderTokens(lexerTokens)
    const pdfBytes = await renderTokensToPdf(renderTokens, { pageSize, fontSize })
    const basename = file.name.replace(/\.[^.]+$/, '')
    results.push(new File([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], `${basename}.pdf`, { type: 'application/pdf' }))
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

async function decodeHeic(file: File): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({ blob: file, toType: 'image/png' })
  const blob = Array.isArray(result) ? result[0] : result
  const buf = await (blob as Blob).arrayBuffer()
  const bytes = new Uint8Array(buf)
  const bmp = await createImageBitmap(blob as Blob)
  const width = bmp.width
  const height = bmp.height
  bmp.close()
  return { bytes, width, height }
}

function getPageDims(pageSize: string, imgW: number, imgH: number): [number, number] {
  if (pageSize === 'fit-to-image') return [imgW, imgH]
  if (pageSize === 'Letter') return [612, 792]
  return [595.28, 841.89] // A4 default
}

function scaleToFit(
  imgW: number, imgH: number,
  pageW: number, pageH: number,
  margin: number
): { width: number; height: number; x: number; y: number } {
  const availW = pageW - 2 * margin
  const availH = pageH - 2 * margin
  const scale = Math.min(availW / imgW, availH / imgH, 1)
  const drawW = imgW * scale
  const drawH = imgH * scale
  return { width: drawW, height: drawH, x: (pageW - drawW) / 2, y: (pageH - drawH) / 2 }
}

export async function heicToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const outputMode = (options.outputMode as string) ?? 'per-image'
  const pageSize = (options.pageSize as string) ?? 'A4'
  const results: ConversionResult[] = []

  if (outputMode === 'combined') {
    const doc = await PDFDocument.create()
    for (let i = 0; i < files.length; i++) {
      try {
        const { bytes, width, height } = await decodeHeic(files[i])
        const [pw, ph] = getPageDims(pageSize, width, height)
        const page = doc.addPage([pw, ph])
        const img = await doc.embedPng(bytes)
        const dims = scaleToFit(width, height, pw, ph, pageSize === 'fit-to-image' ? 0 : 20)
        page.drawImage(img, { x: dims.x, y: dims.y, width: dims.width, height: dims.height })
        onProgress?.(i, Math.round(((i + 1) / files.length) * 90))
      } catch {
        // skip failed images in combined mode
      }
    }
    const pdfBytes = await doc.save()
    results.push(new File([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], 'heic-combined.pdf', { type: 'application/pdf' }))
  } else {
    for (let i = 0; i < files.length; i++) {
      try {
        const { bytes, width, height } = await decodeHeic(files[i])
        const [pw, ph] = getPageDims(pageSize, width, height)
        const doc = await PDFDocument.create()
        const page = doc.addPage([pw, ph])
        const img = await doc.embedPng(bytes)
        const dims = scaleToFit(width, height, pw, ph, pageSize === 'fit-to-image' ? 0 : 20)
        page.drawImage(img, { x: dims.x, y: dims.y, width: dims.width, height: dims.height })
        const pdfBytes = await doc.save()
        const basename = files[i].name.replace(/\.(heic|heif)$/i, '')
        results.push(new File([new Uint8Array(pdfBytes.buffer as ArrayBuffer)], `${basename}.pdf`, { type: 'application/pdf' }))
        onProgress?.(i, 100)
      } catch (err) {
        results.push(err instanceof Error ? err : new Error(String(err)))
      }
    }
  }

  return results
}

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
