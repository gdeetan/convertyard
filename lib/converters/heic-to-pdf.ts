import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { ConversionResult, ToolOptions } from '@/lib/types'

export type HeicOutputMode = 'all-in-one' | 'one-per-image'
export type HeicPageSize = 'fit-to-image' | 'a4' | 'letter' | 'legal'
export type HeicOrientation = 'auto' | 'portrait' | 'landscape'
export type HeicMargin = 'none' | 'small' | 'large'
export type HeicCaptions = 'none' | 'filename' | 'date'
export type HeicLivePhoto = 'still' | 'all-stills'
export type HeicQualityPreset = 'print' | 'share' | 'portal'

export interface HeicPdfSettings {
  outputMode: HeicOutputMode
  pageSize: HeicPageSize
  orientation: HeicOrientation
  margin: HeicMargin
  jpegQuality: number
  maxEdge: number
  captions: HeicCaptions
  stripGps: boolean
  livePhoto: HeicLivePhoto
  targetBytes: number
  pageRotations: number[]
}

export interface DecodedHeicFrame {
  blob: Blob
  width: number
  height: number
}

export interface HeicExif {
  date?: Date
  latitude?: number
  longitude?: number
}

export interface RasterizedFrame {
  bytes: Uint8Array
  width: number
  height: number
  kind: 'jpeg' | 'png'
}

export interface HeicPdfDeps {
  decodeHeic?: (file: File, multiple: boolean) => Promise<DecodedHeicFrame[]>
  readExif?: (file: File) => Promise<HeicExif>
  rasterize?: (frame: DecodedHeicFrame, rotation: number, jpegQuality: number, maxEdge: number) => Promise<RasterizedFrame>
}

const QUALITY_PRESETS: Record<HeicQualityPreset, { jpegQuality: number; maxEdge: number }> = {
  print: { jpegQuality: 0.92, maxEdge: 0 },
  share: { jpegQuality: 0.8, maxEdge: 2048 },
  portal: { jpegQuality: 0.72, maxEdge: 1600 },
}

const MARGIN_PT: Record<HeicMargin, number> = {
  none: 0,
  small: 18,
  large: 36,
}

const PAPER: Record<Exclude<HeicPageSize, 'fit-to-image'>, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
}

const CAPTION_BAND = 18
const MIN_JPEG_QUALITY = 0.4
const MIN_MAX_EDGE = 400

export function resolveHeicPdfOptions(options: ToolOptions): HeicPdfSettings {
  const rawMode = String(options.outputMode ?? 'all-in-one')
  const outputMode: HeicOutputMode =
    rawMode === 'per-image' || rawMode === 'one-per-image' ? 'one-per-image' : 'all-in-one'

  const rawSize = String(options.pageSize ?? 'a4').toLowerCase()
  const pageSize: HeicPageSize =
    rawSize === 'fit-to-image' ? 'fit-to-image'
    : rawSize === 'letter' ? 'letter'
    : rawSize === 'legal' ? 'legal'
    : 'a4'

  const orientation = (['auto', 'portrait', 'landscape'].includes(String(options.orientation))
    ? options.orientation
    : 'auto') as HeicOrientation

  const margin = (['none', 'small', 'large'].includes(String(options.margin))
    ? options.margin
    : 'small') as HeicMargin

  const preset = (['print', 'share', 'portal'].includes(String(options.qualityPreset))
    ? options.qualityPreset
    : 'share') as HeicQualityPreset

  const captions = (['none', 'filename', 'date'].includes(String(options.captions))
    ? options.captions
    : 'none') as HeicCaptions

  const livePhoto = options.livePhoto === 'all-stills' ? 'all-stills' : 'still'
  const maxSizeKb = typeof options.maxSizeKb === 'number' ? options.maxSizeKb : 0
  const rotations = Array.isArray(options.pageRotations)
    ? (options.pageRotations as number[]).map((d) => ((Number(d) % 360) + 360) % 360)
    : []

  return {
    outputMode,
    pageSize,
    orientation,
    margin,
    jpegQuality: QUALITY_PRESETS[preset].jpegQuality,
    maxEdge: QUALITY_PRESETS[preset].maxEdge,
    captions,
    stripGps: options.stripGps !== false,
    livePhoto,
    targetBytes: maxSizeKb > 0 ? Math.round(maxSizeKb * 1024) : 0,
    pageRotations: rotations,
  }
}

