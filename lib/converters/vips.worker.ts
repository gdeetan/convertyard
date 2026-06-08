/// <reference lib="webworker" />
import type { ToolOptions } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vipsReady: Promise<any> | null = null

function getVips() {
  if (!vipsReady) {
    vipsReady = import('wasm-vips')
      .then(({ default: Vips }) => Vips({
        locateFile: (filename: string) => `/${filename}`,
        dynamicLibraries: ['vips-heif.wasm'],
      }))
      .then((v) => {
        console.log('[vips.worker] wasm-vips initialized')
        return v
      })
      .catch((err) => {
        vipsReady = null
        throw err
      })
  }
  return vipsReady
}

function getMimeType(outputFormat: string): string {
  return outputFormat === 'webp' ? 'image/webp'
    : outputFormat === 'avif' ? 'image/avif'
    : outputFormat === 'png' ? 'image/png'
    : 'image/jpeg'
}

self.onmessage = async (e: MessageEvent) => {
  const { id, fileBuffer, outputFormat, opts, fileName } = e.data as {
    id: string
    fileBuffer: ArrayBuffer
    outputFormat: string
    opts: ToolOptions
    fileName: string
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vips: any = await getVips()

    self.postMessage({ id, type: 'progress', pct: 10 })

    const uint8 = new Uint8Array(fileBuffer)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let image: any = vips.Image.newFromBuffer(uint8)

    try {
      if (opts.autoOrient !== false) {
        const oriented = image.autorot()
        image.delete()
        image = oriented
      }

      self.postMessage({ id, type: 'progress', pct: 30 })

      const maxDim = typeof opts.maxDimension === 'number' ? opts.maxDimension : 0
      if (maxDim > 0) {
        const longer = Math.max(image.width, image.height)
        if (longer > maxDim) {
          const resized = image.resize(maxDim / longer)
          image.delete()
          image = resized
        }
      }

      self.postMessage({ id, type: 'progress', pct: 50 })

      // New width/height/fit resize (for image-resizer tool)
      const targetW = typeof opts.width === 'number' ? opts.width : 0
      const targetH = typeof opts.height === 'number' ? opts.height : 0

      if (targetW > 0 || targetH > 0) {
        const w = targetW > 0 ? targetW : Math.round(image.width * (targetH / image.height))
        const h = targetH > 0 ? targetH : Math.round(image.height * (targetW / image.width))
        const fit = typeof opts.fit === 'string' ? opts.fit : 'contain'

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resized: any
        if (fit === 'fill') {
          // Stretch to exact dimensions, ignoring aspect ratio
          resized = image.affine([w / image.width, 0, 0, h / image.height])
        } else if (fit === 'cover') {
          resized = image.thumbnailImage(w, { height: h, size: vips.Size.both, crop: vips.Interesting.centre })
        } else if (fit === 'inside') {
          // Shrink only, never upscale
          resized = image.thumbnailImage(w, { height: h, size: vips.Size.down })
        } else {
          // contain (default): scale to fit within bounds, maintain AR
          resized = image.thumbnailImage(w, { height: h, size: vips.Size.both })
        }
        image.delete()
        image = resized
      }

      if (opts.sharpen === true) {
        const sharpened = image.sharpen({ sigma: 0.5, x1: 1.0 })
        image.delete()
        image = sharpened
      }

      self.postMessage({ id, type: 'progress', pct: 70 })

      const quality = typeof opts.quality === 'number' ? opts.quality : 80
      const encodeOpts: Record<string, unknown> = {
        strip: opts.stripMetadata === true,
      }
      if (outputFormat === 'webp') {
        encodeOpts.Q = quality
        encodeOpts.lossless = opts.lossless === true
        encodeOpts.effort = typeof opts.method === 'number' ? opts.method : 4
      } else if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
        encodeOpts.Q = quality
      } else if (outputFormat === 'avif') {
        encodeOpts.Q = quality
        encodeOpts.effort = typeof opts.effort === 'number' ? opts.effort : 4
        if (opts.lossless === true) encodeOpts.lossless = true
      } else if (outputFormat === 'png') {
        // Map quality (1-100) to vips compression (0-9, higher = smaller/slower)
        encodeOpts.compression = Math.round((100 - quality) / 11.1)
      }

      const maxSizeKb = typeof opts.maxSizeKb === 'number' ? opts.maxSizeKb : 0
      const isLossy = outputFormat === 'jpg' || outputFormat === 'jpeg' || outputFormat === 'webp'

      let outBuffer: Uint8Array<ArrayBuffer>

      if (maxSizeKb > 0 && isLossy) {
        let q = quality
        while (q >= 20) {
          encodeOpts.Q = q
          outBuffer = image.writeToBuffer(`.${outputFormat}`, encodeOpts) as Uint8Array<ArrayBuffer>
          if (outBuffer.byteLength <= maxSizeKb * 1024) break
          q -= 10
        }
      } else {
        outBuffer = image.writeToBuffer(`.${outputFormat}`, encodeOpts) as Uint8Array<ArrayBuffer>
      }

      self.postMessage(
        { id, type: 'result', data: outBuffer!.buffer, fileName, mimeType: getMimeType(outputFormat) },
        [outBuffer!.buffer]
      )
    } finally {
      image.delete()
    }
  } catch (err) {
    self.postMessage({
      id,
      type: 'error',
      message: err instanceof Error ? err.message : 'conversion failed',
    })
  }
}
