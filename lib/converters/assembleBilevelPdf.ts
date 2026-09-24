// Hand-rolled to match assembleImagePdf's streaming pattern: pdf-lib buffers
// every embedded image in memory and OOMs on scan-heavy PDFs, so we emit the
// object graph byte-by-byte and let large CCITT streams pass through unbuffered.
export function assembleBilevelPdf(
  pages: Array<{ ccittBytes: Uint8Array; width: number; height: number }>
): Uint8Array {
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  let bytePos = 0
  const write = (v: string | Uint8Array) => {
    const c = typeof v === 'string' ? enc.encode(v) : v
    chunks.push(c)
    bytePos += c.length
  }

  const totalObjs = 2 + pages.length * 3
  const offsets = new Array<number>(totalObjs + 1).fill(0)
  const catalogNum = 1
  const pagesNum = 2

  const startObj = (num: number) => { offsets[num] = bytePos; write(`${num} 0 obj\n`) }
  const endObj = () => write('endobj\n')

  write('%PDF-1.5\n%\xE2\xE3\xCF\xD3\n')

  startObj(catalogNum)
  write(`<< /Type /Catalog /Pages ${pagesNum} 0 R >>\n`)
  endObj()

  const pageDictNums: number[] = []
  for (let k = 0; k < pages.length; k++) pageDictNums.push(2 + 3 * k + 3)
  startObj(pagesNum)
  write(`<< /Type /Pages /Kids [${pageDictNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pages.length} >>\n`)
  endObj()

  for (let k = 0; k < pages.length; k++) {
    const imageNum = 2 + 3 * k + 1
    const contentNum = 2 + 3 * k + 2
    const pageNum = 2 + 3 * k + 3
    const { ccittBytes, width, height } = pages[k]

    startObj(imageNum)
    write(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceGray /BitsPerComponent 1 /Filter /CCITTFaxDecode /DecodeParms << /K -1 /Columns ${width} /Rows ${height} /BlackIs1 false >> /Length ${ccittBytes.length} >>\nstream\n`)
    write(ccittBytes)
    write('\nendstream\n')
    endObj()

    const contentStr = `q ${width} 0 0 ${height} 0 0 cm /Im Do Q`
    const contentBytes = enc.encode(contentStr)
    startObj(contentNum)
    write(`<< /Length ${contentBytes.length} >>\nstream\n`)
    write(contentBytes)
    write('\nendstream\n')
    endObj()

    startObj(pageNum)
    write(`<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im ${imageNum} 0 R >> >> /Contents ${contentNum} 0 R >>\n`)
    endObj()
  }

  const xrefOffset = bytePos
  write(`xref\n0 ${totalObjs + 1}\n`)
  write('0000000000 65535 f \n')
  for (let n = 1; n <= totalObjs; n++) {
    const off = offsets[n].toString().padStart(10, '0')
    write(`${off} 00000 n \n`)
  }
  write(`trailer\n<< /Size ${totalObjs + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  const total = new Uint8Array(bytePos)
  let off = 0
  for (const c of chunks) { total.set(c, off); off += c.length }
  return total
}