export function pageSizePoints(
  pageSize: HeicPageSize,
  imgW: number,
  imgH: number,
  orientation: HeicOrientation,
): [number, number] {
  if (pageSize === 'fit-to-image') return [imgW, imgH]
  let [pageW, pageH] = PAPER[pageSize]
  const isLandscapeImage = imgW > imgH
  const wantLandscape =
    orientation === 'landscape' || (orientation === 'auto' && isLandscapeImage)
  if (wantLandscape && pageH > pageW) return [pageH, pageW]
  if (!wantLandscape && pageW > pageH) return [pageH, pageW]
  return [pageW, pageH]
}

export function fitImageOnPage(
  imgW: number,
  imgH: number,
  pageW: number,
  pageH: number,
  margin: number,
): { width: number; height: number; x: number; y: number } {
  const availW = Math.max(1, pageW - 2 * margin)
  const availH = Math.max(1, pageH - 2 * margin)
  const scale = Math.min(availW / imgW, availH / imgH)
  const width = imgW * scale
  const height = imgH * scale
  return {
    width,
    height,
    x: (pageW - width) / 2,
    y: (pageH - height) / 2,
  }
}

export function downsampleSize(width: number, height: number, maxEdge: number): { width: number; height: number } {
  if (!maxEdge || maxEdge <= 0) return { width, height }
  const long = Math.max(width, height)
  if (long <= maxEdge) return { width, height }
  const scale = maxEdge / long
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

export function applyRotationSize(width: number, height: number, degrees: number): { width: number; height: number } {
  const deg = ((degrees % 360) + 360) % 360
  if (deg === 90 || deg === 270) return { width: height, height: width }
  return { width, height }
}

export function captionText(mode: HeicCaptions, fileName: string, date?: Date): string | null {
  if (mode === 'none') return null
  if (mode === 'date') {
    if (!date || Number.isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 10)
  }
  const base = fileName.split(/[/\\]/).pop() ?? fileName
  return base.replace(/\.(heic|heif|hif)$/i, '')
}

export function selectHeicFrames<T>(frames: T[], mode: HeicLivePhoto): T[] {
  if (frames.length === 0) return frames
  return mode === 'all-stills' ? frames : [frames[0]]
}

export function sortFilesByExifDate(files: File[], dates: Array<Date | undefined>): File[] {
  return files
    .map((file, index) => ({ file, index, time: dates[index]?.getTime() ?? file.lastModified }))
    .sort((a, b) => a.time - b.time || a.index - b.index)
    .map((row) => row.file)
}

export function buildPdfMetadata(input: {
  stripGps: boolean
  title: string
  latitude?: number
  longitude?: number
}): { title: string; keywords?: string } {
  if (input.stripGps || input.latitude == null || input.longitude == null) {
    return { title: input.title }
  }
  return {
    title: input.title,
    keywords: `${input.latitude},${input.longitude}`,
  }
}

export function nextSizeAttempt(jpegQuality: number, maxEdge: number): { jpegQuality: number; maxEdge: number } {
  const nextQuality = Math.max(MIN_JPEG_QUALITY, Math.round((jpegQuality - 0.08) * 100) / 100)
  const edgeBase = maxEdge > 0 ? maxEdge : 2048
  const nextEdge = Math.max(MIN_MAX_EDGE, Math.round(edgeBase * 0.85))
  return { jpegQuality: nextQuality, maxEdge: nextEdge }
}

function marginPt(pageSize: HeicPageSize, margin: HeicMargin, hasCaption: boolean): { box: number; caption: number } {
  const box = pageSize === 'fit-to-image' ? 0 : MARGIN_PT[margin]
  return { box, caption: hasCaption ? CAPTION_BAND : 0 }
}

async function defaultDecodeHeic(file: File, multiple: boolean): Promise<DecodedHeicFrame[]> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.95,
    ...(multiple ? { multiple: true as const } : {}),
  })
  const blobs = (Array.isArray(result) ? result : [result]) as Blob[]
  const frames: DecodedHeicFrame[] = []
  for (const blob of blobs) {
    const bmp = await createImageBitmap(blob)
    frames.push({ blob, width: bmp.width, height: bmp.height })
    bmp.close()
  }
  if (frames.length === 0) throw new Error(`Could not decode ${file.name}`)
  return frames
}

async function defaultReadExif(file: File): Promise<HeicExif> {
  try {
    const { parse } = await import('exifr')
    const raw = (await parse(file, {
      pick: ['DateTimeOriginal', 'DateTime', 'CreateDate', 'GPSLatitude', 'GPSLongitude', 'latitude', 'longitude'],
      translateKeys: true,
      reviveValues: true,
    })) as Record<string, unknown> | undefined
    if (!raw) return {}
    const dateVal = raw.DateTimeOriginal ?? raw.CreateDate ?? raw.DateTime
    const date = dateVal instanceof Date ? dateVal : typeof dateVal === 'string' ? new Date(dateVal) : undefined
    const latitude = typeof raw.latitude === 'number' ? raw.latitude : undefined
    const longitude = typeof raw.longitude === 'number' ? raw.longitude : undefined
    return {
      date: date && !Number.isNaN(date.getTime()) ? date : undefined,
      latitude,
      longitude,
    }
  } catch {
    return {}
  }
}

