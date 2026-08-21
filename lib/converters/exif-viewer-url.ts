export type FetchImageError =
  | { kind: 'invalid-url' }
  | { kind: 'cors-blocked' }
  | { kind: 'not-an-image'; contentType: string }
  | { kind: 'too-large'; bytes: number }
  | { kind: 'other'; message: string }

const MAX_BYTES = 100 * 1024 * 1024
const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif|heic|heif|tiff?|bmp|cr2|cr3|nef|arw|dng|raf|orf|rw2)(\?|#|$)/i

/**
 * Fetches an image URL entirely in the browser and returns it as a File so
 * it can flow through the same analyze pipeline as dropped files.
 * No server-side proxy — the local-only guarantee is the product.
 */
export async function fetchImageAsFile(url: string): Promise<File | FetchImageError> {
  let parsed: URL
  try { parsed = new URL(url) } catch { return { kind: 'invalid-url' } }
  if (!/^https?:$/.test(parsed.protocol)) return { kind: 'invalid-url' }

  let res: Response
  try {
    res = await fetch(url, { mode: 'cors', redirect: 'follow' })
  } catch {
    return { kind: 'cors-blocked' }
  }
  if (!res.ok) return { kind: 'other', message: `HTTP ${res.status}` }

  const ct = res.headers.get('content-type') ?? ''
  const looksImageByExt = IMAGE_EXT_RE.test(parsed.pathname)
  if (!ct.startsWith('image/') && !looksImageByExt) {
    return { kind: 'not-an-image', contentType: ct || 'unknown' }
  }

  const len = Number(res.headers.get('content-length') ?? 0)
  if (len && len > MAX_BYTES) return { kind: 'too-large', bytes: len }

  const buf = await res.arrayBuffer()
  if (buf.byteLength > MAX_BYTES) return { kind: 'too-large', bytes: buf.byteLength }

  const name = decodeURIComponent(parsed.pathname.split('/').pop() || 'image')
  const mime = ct.startsWith('image/') ? ct : guessMimeFromName(name)
  return new File([buf], name, { type: mime })
}

function guessMimeFromName(name: string): string {
  const ext = name.toLowerCase().match(/\.(\w+)$/)?.[1]
  switch (ext) {
    case 'jpg': case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'webp': return 'image/webp'
    case 'avif': return 'image/avif'
    case 'heic': case 'heif': return 'image/heic'
    case 'tif': case 'tiff': return 'image/tiff'
    case 'gif': return 'image/gif'
    case 'bmp': return 'image/bmp'
    default: return 'application/octet-stream'
  }
}
