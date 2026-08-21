import { zipSync, strToU8 } from 'fflate'
import type { AnalyzeResult, AnalyzeSuccess } from './exif-viewer.types'

const CSV_COLS = [
  'filename', 'size_bytes', 'width', 'height',
  'camera_make', 'camera_model', 'lens', 'iso', 'fnumber', 'exposure_time', 'focal_length',
  'date_original', 'gps_lat', 'gps_lon', 'gps_alt',
  'software', 'copyright', 'creator', 'ai_generator', 'privacy_flags',
] as const

export function buildCsv(results: AnalyzeResult[]): string {
  const rows: string[] = [CSV_COLS.join(',')]
  for (const r of results) rows.push(rowFor(r))
  return rows.join('\n') + '\n'
}

function rowFor(r: AnalyzeResult): string {
  const cells: Record<(typeof CSV_COLS)[number], unknown> = {
    filename: r.fileName, size_bytes: r.fileSize, width: '', height: '',
    camera_make: '', camera_model: '', lens: '', iso: '', fnumber: '', exposure_time: '',
    focal_length: '', date_original: '', gps_lat: '', gps_lon: '', gps_alt: '',
    software: '', copyright: '', creator: '', ai_generator: '', privacy_flags: '',
  }
  if (r.ok) {
    const raw = r.raw
    cells.width = r.width ?? ''
    cells.height = r.height ?? ''
    cells.camera_make = raw.Make ?? ''
    cells.camera_model = raw.Model ?? ''
    cells.lens = raw.LensModel ?? ''
    cells.iso = raw.ISO ?? ''
    cells.fnumber = raw.FNumber ?? ''
    cells.exposure_time = raw.ExposureTime ?? ''
    cells.focal_length = raw.FocalLength ?? ''
    cells.date_original = raw.DateTimeOriginal ? String(raw.DateTimeOriginal) : ''
    cells.gps_lat = r.gps?.lat ?? ''
    cells.gps_lon = r.gps?.lon ?? ''
    cells.gps_alt = r.gps?.altitude ?? ''
    cells.software = raw.Software ?? ''
    cells.copyright = raw.Copyright ?? ''
    cells.creator = raw.Artist ?? raw['dc:creator'] ?? ''
    cells.ai_generator = r.aiSignatures.map(s => s.generator).join(';')
    cells.privacy_flags = r.privacyFlags.map(f => `${f.severity}:${f.tag}`).join(';')
  }
  return CSV_COLS.map(c => esc(cells[c])).join(',')
}

function esc(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function buildHtmlReport(results: AnalyzeResult[]): Promise<string> {
  const parts = results.map(r => r.ok ? renderOk(r) : renderErr(r))
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>EXIF Report</title>
<style>body{font:14px system-ui;margin:2rem;max-width:900px}h2{margin-top:2rem}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #eee;padding:4px 8px;text-align:left;vertical-align:top}code{background:#f6f6f6;padding:0 3px}</style>
<h1>EXIF Report</h1>${parts.join('')}</html>`
}

function renderOk(r: AnalyzeSuccess): string {
  const rows = Object.entries(r.raw).map(([k, v]) =>
    `<tr><th>${escapeHtml(k)}</th><td><code>${escapeHtml(String(v))}</code></td></tr>`).join('')
  const privacy = r.privacyFlags.length
    ? '<ul>' + r.privacyFlags.map(f => `<li><b>${f.severity}</b>: ${escapeHtml(f.message)}</li>`).join('') + '</ul>'
    : '<p>No privacy concerns detected.</p>'
  return `<h2>${escapeHtml(r.fileName)}</h2>${privacy}<table>${rows}</table>`
}

function renderErr(r: Extract<AnalyzeResult, { ok: false }>): string {
  return `<h2>${escapeHtml(r.fileName)}</h2><p>${escapeHtml(r.message)}</p>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}

export async function buildJsonZip(results: AnalyzeResult[]): Promise<Blob> {
  const files: Record<string, Uint8Array> = {}
  for (const r of results) {
    const name = sanitize(r.fileName) + '.json'
    files[name] = strToU8(JSON.stringify(r, null, 2))
  }
  const zipped = zipSync(files)
  return new Blob([zipped as BlobPart], { type: 'application/zip' })
}

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]+/g, '_')
}