async function defaultRasterize(
  frame: DecodedHeicFrame,
  rotation: number,
  jpegQuality: number,
  maxEdge: number,
): Promise<RasterizedFrame> {
  const bmp = await createImageBitmap(frame.blob)
  try {
    const rotated = applyRotationSize(bmp.width, bmp.height, rotation)
    const sized = downsampleSize(rotated.width, rotated.height, maxEdge)
    const canvas = new OffscreenCanvas(sized.width, sized.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D canvas context')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, sized.width, sized.height)
    const deg = ((rotation % 360) + 360) % 360
    if (deg === 0) {
      ctx.drawImage(bmp, 0, 0, sized.width, sized.height)
    } else {
      ctx.translate(sized.width / 2, sized.height / 2)
      ctx.rotate((deg * Math.PI) / 180)
      const srcW = deg === 180 ? sized.width : sized.height
      const srcH = deg === 180 ? sized.height : sized.width
      ctx.drawImage(bmp, -srcW / 2, -srcH / 2, srcW, srcH)
    }
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: jpegQuality })
    const bytes = new Uint8Array(await blob.arrayBuffer())
    return { bytes, width: sized.width, height: sized.height, kind: 'jpeg' }
  } finally {
    bmp.close()
  }
}

async function embedRaster(
  doc: PDFDocument,
  raster: RasterizedFrame,
  settings: HeicPdfSettings,
  caption: string | null,
): Promise<void> {
  const image = raster.kind === 'png'
    ? await doc.embedPng(raster.bytes)
    : await doc.embedJpg(raster.bytes)
  const { box, caption: captionBand } = marginPt(settings.pageSize, settings.margin, !!caption)
  let [pageW, pageH] = pageSizePoints(settings.pageSize, raster.width, raster.height, settings.orientation)
  if (settings.pageSize === 'fit-to-image' && captionBand > 0) pageH += captionBand
  const page = doc.addPage([pageW, pageH])
  const placed = fitImageOnPage(raster.width, raster.height, pageW, pageH - captionBand, box)
  page.drawImage(image, {
    x: placed.x,
    y: placed.y + captionBand,
    width: placed.width,
    height: placed.height,
  })
  if (caption) {
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const size = 9
    const textW = font.widthOfTextAtSize(caption, size)
    const x = Math.max(box, (pageW - textW) / 2)
    page.drawText(caption, {
      x,
      y: Math.max(4, (captionBand - size) / 2),
      size,
      font,
      color: rgb(0.25, 0.25, 0.25),
    })
  }
}

async function buildDocument(
  pages: Array<{ raster: RasterizedFrame; caption: string | null }>,
  settings: HeicPdfSettings,
  meta: { title: string; keywords?: string },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(meta.title)
  if (meta.keywords) doc.setKeywords(meta.keywords.split(','))
  for (const page of pages) {
    await embedRaster(doc, page.raster, settings, page.caption)
  }
  if (doc.getPageCount() === 0) throw new Error('No images could be embedded')
  return await doc.save({ useObjectStreams: true, addDefaultPage: false })
}

interface PreparedPage {
  fileIndex: number
  file: File
  raster: RasterizedFrame
  caption: string | null
  exif: HeicExif
}

async function preparePages(
  files: File[],
  settings: HeicPdfSettings,
  deps: Required<HeicPdfDeps>,
  jpegQuality: number,
  maxEdge: number,
  onProgress?: (fileIndex: number, pct: number) => void,
): Promise<{ pages: PreparedPage[]; errors: Array<{ fileIndex: number; error: Error }> }> {
  const pages: PreparedPage[] = []
  const errors: Array<{ fileIndex: number; error: Error }> = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const rotation = settings.pageRotations[i] ?? 0
    try {
      const frames = selectHeicFrames(
        await deps.decodeHeic(file, settings.livePhoto === 'all-stills'),
        settings.livePhoto,
      )
      const exif = await deps.readExif(file)
      const caption = captionText(settings.captions, file.name, exif.date)
      for (const frame of frames) {
        const raster = await deps.rasterize(frame, rotation, jpegQuality, maxEdge)
        pages.push({ fileIndex: i, file, raster, caption, exif })
      }
      onProgress?.(i, Math.round(((i + 1) / files.length) * 85))
    } catch (err) {
      errors.push({ fileIndex: i, error: err instanceof Error ? err : new Error(String(err)) })
    }
  }

  return { pages, errors }
}

