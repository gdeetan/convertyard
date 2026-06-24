import type { ToolOptions, ConversionResult } from '@/lib/types'
import { convertViaWorker } from './vips-client'
import { zipSync } from 'fflate'

const SIZES = [16, 32, 48, 180, 192, 512] as const

// Build a minimal ICO containing 16×16, 32×32, and 48×48 PNG payloads.
// ICO with embedded PNGs is valid and well-supported in all modern browsers.
function buildIco(pngs: Map<number, Uint8Array>): Uint8Array {
  const sizes = [16, 32, 48]
  const images = sizes.map(s => pngs.get(s)!).filter(Boolean)
  const count = images.length

  // ICONDIR (6) + ICONDIRENTRY*count (16 each) + image data
  const headerSize = 6 + 16 * count
  const offsets: number[] = []
  let offset = headerSize
  for (const img of images) {
    offsets.push(offset)
    offset += img.byteLength
  }

  const totalSize = offset
  const buf = new ArrayBuffer(totalSize)
  const view = new DataView(buf)
  const bytes = new Uint8Array(buf)

  // ICONDIR
  view.setUint16(0, 0, true)  // reserved
  view.setUint16(2, 1, true)  // type = 1 (ICO)
  view.setUint16(4, count, true)

  // ICONDIRENTRY for each image
  for (let i = 0; i < count; i++) {
    const entry = 6 + i * 16
    const sz = sizes[i] ?? 0
    view.setUint8(entry, sz >= 256 ? 0 : sz)     // width (0 = 256)
    view.setUint8(entry + 1, sz >= 256 ? 0 : sz)  // height
    view.setUint8(entry + 2, 0)   // colorCount (0 = truecolor)
    view.setUint8(entry + 3, 0)   // reserved
    view.setUint16(entry + 4, 1, true)  // planes
    view.setUint16(entry + 6, 32, true) // bit count (32bpp for PNG)
    view.setUint32(entry + 8, images[i].byteLength, true)  // size
    view.setUint32(entry + 12, offsets[i], true)           // offset
  }

  // Write image data
  let pos = headerSize
  for (const img of images) {
    bytes.set(img, pos)
    pos += img.byteLength
  }

  return bytes
}

function buildManifest(themeColor = '#C2410C'): string {
  return JSON.stringify({
    name: '',
    short_name: '',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: themeColor,
    background_color: '#ffffff',
    display: 'standalone',
  }, null, 2)
}

function buildSnippet(): string {
  return `<!-- Next.js metadata/icons block -->
export const metadata = {
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
}

<!-- Raw <head> markup for any stack -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />
<link rel="manifest" href="/site.webmanifest" />
`
}

export async function generateFavicons(
  files: File[],
  _opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void
): Promise<ConversionResult[]> {
  const file = files[0]
  if (!file) return [new Error('No file provided')]

  const isSquare = await checkSquare(file)
  const note = isSquare ? '' : ' (center-cropped to square)'

  const pngs = new Map<number, Uint8Array>()
  const total = SIZES.length

  for (let i = 0; i < SIZES.length; i++) {
    const size = SIZES[i]
    try {
      onProgress?.(0, Math.round((i / total) * 80))
      const resized = await convertViaWorker(file, 'png', {
        width: size,
        height: size,
        fit: 'cover',
        autoOrient: true,
      })
      const bytes = new Uint8Array(await resized.arrayBuffer())
      pngs.set(size, bytes)
    } catch (err) {
      return [new Error(`Failed to resize to ${size}px: ${err instanceof Error ? err.message : 'unknown error'}`)]
    }
  }

  onProgress?.(0, 85)

  const ico = buildIco(pngs)
  const manifest = new TextEncoder().encode(buildManifest())
  const snippet = new TextEncoder().encode(buildSnippet())
  const noteFile = note ? new TextEncoder().encode(`Note: your image was not square.${note}\n`) : null

  const zipFiles: Record<string, Uint8Array> = {
    'favicon.ico': ico,
    'favicon-16x16.png': pngs.get(16)!,
    'favicon-32x32.png': pngs.get(32)!,
    'apple-touch-icon.png': pngs.get(180)!,
    'android-chrome-192x192.png': pngs.get(192)!,
    'android-chrome-512x512.png': pngs.get(512)!,
    'site.webmanifest': manifest,
    'FAVICON-SNIPPET.txt': snippet,
  }
  if (noteFile) zipFiles['CROPPING-NOTE.txt'] = noteFile

  onProgress?.(0, 95)
  const zipped = zipSync(zipFiles)
  onProgress?.(0, 100)

  const zipFile = new File([zipped], 'favicons.zip', { type: 'application/zip' })
  return [zipFile]
}

async function checkSquare(file: File): Promise<boolean> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.width === img.height) }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(true) }
    img.src = url
  })
}
