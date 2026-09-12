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
    : outputFormat === 'gif' ? 'image/gif'
    : outputFormat === 'tiff' || outputFormat === 'tif' ? 'image/tiff'
    : outputFormat === 'bmp' ? 'image/bmp'
    : 'image/jpeg'
}

function hexToRgb(hex: string): [number, number, number] {
  const h = (hex || '#ffffff').replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const parse = (s: string) => { const n = parseInt(s, 16); return Number.isNaN(n) ? 255 : n }
  return [parse(full.slice(0, 2)), parse(full.slice(2, 4)), parse(full.slice(4, 6))]
}

self.onmessage = async (e: MessageEvent) => {
  const { id, action, fileBuffer, outputFormat, opts, fileName } = e.data as {
    id: string
    action?: 'convert' | 'extract-gif-frames'
    fileBuffer: ArrayBuffer
    outputFormat: string
    opts: ToolOptions
    fileName: string
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vips: any = await getVips()

    if (action === 'extract-gif-frames') {
      await handleExtractGifFrames(vips, id, fileBuffer, opts)
      return
    }

    self.postMessage({ id, type: 'progress', pct: 10 })

    const uint8 = new Uint8Array(fileBuffer)
    const isAnimated = opts.animated === true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let image: any = isAnimated
      ? vips.Image.newFromBuffer(uint8, { n: -1 })
      : vips.Image.newFromBuffer(uint8)

    try {
      // autorot() operates on single images — skip for animated (GIF has no EXIF rotation)
      if (opts.autoOrient !== false && !isAnimated) {
        const oriented = image.autorot()
        image.delete()
        image = oriented
      }

      // Convert embedded ICC profile to sRGB (removes large ICC data, improves web compatibility)
      if (opts.convertToSrgb === true && image.interpretation !== vips.Interpretation.srgb) {
        const srgb = image.colourspace(vips.Interpretation.srgb)
        image.delete()
        image = srgb
      }

      // Flatten alpha channel when encoding to JPG — skip for animated (flatten doesn't work on multi-page)
      if ((outputFormat === 'jpg' || outputFormat === 'jpeg') && image.hasAlpha() && !isAnimated) {
        const bg = hexToRgb(typeof opts.bgColor === 'string' ? opts.bgColor : '#ffffff')
        const flat = image.flatten({ background: bg })
        image.delete()
        image = flat
      }

      self.postMessage({ id, type: 'progress', pct: 30 })

      // NOTE: crop, thumbnailImage resize, and maxSizeKb dimension reduction are not animated-safe.
      // Callers using opts.animated must not pass cropX/cropY/cropW/cropH, width, height, or maxSizeKb.
      // Crop: extractArea using 0–1 fractions of post-orient image dimensions
      const hasCrop =
        typeof opts.cropX === 'number' &&
        typeof opts.cropY === 'number' &&
        typeof opts.cropW === 'number' &&
        typeof opts.cropH === 'number'
      if (hasCrop) {
        const left = Math.round((opts.cropX as number) * image.width)
        const top  = Math.round((opts.cropY as number) * image.height)
        const w    = Math.max(1, Math.round((opts.cropW as number) * image.width))
        const h    = Math.max(1, Math.round((opts.cropH as number) * image.height))
        const cropped = image.extractArea(left, top, w, h)
        image.delete()
        image = cropped
      }

      const maxDimRaw = opts.maxDimension
      const maxDim = typeof maxDimRaw === 'number' ? maxDimRaw
        : typeof maxDimRaw === 'string' ? parseInt(maxDimRaw, 10) || 0
        : 0
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

      // sharpen doesn't work correctly on multi-page animated images
      if (opts.sharpen === true && !isAnimated) {
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
        // WebP format spec caps width/height at 16383. libwebp's lossless VP8L
        // encoder additionally OOMs on very large photos inside the WASM heap
        // (surfaces as "wbuffer_write: write failed"). Cap lossless tighter.
        const WEBP_MAX_DIM = opts.lossless === true ? 8192 : 16383
        if (image.width > WEBP_MAX_DIM || image.height > WEBP_MAX_DIM) {
          const scale = WEBP_MAX_DIM / Math.max(image.width, image.height)
          const scaled = image.resize(scale)
          image.delete()
          image = scaled
        }
      } else if (outputFormat === 'jpg' || outputFormat === 'jpeg') {
        encodeOpts.Q = quality
        // Chroma subsampling: VipsForeignSubsample OFF=2 (4:4:4), ON=1 (4:2:0), AUTO=0
        if (opts.chromaSubsampling === '4:4:4') encodeOpts['subsample-mode'] = 2
        else if (opts.chromaSubsampling === '4:2:0') encodeOpts['subsample-mode'] = 1
        if (opts.progressive === true) encodeOpts.interlace = true
      } else if (outputFormat === 'avif') {
        encodeOpts.Q = quality
        encodeOpts.effort = typeof opts.effort === 'number' ? opts.effort : 4
        if (opts.lossless === true) encodeOpts.lossless = true
        // libheif in wasm-vips OOMs on large images (no tiling API available in this build).
        // Auto-downscale to 4096px max so the AV1 encoder stays within the WASM heap.
        const AVIF_MAX_DIM = 4096
        if (image.width > AVIF_MAX_DIM || image.height > AVIF_MAX_DIM) {
          const scale = AVIF_MAX_DIM / Math.max(image.width, image.height)
          const scaled = image.resize(scale)
          image.delete()
          image = scaled
        }
      } else if (outputFormat === 'png') {
        // Map quality (1-100) to vips compression (0-9, higher = smaller/slower)
        encodeOpts.compression = Math.min(9, Math.round((100 - quality) * 9 / 100))
        if (opts.paletteReduction === true) encodeOpts.palette = true
      } else if (outputFormat === 'gif') {
        // gifsave: quality maps to palette bitdepth (2–8). Lower bitdepth = fewer colours, smaller file.
        encodeOpts.bitdepth = Math.max(2, Math.min(8, Math.round(2 + (quality / 100) * 6)))
        encodeOpts.effort = typeof opts.effort === 'number' ? opts.effort : 7
        encodeOpts.dither = typeof opts.gifDither === 'number' ? opts.gifDither : 1
      } else if (outputFormat === 'tiff' || outputFormat === 'tif') {
        const comp = (opts.tiffCompression as string) ?? 'lzw'
        encodeOpts.compression = comp
        if (opts.tiffBitDepth === 16) encodeOpts.bitdepth = 16
      } else if (outputFormat === 'bmp') {
        // BMP has no quality/compression settings — strip only
      }

      const maxSizeKb = typeof opts.maxSizeKb === 'number' ? opts.maxSizeKb : 0
      const targetBytes = maxSizeKb > 0 ? maxSizeKb * 1024 : 0
      // AVIF excluded: wasm-vips AVIF Q adjustments are non-monotonic at low quality levels
      const isLossy = outputFormat === 'jpg' || outputFormat === 'jpeg' || outputFormat === 'webp'

      let outBuffer: Uint8Array<ArrayBuffer> | undefined

      // Phase 1: quality reduction (lossy formats only)
      if (targetBytes > 0 && isLossy) {
        let q = quality
        while (q >= 20) {
          encodeOpts.Q = q
          const candidate = image.writeToBuffer(`.${outputFormat}`, encodeOpts) as Uint8Array<ArrayBuffer>
          if (candidate.byteLength <= targetBytes) {
            outBuffer = candidate
            break
          }
          outBuffer = candidate
          q -= 10
        }
      }

      // Phase 2: dimension reduction fallback — triggers when:
      // (a) lossy format still exceeds target after quality loop, or
      // (b) PNG with target set (lossless, so quality loop never ran)
      const needsDimReduction =
        targetBytes > 0 &&
        (isLossy || outputFormat === 'png') &&
        (!outBuffer || outBuffer.byteLength > targetBytes)

      if (needsDimReduction) {
        if (isLossy) encodeOpts.Q = 20
        // scale: 0.9 → 0.8 → ... → 0.5, each relative to the original image
        for (let scale = 0.9; scale >= 0.5 - 0.001; scale = Math.round((scale - 0.1) * 10) / 10) {
          const resized = image.resize(scale)
          const candidate = resized.writeToBuffer(`.${outputFormat}`, encodeOpts) as Uint8Array<ArrayBuffer>
          resized.delete()
          if (candidate.byteLength <= targetBytes) {
            outBuffer = candidate
            break
          }
          outBuffer = candidate
        }
      }

      if (!outBuffer) {
        try {
          outBuffer = image.writeToBuffer(`.${outputFormat}`, encodeOpts) as Uint8Array<ArrayBuffer>
        } catch (err) {
          // Lossless WebP can OOM the WASM heap ("wbuffer_write: write failed")
          // on large detailed photos even below the 8192px cap. Retry with
          // progressively smaller dimensions before giving up.
          const msg = err instanceof Error ? err.message : ''
          const isWebpOom =
            outputFormat === 'webp' &&
            opts.lossless === true &&
            /wbuffer_write|write failed|unable to encode/i.test(msg)
          if (!isWebpOom) throw err
          for (const scale of [0.75, 0.5, 0.35]) {
            const resized = image.resize(scale)
            try {
              outBuffer = resized.writeToBuffer(`.${outputFormat}`, encodeOpts) as Uint8Array<ArrayBuffer>
              resized.delete()
              break
            } catch (retryErr) {
              resized.delete()
              if (scale === 0.35) throw retryErr
            }
          }
        }
      }

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleExtractGifFrames(vips: any, id: string, fileBuffer: ArrayBuffer, opts: ToolOptions) {
  const uint8 = new Uint8Array(fileBuffer)
  self.postMessage({ id, type: 'progress', pct: 5 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const image: any = vips.Image.newFromBuffer(uint8, { n: -1 })
  try {
    let pageHeight: number
    try {
      pageHeight = image.getInt('page-height')
    } catch {
      pageHeight = image.height
    }
    const totalH = image.height
    const width = image.width
    const nPages = Math.max(1, Math.floor(totalH / pageHeight))

    const quality = typeof opts.quality === 'number' ? opts.quality : 85
    const strip = opts.stripMetadata === true
    const bg = hexToRgb(typeof opts.bgColor === 'string' ? opts.bgColor : '#ffffff')
    const maxDimRaw = opts.maxDimension
    const maxDim = typeof maxDimRaw === 'number' ? maxDimRaw
      : typeof maxDimRaw === 'string' ? parseInt(maxDimRaw, 10) || 0
      : 0

    self.postMessage({ id, type: 'meta', totalFrames: nPages })

    const transferables: ArrayBuffer[] = []
    const frames: Array<{ index: number; data: ArrayBuffer }> = []

    for (let i = 0; i < nPages; i++) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let frame: any = image.extractArea(0, i * pageHeight, width, pageHeight)
      try {
        if (frame.hasAlpha()) {
          const flat = frame.flatten({ background: bg })
          frame.delete()
          frame = flat
        }
        if (maxDim > 0) {
          const longer = Math.max(frame.width, frame.height)
          if (longer > maxDim) {
            const resized = frame.resize(maxDim / longer)
            frame.delete()
            frame = resized
          }
        }
        const buf = frame.writeToBuffer('.jpg', { Q: quality, strip }) as Uint8Array<ArrayBuffer>
        frames.push({ index: i, data: buf.buffer })
        transferables.push(buf.buffer)
      } finally {
        frame.delete()
      }
      const pct = 5 + Math.round(((i + 1) / nPages) * 95)
      self.postMessage({ id, type: 'progress', pct })
    }

    self.postMessage({ id, type: 'frames', frames }, transferables)
  } finally {
    image.delete()
  }
}