function pdfFile(bytes: Uint8Array, name: string): File {
  return new File([new Uint8Array(bytes)], name, { type: 'application/pdf' })
}

async function saveWithSizeTarget(
  pages: PreparedPage[],
  files: File[],
  settings: HeicPdfSettings,
  deps: Required<HeicPdfDeps>,
  meta: { title: string; keywords?: string },
): Promise<Uint8Array> {
  let quality = settings.jpegQuality
  let maxEdge = settings.maxEdge
  let working = pages
  let bytes = await buildDocument(working.map((p) => ({ raster: p.raster, caption: p.caption })), settings, meta)
  if (settings.targetBytes <= 0) return bytes

  for (let attempt = 0; attempt < 6 && bytes.byteLength > settings.targetBytes; attempt++) {
    const next = nextSizeAttempt(quality, maxEdge)
    if (next.jpegQuality === quality && next.maxEdge === maxEdge) break
    quality = next.jpegQuality
    maxEdge = next.maxEdge
    const retry = await preparePages(files, settings, deps, quality, maxEdge)
    if (retry.pages.length === 0) break
    working = retry.pages
    bytes = await buildDocument(working.map((p) => ({ raster: p.raster, caption: p.caption })), settings, meta)
  }

  return bytes
}

export async function heicToPdf(
  files: File[],
  options: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  _onResult?: (fileIndex: number, result: ConversionResult) => void,
  deps: HeicPdfDeps = {},
): Promise<ConversionResult[]> {
  const settings = resolveHeicPdfOptions(options)
  const resolved: Required<HeicPdfDeps> = {
    decodeHeic: deps.decodeHeic ?? defaultDecodeHeic,
    readExif: deps.readExif ?? defaultReadExif,
    rasterize: deps.rasterize ?? defaultRasterize,
  }

  const { pages, errors } = await preparePages(
    files,
    settings,
    resolved,
    settings.jpegQuality,
    settings.maxEdge,
    onProgress,
  )

  const errorByIndex = new Map(errors.map((e) => [e.fileIndex, e.error]))

  if (settings.outputMode === 'one-per-image') {
    const results: ConversionResult[] = files.map((_, i) => errorByIndex.get(i) ?? new Error('Conversion failed'))
    const grouped = new Map<number, PreparedPage[]>()
    for (const page of pages) {
      const list = grouped.get(page.fileIndex) ?? []
      list.push(page)
      grouped.set(page.fileIndex, list)
    }
    for (const [fileIndex, group] of grouped) {
      try {
        const title = group[0].file.name.replace(/\.(heic|heif|hif)$/i, '')
        const meta = buildPdfMetadata({
          stripGps: settings.stripGps,
          title,
          latitude: group[0].exif.latitude,
          longitude: group[0].exif.longitude,
        })
        const bytes = await saveWithSizeTarget(group, [group[0].file], {
          ...settings,
          pageRotations: [settings.pageRotations[fileIndex] ?? 0],
        }, resolved, meta)
        results[fileIndex] = pdfFile(bytes, `${title}.pdf`)
        onProgress?.(fileIndex, 100)
      } catch (err) {
        results[fileIndex] = err instanceof Error ? err : new Error(String(err))
      }
    }
    return results
  }

  if (pages.length === 0) {
    return files.map((_, i) => errorByIndex.get(i) ?? new Error('No images could be embedded'))
  }

  const title = files.length === 1
    ? files[0].name.replace(/\.(heic|heif|hif)$/i, '')
    : 'heic-combined'
  const firstGps = pages.find((p) => p.exif.latitude != null && p.exif.longitude != null)?.exif
  const meta = buildPdfMetadata({
    stripGps: settings.stripGps,
    title,
    latitude: firstGps?.latitude,
    longitude: firstGps?.longitude,
  })
  const bytes = await saveWithSizeTarget(pages, files, settings, resolved, meta)
  const outName = files.length === 1 ? `${title}.pdf` : 'heic-combined.pdf'
  const file = pdfFile(bytes, outName)
  onProgress?.(files.length - 1, 100)

  const skipped = errors.length
  if (skipped > 0) {
    const names = errors.map((e) => files[e.fileIndex]?.name).filter(Boolean).join(', ')
    return [{ file, notice: `${skipped} file${skipped > 1 ? 's' : ''} skipped: ${names}` }]
  }
  return [file]
}
