/// <reference lib="webworker" />

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mupdfReady: Promise<any> | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMupdf(): Promise<any> {
  if (!mupdfReady) {
    // webpackIgnore: load mupdf.js from /public/ at runtime — keeps it out of the webpack bundle.
    // mupdf.js conditionally imports node:fs (Node.js only) which webpack can't resolve for browsers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).$libmupdf_wasm_Module = {
      locateFile: (filename: string) => `/${filename}`,
    }
    mupdfReady = import(/* webpackIgnore: true */ '/mupdf.js' as string)
      .then((mod) => {
        console.log('[mupdf.worker] mupdf initialized')
        return mod
      })
      .catch((err) => {
        mupdfReady = null
        throw err
      })
  }
  return mupdfReady
}

self.onmessage = async (e: MessageEvent) => {
  const { id, type, fileBuffer, pageIndex, dpi, quality, transparent, password } = e.data as {
    id: string
    type: 'render-page' | 'render-page-png' | 'page-count' | 'extract-text' | 'extract-structured-text' | 'page-sizes' | 'unlock-pdf'
    fileBuffer: ArrayBuffer
    pageIndex?: number
    dpi?: number
    quality?: number
    transparent?: boolean
    password?: string
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mupdf: any = await getMupdf()

    if (type === 'page-count') {
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const count = doc.countPages()
      doc.destroy()
      self.postMessage({ id, type: 'page-count', count })
      return
    }

    if (type === 'render-page') {
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const page = doc.loadPage(pageIndex ?? 0)
      const scale = (dpi ?? 150) / 72
      const matrix = mupdf.Matrix.scale(scale, scale)
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true)
      const jpegData: Uint8Array = pixmap.asJPEG(quality ?? 85)
      pixmap.destroy()
      page.destroy()
      doc.destroy()
      const buffer = jpegData.buffer.slice(jpegData.byteOffset, jpegData.byteOffset + jpegData.byteLength)
      self.postMessage({ id, type: 'result', data: buffer }, [buffer])
      return
    }

    if (type === 'render-page-png') {
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const page = doc.loadPage(pageIndex ?? 0)
      const scale = (dpi ?? 150) / 72
      const matrix = mupdf.Matrix.scale(scale, scale)
      const alpha = transparent ?? false
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, alpha, true)
      const pngData: Uint8Array = pixmap.asPNG()
      pixmap.destroy()
      page.destroy()
      doc.destroy()
      const buffer = pngData.buffer.slice(pngData.byteOffset, pngData.byteOffset + pngData.byteLength)
      self.postMessage({ id, type: 'result', data: buffer }, [buffer])
      return
    }

    if (type === 'extract-text') {
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const pageCount = doc.countPages()
      const pages: string[] = []
      for (let p = 0; p < pageCount; p++) {
        const page = doc.loadPage(p)
        const stext = page.toStructuredText('preserve-whitespace,preserve-ligatures')
        pages.push(stext.asText())
        page.destroy()
      }
      doc.destroy()
      const encoded = new TextEncoder().encode(JSON.stringify(pages))
      const buf = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength)
      self.postMessage({ id, type: 'result', data: buf }, [buf])
      return
    }

    if (type === 'extract-structured-text') {
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const pageCount = doc.countPages()
      const pages: string[] = []
      for (let p = 0; p < pageCount; p++) {
        const page = doc.loadPage(p)
        const stext = page.toStructuredText('preserve-whitespace,preserve-ligatures,preserve-spans')
        pages.push(stext.asJSON())
        page.destroy()
      }
      doc.destroy()
      const encoded = new TextEncoder().encode(JSON.stringify(pages))
      const buf = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength)
      self.postMessage({ id, type: 'result', data: buf }, [buf])
      return
    }

    if (type === 'page-sizes') {
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const pageCount = doc.countPages()
      const sizes: { width: number; height: number }[] = []
      for (let p = 0; p < pageCount; p++) {
        const page = doc.loadPage(p)
        const bounds = page.getBounds() // returns [x0, y0, x1, y1] in PDF points
        sizes.push({ width: bounds[2] - bounds[0], height: bounds[3] - bounds[1] })
        page.destroy()
      }
      doc.destroy()
      const encoded = new TextEncoder().encode(JSON.stringify(sizes))
      const buf = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength)
      self.postMessage({ id, type: 'result', data: buf }, [buf])
      return
    }

    if (type === 'unlock-pdf') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const src: any = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      if (src.needsPassword()) {
        const result: number = src.authenticatePassword(password ?? '')
        if (result === 0) {
          src.destroy()
          throw new Error('IncorrectPassword')
        }
      }
      // Create a fresh unencrypted PDF and graft all pages into it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out: any = new mupdf.PDFDocument()
      const pageCount: number = src.countPages()
      for (let i = 0; i < pageCount; i++) {
        out.graftPage(-1, src, i)
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buf: any = out.saveToBuffer('garbage=compact,compress=yes')
      const u8: Uint8Array = buf.asUint8Array()
      const outBuf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
      buf.destroy()
      out.destroy()
      src.destroy()
      self.postMessage({ id, type: 'result', data: outBuf }, [outBuf])
      return
    }

    self.postMessage({ id, type: 'error', message: `Unknown message type: ${type}` })
  } catch (err) {
    self.postMessage({
      id,
      type: 'error',
      message: err instanceof Error ? err.message : 'mupdf error',
    })
  }
}
