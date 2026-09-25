import { readFileSync } from 'node:fs'
import { PDFDocument, PDFName, PDFRawStream, PDFDict, PDFArray } from 'pdf-lib'

const path = process.argv[2]
if (!path) {
  console.error('usage: node inspect-pdf-images.mjs <file.pdf>')
  process.exit(1)
}

const bytes = readFileSync(path)
const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })

const total = { count: 0, streamBytes: 0 }
const byFilter = new Map()
const rows = []

const pages = doc.getPages()
const pageBBoxes = pages.map(p => {
  const s = p.getSize()
  return { w: s.width, h: s.height }
})

const seen = new Set()
const context = doc.context
const indirects = context.enumerateIndirectObjects()

for (const [ref, obj] of indirects) {
  if (!(obj instanceof PDFRawStream)) continue
  const dict = obj.dict
  const subtype = dict.get(PDFName.of('Subtype'))
  if (subtype?.toString() !== '/Image') continue

  const filter = dict.get(PDFName.of('Filter'))
  let filterStr
  if (filter instanceof PDFArray) {
    filterStr = '[' + filter.asArray().map(x => x.toString()).join(' ') + ']'
  } else {
    filterStr = filter?.toString() ?? '(none)'
  }

  const width = dict.get(PDFName.of('Width'))?.toString() ?? '?'
  const height = dict.get(PDFName.of('Height'))?.toString() ?? '?'
  const bpc = dict.get(PDFName.of('BitsPerComponent'))?.toString() ?? '?'
  const cs = dict.get(PDFName.of('ColorSpace'))?.toString() ?? '?'
  const streamLen = obj.contents.byteLength

  total.count++
  total.streamBytes += streamLen
  byFilter.set(filterStr, (byFilter.get(filterStr) ?? 0) + streamLen)

  rows.push({ ref: ref.toString(), filterStr, width, height, bpc, cs, streamLen })
}

const fileSize = bytes.byteLength
console.log('=== PDF: ' + path + ' ===')
console.log('file size: ' + (fileSize / 1024 / 1024).toFixed(2) + ' MB')
console.log('pages: ' + pages.length)
console.log('image XObjects: ' + total.count)
console.log('total image stream bytes: ' + (total.streamBytes / 1024 / 1024).toFixed(2) + ' MB (' + ((total.streamBytes / fileSize) * 100).toFixed(1) + '% of file)')
console.log('')
console.log('=== By filter (stream bytes) ===')
const sorted = [...byFilter.entries()].sort((a,b) => b[1]-a[1])
for (const [f, b] of sorted) {
  console.log('  ' + f.padEnd(40) + (b / 1024 / 1024).toFixed(2) + ' MB (' + ((b/total.streamBytes)*100).toFixed(1) + '%)')
}

console.log('')
console.log('=== Per-image (first 20, largest first) ===')
rows.sort((a,b) => b.streamLen - a.streamLen)
console.log('ref'.padEnd(10) + 'filter'.padEnd(40) + 'WxH'.padEnd(14) + 'bpc  ' + 'streamKB')
for (const r of rows.slice(0, 20)) {
  console.log(
    r.ref.padEnd(10) +
    r.filterStr.padEnd(40) +
    (r.width + 'x' + r.height).padEnd(14) +
    r.bpc.padEnd(5) +
    (r.streamLen / 1024).toFixed(1)
  )
}

// Estimate DPI: assume each image is drawn full-page at its page size.
// This is a rough estimate — real bboxes need content-stream parsing.
if (rows.length > 0 && pages.length > 0) {
  const avgPageW = pageBBoxes.reduce((s,p)=>s+p.w,0) / pages.length
  const avgPageH = pageBBoxes.reduce((s,p)=>s+p.h,0) / pages.length
  console.log('')
  console.log('=== Rough DPI estimate (assuming full-page render) ===')
  console.log('avg page: ' + avgPageW.toFixed(0) + ' x ' + avgPageH.toFixed(0) + ' pts')
  for (const r of rows.slice(0, 5)) {
    const w = Number(r.width), h = Number(r.height)
    if (!Number.isFinite(w) || !Number.isFinite(h)) continue
    const dpiW = (w / avgPageW) * 72
    const dpiH = (h / avgPageH) * 72
    console.log('  ref ' + r.ref + ': ~' + dpiW.toFixed(0) + ' x ' + dpiH.toFixed(0) + ' DPI  (' + r.filterStr + ')')
  }
}
