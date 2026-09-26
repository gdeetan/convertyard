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

// Doc cache: lets callers open a PDF once (transferring the ArrayBuffer)
// and reuse it across many operations without cloning the buffer per call.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const docCache = new Map<string, any>()

self.onmessage = async (e: MessageEvent) => {
  const { id, type, fileBuffer, docId, pageIndex, dpi, quality, transparent, password, userPassword, ownerPassword, encryptStrength, permissions } = e.data as {
    id: string
    type: 'render-page' | 'render-page-png' | 'page-count' | 'extract-text' | 'extract-structured-text' | 'page-sizes' | 'unlock-pdf' | 'protect-pdf' | 'save-compressed' | 'get-image-bboxes' | 'open-doc' | 'close-doc'
    fileBuffer?: ArrayBuffer
    docId?: string
    pageIndex?: number
    dpi?: number
    quality?: number
    transparent?: boolean
    password?: string
    userPassword?: string
    ownerPassword?: string
    encryptStrength?: 'aes-128' | 'aes-256'
    permissions?: number
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mupdf: any = await getMupdf()

    // Resolve a document handle. When docId is provided, reuse the cached
    // document (no buffer copy). Otherwise open a fresh doc from fileBuffer
    // and destroy it at the end of the handler (tracked via `ownedDoc`).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getDoc = (): { doc: any; owned: boolean } => {
      if (docId) {
        const cached = docCache.get(docId)
        if (!cached) throw new Error(`docId ${docId} not found (expired or never opened)`)
        return { doc: cached, owned: false }
      }
      if (!fileBuffer) throw new Error('missing fileBuffer or docId')
      return { doc: mupdf.Document.openDocument(fileBuffer, 'application/pdf'), owned: true }
    }

    if (type === 'open-doc') {
      if (!fileBuffer) throw new Error('open-doc requires fileBuffer')
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const newId = crypto.randomUUID()
      docCache.set(newId, doc)
      self.postMessage({ id, type: 'open-doc', docId: newId })
      return
    }

    if (type === 'close-doc') {
      if (docId) {
        const cached = docCache.get(docId)
        if (cached) {
          try { cached.destroy() } catch { /* ignore */ }
          docCache.delete(docId)
        }
      }
      self.postMessage({ id, type: 'close-doc' })
      return
    }

    if (type === 'page-count') {
      const { doc, owned } = getDoc()
      const count = doc.countPages()
      if (owned) doc.destroy()
      self.postMessage({ id, type: 'page-count', count })
      return
    }

    if (type === 'render-page') {
      const { doc, owned } = getDoc()
      const page = doc.loadPage(pageIndex ?? 0)
      const scale = (dpi ?? 150) / 72
      const matrix = mupdf.Matrix.scale(scale, scale)
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true)
      const jpegData: Uint8Array = pixmap.asJPEG(quality ?? 85)
      pixmap.destroy()
      page.destroy()
      if (owned) doc.destroy()
      const buffer = jpegData.buffer.slice(jpegData.byteOffset, jpegData.byteOffset + jpegData.byteLength)
      self.postMessage({ id, type: 'result', data: buffer }, [buffer])
      return
    }

    if (type === 'render-page-png') {
      const { doc, owned } = getDoc()
      const page = doc.loadPage(pageIndex ?? 0)
      const scale = (dpi ?? 150) / 72
      const matrix = mupdf.Matrix.scale(scale, scale)
      const alpha = transparent ?? false
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, alpha, true)
      const pngData: Uint8Array = pixmap.asPNG()
      pixmap.destroy()
      page.destroy()
      if (owned) doc.destroy()
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

    if (type === 'protect-pdf') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const src: any = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      if (src.needsPassword()) {
        src.authenticatePassword('')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfDoc: any = src.asPDF()
      if (!pdfDoc) throw new Error('Not a valid PDF')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: Record<string, any> = {
        encrypt: encryptStrength === 'aes-128' ? 'aes-128' : 'aes-256',
        'user-password': userPassword ?? '',
        'owner-password': ownerPassword || userPassword || '',
        garbage: 'compact',
        compress: true,
      }
      // PDF permission bitmask: bits set = allowed. mupdf accepts permissions=NUMBER.
      // If caller provides explicit permissions bitmask, forward it.
      if (typeof permissions === 'number') {
        opts.permissions = permissions
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buf: any = pdfDoc.saveToBuffer(opts)
      const u8: Uint8Array = buf.asUint8Array()
      const outBuf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
      buf.destroy()
      src.destroy()
      self.postMessage({ id, type: 'result', data: outBuf }, [outBuf])
      return
    }

    if (type === 'save-compressed') {
      // Structural re-serialization via mupdf. Deduplicates objects,
      // Flate-compresses every stream, and repacks with object streams.
      // No image touch — safe at every compression level. Callers wrap
      // in a "keep whichever is smaller" guard so a bad case can't
      // regress. Handler was declared in the type union in 0568306 but
      // its implementation was never landed, so every previous callsite
      // (compress-pdf low/medium/high, keep-text ladder's final pass)
      // was silently hitting the "Unknown message type" fallback.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const inputPageCount: number = doc.countPages()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfDoc: any = doc.asPDF ? doc.asPDF() : doc
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const buf: any = pdfDoc.saveToBuffer('garbage=deduplicate,compress=yes')
      const u8: Uint8Array = buf.asUint8Array()
      const outBuf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
      buf.destroy()
      doc.destroy()

      // Validity check: on inputs with corrupt object streams, mupdf can
      // silently emit a well-formed but zero-page PDF (~300 bytes). The
      // caller-side byte-count guard (`>0 && <file.size`) accepts that
      // garbage and hands users an unreadable download. Re-open the output
      // and confirm it has the same page count as the input; on mismatch,
      // return an empty buffer so callers fall back to the pre-mupdf file.
      let outputValid = false
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const verifyDoc: any = mupdf.Document.openDocument(outBuf.slice(0), 'application/pdf')
        const outputPageCount: number = verifyDoc.countPages()
        verifyDoc.destroy()
        outputValid = outputPageCount === inputPageCount && outputPageCount > 0
      } catch {
        outputValid = false
      }
      if (!outputValid) {
        const emptyBuf = new ArrayBuffer(0)
        self.postMessage({ id, type: 'result', data: emptyBuf }, [emptyBuf])
        return
      }
      self.postMessage({ id, type: 'result', data: outBuf }, [outBuf])
      return
    }

    if (type === 'get-image-bboxes') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: any = mupdf.Document.openDocument(fileBuffer, 'application/pdf')
      const pageCount: number = doc.countPages()
      // Key: "<pixelWidth>x<pixelHeight>". Value: max rendered width in PDF points.
      const maxRenderedByKey: Record<string, number> = {}

      for (let p = 0; p < pageCount; p++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const page: any = doc.loadPage(p)
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stext: any = page.toStructuredText('preserve-images')
          stext.walk({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onImageBlock(bbox: any, _transform: any, image: any) {
              try {
                const w = image.getWidth()
                const h = image.getHeight()
                const key = `${w}x${h}`
                const renderedPoints = bbox[2] - bbox[0]
                const prev = maxRenderedByKey[key] ?? 0
                if (renderedPoints > prev) maxRenderedByKey[key] = renderedPoints
              } catch {
                // skip unreadable image
              }
            },
          })
          stext.destroy?.()
        } finally {
          page.destroy()
        }
      }

      doc.destroy()
      const encoded = new TextEncoder().encode(JSON.stringify(maxRenderedByKey))
      const buf = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength)
      self.postMessage({ id, type: 'result', data: buf }, [buf])
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
