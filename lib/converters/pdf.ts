import { PDFDocument, PDFRawStream, PDFName, PDFNumber, PDFDict, degrees, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib'
import { getPageCount, renderPage, renderPagePng, extractText, extractStructuredText } from './mupdf-client'
import { formatBytes } from '@/lib/utils/download'
import type { ConversionResult, ToolOptions, CompressionMeta } from '@/lib/types'
import { convertPdfToWord } from './pdf-to-word'

// ── Merge ─────────────────────────────────────────────────────────────────────

export async function mergePDFs(
  files: File[],
  _options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  if (files.length === 0) return []

  const merged = await PDFDocument.create()

  for (let i = 0; i < files.length; i++) {
    onProgress?.(0, Math.round((i / files.length) * 80))
    const buffer = await files[i].arrayBuffer()
    const srcDoc = await PDFDocument.load(buffer)
    const pageIndices = srcDoc.getPageIndices()
    const copied = await merged.copyPages(srcDoc, pageIndices)
    for (const page of copied) merged.addPage(page)
  }

  onProgress?.(0, 90)
  const bytes = await merged.save({ useObjectStreams: true })
  onProgress?.(0, 100)

  const baseName = files[0].name.replace(/\.[^.]+$/, '')
  const outName = files.length === 1 ? files[0].name : `${baseName}-merged.pdf`
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
          const file = await compressStructural(buffer, level, files[i].name, advancedStrip)
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

      for (let p = startIdx; p <= endIdx; p++) {
        const pngBuffer = await renderPagePng(buffer, p, dpi, transparent)
        const isAllPages = pageFrom === 1 && pageToOpt >= pageCount
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
  let pageW: number, pageH: number
  if (pageSize === 'a4') {
    pageW = 595; pageH = 842
  } else if (pageSize === 'letter') {
    pageW = 612; pageH = 792
  } else {
    // fit-to-image: use pixel dimensions directly (1 pt = 1 px at 72 DPI)
    pageW = width; pageH = height
  }

  const page = doc.addPage([pageW, pageH])

  if (pageSize !== 'fit-to-image') {
    // Swap page dimensions based on orientation
    const isLandscapeImage = width > height
    const wantLandscape =
      orientation === 'landscape' ||
      (orientation === 'auto' && isLandscapeImage)
    if (wantLandscape && pageH > pageW) {
      ;[pageW, pageH] = [pageH, pageW]
    } else if (!wantLandscape && pageW > pageH) {
      ;[pageW, pageH] = [pageH, pageW]
    }
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
  } else {
    page.drawImage(image, { x: 0, y: 0, width: pageW, height: pageH })
  }
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

  const spans: Array<{ text: string; x: number; y: number }> = []
  for (const block of pageData.blocks ?? []) {
    for (const line of block.lines ?? []) {
      const lineText = typeof line.text === 'string' ? line.text.trim() : ''
      if (lineText && typeof line.x === 'number' && typeof line.y === 'number') {
        spans.push({ text: lineText, x: line.x, y: line.y })
        continue
      }
      for (const span of line.spans ?? []) {
        const text = span.text?.trim()
        if (!text || !span.bbox || span.bbox.length < 4) continue
        const [x0, y0, , y1] = span.bbox
        spans.push({ text, x: x0, y: (y0 + y1) / 2 })
      }
    }
  }
  if (spans.length === 0) return []

  const sorted = [...spans].sort((a, b) => a.y - b.y)
  const gaps = sorted.slice(1).map((s, i) => s.y - sorted[i].y).filter(g => g > 0)
  const lineHeightEst = gaps.length ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 12
  // Use 2.5× median gap as row-merge tolerance so wrapped multi-line cells stay in the same row.
  // Rolling anchor (rowY updates on every span) ensures the check is always against the nearest preceding span.
  const tolerance = Math.max(lineHeightEst * 2.5, 6)

  const rowGroups: Array<typeof spans> = []
  let currentRow: typeof spans = []
  let rowY = sorted[0].y

  for (const span of sorted) {
    if (span.y - rowY > tolerance) {
      if (currentRow.length > 0) rowGroups.push(currentRow)
      currentRow = [span]
    } else {
      currentRow.push(span)
    }
    rowY = span.y  // rolling anchor: always track the most recent y
  }
  if (currentRow.length > 0) rowGroups.push(currentRow)

  // Within each row, group spans at the same x-position (±5 px) — these are wrapped lines of
  // the same cell — and join them with a space.
  return rowGroups.map(rowSpans => {
    const byX = rowSpans.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y)
    const colGroups: Array<{ x: number; texts: string[] }> = []
    for (const span of byX) {
      const last = colGroups[colGroups.length - 1]
      if (last && Math.abs(span.x - last.x) <= 5) {
        last.texts.push(span.text)
      } else {
        colGroups.push({ x: span.x, texts: [span.text] })
      }
    }
    return colGroups.map(g => g.texts.join(' '))
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
