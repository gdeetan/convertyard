// Generates fixtures/pdf-keep-text/text-with-duplicate-images.pdf
// Three pages, each containing the same 200×200 PNG embedded as a DIFFERENT
// image XObject (bytewise identical stream but a fresh indirect object).
// Run: npx tsx spike/scripts/gen-duplicate-image-fixture.ts

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

async function main() {
  const png = makeCheckerboardPng(200, 200)
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)

  for (let i = 0; i < 3; i++) {
    // embedPng creates a fresh XObject each call — that's the point.
    const img = await doc.embedPng(png)
    const page = doc.addPage([612, 792])
    page.drawText(`Page ${i + 1} — sample text kept intact.`, {
      x: 50, y: 720, size: 12, font, color: rgb(0, 0, 0),
    })
    page.drawImage(img, { x: 50, y: 400, width: 200, height: 200 })
  }

  const bytes = await doc.save()
  const out = resolve('fixtures/pdf-keep-text/text-with-duplicate-images.pdf')
  writeFileSync(out, bytes)
  console.log(`Wrote ${out} — ${bytes.byteLength} bytes`)
}

function makeCheckerboardPng(w: number, h: number): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PNG } = require('pngjs')
  const png = new PNG({ width: w, height: h })
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const on = ((x >> 4) + (y >> 4)) % 2 === 0
      png.data[i] = on ? 0xff : 0x00
      png.data[i + 1] = on ? 0xff : 0x00
      png.data[i + 2] = on ? 0xff : 0x00
      png.data[i + 3] = 0xff
    }
  }
  return PNG.sync.write(png)
}

main().catch((err) => { console.error(err); process.exit(1) })
