import type { AnalyzeResult, AnalyzeSuccess, TagGroup, TagRow } from './exif-viewer.types'
import { detectAiSignatures } from './exif-viewer-ai'
import { auditPrivacy } from './exif-viewer-privacy'

export async function analyzePdf(file: File): Promise<AnalyzeResult> {
  try {
    const { PDFDocument, PDFName, PDFString, PDFHexString } = await import('pdf-lib')
    const bytes = new Uint8Array(await file.arrayBuffer())
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true })

    const raw: Record<string, unknown> = {}

    const info: Record<string, string | undefined> = {
      Title: pdf.getTitle(),
      Author: pdf.getAuthor(),
      Subject: pdf.getSubject(),
      Keywords: pdf.getKeywords(),
      Creator: pdf.getCreator(),
      Producer: pdf.getProducer(),
      CreationDate: pdf.getCreationDate()?.toISOString(),
      ModificationDate: pdf.getModificationDate()?.toISOString(),
    }
    for (const [k, v] of Object.entries(info)) {
      if (v !== undefined && v !== '') raw[k] = v
    }
    raw.PageCount = pdf.getPageCount()
    raw.PdfVersion = (pdf as unknown as { context: { header: { toString(): string } } }).context.header.toString().replace('%', '')

    let xmpText: string | undefined
    try {
      const catalog = pdf.catalog
      const metaRef = catalog.get(PDFName.of('Metadata'))
      if (metaRef) {
        const metaStream = pdf.context.lookup(metaRef) as unknown as { contents?: Uint8Array; getContents?: () => Uint8Array }
        const contents = typeof metaStream.getContents === 'function' ? metaStream.getContents() : metaStream.contents
        if (contents) xmpText = new TextDecoder().decode(contents)
      }
    } catch { /* xmp is optional */ }

    if (xmpText) {
      const xmp = parseXmp(xmpText)
      for (const [k, v] of Object.entries(xmp)) {
        if (!(k in raw) && v) raw[k] = v
      }
    }

    void PDFString; void PDFHexString

    const success: AnalyzeSuccess = {
      ok: true,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/pdf',
      groups: buildPdfGroups(raw),
      privacyFlags: auditPrivacy(raw),
      aiSignatures: detectAiSignatures(raw, { hasC2pa: 'c2pa' in raw || 'jumbf' in raw }),
      raw,
    }
    return success
  } catch (err) {
    return {
      ok: false,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/pdf',
      reason: 'parse-error',
      message: err instanceof Error ? err.message : 'Could not read PDF metadata.',
    }
  }
}

function parseXmp(xml: string): Record<string, string> {
  const out: Record<string, string> = {}
  const patterns: [string, RegExp][] = [
    ['xmp:CreatorTool', /<xmp:CreatorTool>([^<]+)<\/xmp:CreatorTool>/],
    ['xmp:CreateDate', /<xmp:CreateDate>([^<]+)<\/xmp:CreateDate>/],
    ['xmp:ModifyDate', /<xmp:ModifyDate>([^<]+)<\/xmp:ModifyDate>/],
    ['xmp:MetadataDate', /<xmp:MetadataDate>([^<]+)<\/xmp:MetadataDate>/],
    ['dc:creator', /<dc:creator>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/],
    ['dc:title', /<dc:title>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/],
    ['dc:description', /<dc:description>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/],
    ['dc:rights', /<dc:rights>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/],
    ['pdf:Producer', /<pdf:Producer>([^<]+)<\/pdf:Producer>/],
    ['pdf:Keywords', /<pdf:Keywords>([^<]+)<\/pdf:Keywords>/],
    ['pdfaid:part', /<pdfaid:part>([^<]+)<\/pdfaid:part>/],
    ['pdfaid:conformance', /<pdfaid:conformance>([^<]+)<\/pdfaid:conformance>/],
  ]
  for (const [k, re] of patterns) {
    const m = xml.match(re)
    if (m) out[k] = m[1].trim()
  }
  if (/urn:c2pa:|<c2pa:/i.test(xml)) out.c2pa = 'C2PA manifest referenced in XMP'
  return out
}

const PDF_GROUP_DEFS: { key: TagGroup['key']; title: string; tags: string[] }[] = [
  { key: 'document', title: 'Document Info', tags: ['Title', 'Author', 'Subject', 'Keywords', 'PageCount', 'PdfVersion', 'pdfaid:part', 'pdfaid:conformance'] },
  { key: 'software', title: 'Software & Editing', tags: ['Creator', 'Producer', 'xmp:CreatorTool', 'pdf:Producer'] },
  { key: 'dateTime', title: 'Date & Time', tags: ['CreationDate', 'ModificationDate', 'xmp:CreateDate', 'xmp:ModifyDate', 'xmp:MetadataDate'] },
  { key: 'iptc', title: 'Rights & Credits', tags: ['dc:creator', 'dc:title', 'dc:description', 'dc:rights'] },
  { key: 'aiProvenance', title: 'AI & Provenance', tags: ['c2pa'] },
]

function buildPdfGroups(raw: Record<string, unknown>): TagGroup[] {
  const used = new Set<string>()
  const groups: TagGroup[] = []
  for (const def of PDF_GROUP_DEFS) {
    const rows: TagRow[] = []
    for (const tag of def.tags) {
      const v = raw[tag]
      if (v === undefined || v === null || v === '') continue
      used.add(tag)
      rows.push({ label: humanize(tag), value: String(v), raw: v })
    }
    if (rows.length > 0) groups.push({ key: def.key, title: def.title, rows })
  }
  const rest: TagRow[] = []
  for (const [k, v] of Object.entries(raw)) {
    if (used.has(k) || v === undefined || v === null || v === '') continue
    rest.push({ label: k, value: String(v), raw: v })
  }
  if (rest.length > 0) groups.push({ key: 'raw', title: 'All other tags', rows: rest })
  return groups
}

function humanize(tag: string): string {
  return tag.replace(/^xmp:|^dc:|^pdf:|^pdfaid:/, '').replace(/([A-Z])/g, ' $1').replace(/^\s/, '').trim()
}
