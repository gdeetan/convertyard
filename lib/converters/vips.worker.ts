/// <reference lib="webworker" />
import Vips from 'wasm-vips'
import type { ToolOptions } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vipsInstance: any | null = null

async function getVips() {
  if (!vipsInstance) {
    vipsInstance = await Vips({ locateFile: () => '/vips.wasm' })
    console.log('[vips.worker] wasm-vips initialized')
  }
  return vipsInstance
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

      if (opts.sharpen === true) {
        const sharpened = image.sharpen({ sigma: 0.5, x1: 1.0 })
        image.delete()
        image = sharpened
      }

      self.postMessage({ id, type: 'progress', pct: 70 })

      const quality = typeof opts.quality === 'number' ? opts.quality : 80
      const method = typeof opts.method === 'number' ? opts.method : 4
      const encodeOpts: Record<string, unknown> = {
        Q: quality,
        lossless: opts.lossless === true,
        effort: method,
        strip: opts.stripMetadata === true,
      }

      const outBuffer = image.writeToBuffer(`.${outputFormat}`, encodeOpts) as Uint8Array<ArrayBuffer>

      self.postMessage(
        { id, type: 'result', data: outBuffer.buffer, fileName, mimeType: getMimeType(outputFormat) },
        [outBuffer.buffer]
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
