import type { AnalyzeResult, AnalyzeSuccess, TagGroup, TagRow, GpsFix } from './exif-viewer.types'
import { auditPrivacy } from './exif-viewer-privacy'
import { detectAiSignatures } from './exif-viewer-ai'

const NO_EXIF_MIME = new Set(['image/gif', 'image/bmp', 'image/svg+xml'])

/**
 * Reads metadata from a batch of image files using exifr. Sequential on the
 * main thread; batches >5 files can be moved to a Worker pool in a later pass.
 */
export async function analyzeFiles(
  files: File[],
  onProgress?: (i: number, pct: number) => void,
  onResult?: (i: number, r: AnalyzeResult) => void,
): Promise<AnalyzeResult[]> {
  const { parse, thumbnail } = await import('exifr')
  const results: AnalyzeResult[] = []

  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    onProgress?.(i, 10)

    if (NO_EXIF_MIME.has(f.type)) {
      const r: AnalyzeResult = {
        ok: false,
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type,
        reason: 'unsupported-format',
        message: `${f.type || 'This format'} does not carry EXIF metadata.`,
      }
      results.push(r); onResult?.(i, r); onProgress?.(i, 100); continue
    }

    try {
      const raw = (await parse(f, {
        tiff: true, xmp: true, icc: true, iptc: true, jfif: true, ihdr: true,
        mergeOutput: true,
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
        sanitize: true,
      })) as Record<string, unknown> | undefined

      onProgress?.(i, 60)

      if (!raw || Object.keys(raw).length === 0) {
        const r: AnalyzeResult = {
          ok: false,
          fileName: f.name,
          fileSize: f.size,
          mimeType: f.type,
          reason: 'no-metadata',
          message: 'No metadata found. The file may have been stripped or exported without EXIF.',
        }
        results.push(r); onResult?.(i, r); onProgress?.(i, 100); continue
      }

      let thumbnailDataUrl: string | undefined
      try {
        const thumbBuf = await thumbnail(f)
        if (thumbBuf) thumbnailDataUrl = await bufferToDataUrl(thumbBuf, 'image/jpeg')
      } catch { /* thumbnail is optional */ }

      const gps: GpsFix | undefined =
        typeof raw.latitude === 'number' && typeof raw.longitude === 'number'
          ? {
              lat: raw.latitude as number,
              lon: raw.longitude as number,
              altitude: typeof raw.GPSAltitude === 'number' ? (raw.GPSAltitude as number) : undefined,
              direction: typeof raw.GPSImgDirection === 'number' ? (raw.GPSImgDirection as number) : undefined,
              timestampIso: raw.GPSDateStamp ? String(raw.GPSDateStamp) : undefined,
            }
          : undefined

      const hasC2pa = 'jumbf' in raw || 'C2PA' in raw

      const success: AnalyzeSuccess = {
        ok: true,
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type,
        width: numOrUndef(raw.ImageWidth ?? raw.ExifImageWidth),
        height: numOrUndef(raw.ImageHeight ?? raw.ExifImageHeight),
        thumbnailDataUrl,
        groups: buildGroups(raw),
        gps,
        privacyFlags: auditPrivacy(raw),
        aiSignatures: detectAiSignatures(raw, { hasC2pa }),
        raw,
      }
      results.push(success); onResult?.(i, success); onProgress?.(i, 100)
    } catch (err) {
      const r: AnalyzeResult = {
        ok: false,
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type,
        reason: 'parse-error',
        message: err instanceof Error ? err.message : 'Could not read metadata.',
      }
      results.push(r); onResult?.(i, r); onProgress?.(i, 100)
    }
  }
  return results
}

function numOrUndef(v: unknown): number | undefined {
  return typeof v === 'number' ? v : undefined
}

async function bufferToDataUrl(buf: ArrayBuffer | Uint8Array, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buf as BlobPart], { type: mime })
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

interface GroupDef { key: TagGroup['key']; title: string; tags: string[] }
const GROUP_DEFS: GroupDef[] = [
  { key: 'camera',       title: 'Camera & Lens',      tags: ['Make', 'Model', 'LensModel', 'LensMake', 'SerialNumber', 'LensSerialNumber', 'BodySerialNumber'] },
  { key: 'exposure',     title: 'Exposure',           tags: ['ISO', 'FNumber', 'ExposureTime', 'FocalLength', 'FocalLengthIn35mmFormat', 'ExposureProgram', 'MeteringMode', 'Flash', 'WhiteBalance'] },
  { key: 'gps',          title: 'GPS',                tags: ['latitude', 'longitude', 'GPSAltitude', 'GPSImgDirection', 'GPSSpeed', 'GPSDateStamp'] },
  { key: 'dateTime',     title: 'Date & Time',        tags: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'OffsetTimeOriginal', 'OffsetTime'] },
  { key: 'software',     title: 'Software & Editing', tags: ['Software', 'HostComputer', 'ProcessingSoftware', 'xmpMM:History'] },
  { key: 'aiProvenance', title: 'AI & Provenance',    tags: ['parameters', 'prompt', 'workflow', 'xmp:CreatorTool', 'dc:creator'] },
  { key: 'iptc',         title: 'IPTC',               tags: ['By-line', 'Copyright', 'Caption', 'Keywords', 'Location', 'Source', 'Artist'] },
  { key: 'color',        title: 'Color',              tags: ['ColorSpace', 'ProfileDescription', 'Gamma'] },
]

function buildGroups(raw: Record<string, unknown>): TagGroup[] {
  const used = new Set<string>()
  const groups: TagGroup[] = []
  for (const def of GROUP_DEFS) {
    const rows: TagRow[] = []
    for (const tag of def.tags) {
      const v = raw[tag]
      if (v === undefined || v === null || v === '') continue
      used.add(tag)
      rows.push({ label: humanize(tag), value: formatValue(v), raw: v })
    }
    if (rows.length > 0) groups.push({ key: def.key, title: def.title, rows })
  }
  const rawRows: TagRow[] = []
  for (const [k, v] of Object.entries(raw)) {
    if (used.has(k) || v === undefined || v === null || v === '') continue
    rawRows.push({ label: k, value: formatValue(v), raw: v })
  }
  if (rawRows.length > 0) groups.push({ key: 'raw', title: 'All other tags', rows: rawRows })
  return groups
}

function humanize(tag: string): string {
  return tag.replace(/^xmp:|^dc:|^xmpMM:/, '').replace(/([A-Z])/g, ' $1').replace(/^\s/, '').trim()
}

function formatValue(v: unknown): string {
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/\.?0+$/, '')
  if (Array.isArray(v)) return v.map(formatValue).join(', ')
  if (v && typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
