import { PDFDocument, PDFRawStream, PDFName, PDFNumber } from 'pdf-lib'
import { getPageCount, renderPage, renderPagePng } from './mupdf-client'
import { formatBytes } from '@/lib/utils/download'
import type { ConversionResult, ToolOptions, CompressionMeta } from '@/lib/types'

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
  fileName: string
): Promise<File> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  if (level === 'medium' || level === 'high') {
    doc.setTitle('')
    doc.setAuthor('')
    doc.setSubject('')
    doc.setKeywords([])
    doc.setProducer('')
    doc.setCreator('')
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

// ── Target-size compression ───────────────────────────────────────────────────

export async function compressPdfToTargetSize(
  input: File,
  targetBytes: number,
  onProgress?: (pct: number) => void
): Promise<{ file: File; meta: CompressionMeta }> {
  const originalBytes = input.size
  let bestFile = input

  // Pass 1: structural — strip metadata + optimise object streams
  onProgress?.(10)
  let structuralBuffer = await input.arrayBuffer()
  try {
    const structural = await compressStructural(structuralBuffer, 'medium', input.name)
    if (structural.size < bestFile.size) bestFile = structural
    structuralBuffer = await structural.arrayBuffer()
  } catch { /* continue */ }

  if (bestFile.size <= targetBytes) {
    onProgress?.(100)
    return makeTargetResult(input, bestFile, targetBytes, originalBytes)
  }

  // Passes 2–3: JPEG re-encode at two quality levels.
  // Both start from structuralBuffer to avoid cumulative generation loss.
  const jpegQualities = [70, 40]
  for (let i = 0; i < jpegQualities.length; i++) {
    onProgress?.(Math.round(20 + (i + 1) * 10))
    try {
      const candidate = await recompressImages(structuralBuffer, jpegQualities[i], input.name)
      if (candidate.size < bestFile.size) bestFile = candidate
    } catch { /* continue */ }
    if (bestFile.size <= targetBytes) break
  }

  if (bestFile.size <= targetBytes) {
    onProgress?.(100)
    return makeTargetResult(input, bestFile, targetBytes, originalBytes)
  }

  // Passes 4–7: rasterise at decreasing DPI.
  // Handles non-JPEG images (PNG, CCITT) that JPEG re-encoding cannot touch.
  const rasterPasses: Array<{ dpi: number; quality: number }> = [
    { dpi: 150, quality: 80 },
    { dpi: 120, quality: 75 },
    { dpi: 96,  quality: 70 },
    { dpi: 72,  quality: 65 },
  ]
  for (let i = 0; i < rasterPasses.length; i++) {
    onProgress?.(Math.round(40 + (i + 1) * 13))
    try {
      const { dpi, quality } = rasterPasses[i]
      const candidate = await rasterizeForTarget(structuralBuffer, input.name, dpi, quality)
      if (candidate.size < bestFile.size) bestFile = candidate
    } catch { /* continue */ }
    if (bestFile.size <= targetBytes) break
  }

  onProgress?.(100)
  return makeTargetResult(input, bestFile, targetBytes, originalBytes)
}

function makeTargetResult(
  input: File,
  bestFile: File,
  targetBytes: number,
  originalBytes: number
): { file: File; meta: CompressionMeta } {
  const reachedTarget = bestFile.size <= targetBytes
  return {
    file: bestFile,
    meta: {
      originalBytes,
      targetBytes,
      achievedBytes: bestFile.size,
      reachedTarget,
      message: reachedTarget
        ? undefined
        : `Couldn't reach ${formatBytes(targetBytes)} — smallest possible is ${formatBytes(bestFile.size)}`,
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
        if (level === 'aggressive') {
          onProgress?.(i, 10)
          const file = await rasterizePdf(files[i], 96, files[i].name)
          onProgress?.(i, 100)
          results.push(file)
        } else {
          onProgress?.(i, 10)
          const buffer = await files[i].arrayBuffer()
          const file = await compressStructural(buffer, level, files[i].name)
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
