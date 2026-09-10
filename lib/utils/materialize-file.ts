// Copy a File's bytes into a JS-owned Blob so subsequent reads survive
// Android's transient permission revocation on content:// URIs (Viber,
// WhatsApp, Google Photos, camera captures via MediaStore). Reads through
// arrayBuffer() first, then falls back to streaming — some Android builds
// fail one but not the other.
//
// Marks the returned File so repeat calls in the pipeline are no-ops.

const MATERIALIZED_KEY = '__cyMaterialized'

export function isMaterialized(file: File): boolean {
  return (file as unknown as Record<string, unknown>)[MATERIALIZED_KEY] === true
}

function markMaterialized(file: File): File {
  Object.defineProperty(file, MATERIALIZED_KEY, {
    value: true,
    enumerable: false,
    // Keep configurable so a later force-remat can drop the mark if a
    // downstream step (WORKERFS postMessage transfer, structured clone)
    // neutered our owned bytes and we need a fresh read.
    configurable: true,
    writable: false,
  })
  return file
}

export function unmarkMaterialized(file: File): void {
  try {
    Object.defineProperty(file, MATERIALIZED_KEY, {
      value: false,
      enumerable: false,
      configurable: true,
      writable: false,
    })
  } catch {
    /* mark was frozen — best effort */
  }
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export async function materializeFile(file: File): Promise<File> {
  if (isMaterialized(file)) return file
  // Only Android needs this. It's the sole platform where a File handle
  // returned by the picker can silently lose read permission (content://
  // URIs from Viber, WhatsApp, Google Photos, MediaStore camera captures).
  // On iOS and desktop the File stays valid, and copying its bytes upfront
  // either wastes peak memory or outright fails: iOS Safari has a
  // ~1–1.5 GB tab ceiling that can't hold large videos, and V8's
  // Uint8Array cap (~2 GB) throws on files bigger than that on desktop
  // Chrome — blocking the very files the mediabunny streaming path was
  // built to handle.
  if (!isAndroid()) return file
  const errors: string[] = []
  // 1) File.arrayBuffer(). Force an explicit byte copy via Uint8Array so
  //    the returned File owns its bytes independent of anything Chrome
  //    might do with the source (postMessage transfers, content:// URI
  //    revocation, cross-tab handle expiry).
  try {
    const src = new Uint8Array(await file.arrayBuffer())
    const copy = new Uint8Array(src.byteLength)
    copy.set(src)
    return markMaterialized(
      new File([copy], file.name, { type: file.type, lastModified: file.lastModified }),
    )
  } catch (err) {
    errors.push(`arrayBuffer: ${err instanceof Error ? err.message : String(err)}`)
  }
  // 2) Streaming reader. Some Android builds fail arrayBuffer() but let
  //    a stream walk through.
  try {
    const reader = file.stream().getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        total += value.byteLength
      }
    }
    const combined = new Uint8Array(total)
    let offset = 0
    for (const c of chunks) {
      combined.set(c, offset)
      offset += c.byteLength
    }
    return markMaterialized(
      new File([combined], file.name, { type: file.type, lastModified: file.lastModified }),
    )
  } catch (err) {
    errors.push(`stream: ${err instanceof Error ? err.message : String(err)}`)
  }
  // 3) Blob URL + fetch round-trip. Bypasses File-object quirks entirely —
  //    the browser materializes the underlying storage into a fresh Blob
  //    via its HTTP fetch pipeline, which survives incognito's tighter
  //    handle policies on Android Chrome.
  let url: string | null = null
  try {
    url = URL.createObjectURL(file)
    const resp = await fetch(url)
    const blob = await resp.blob()
    const buf = new Uint8Array(await blob.arrayBuffer())
    return markMaterialized(
      new File([buf], file.name, { type: file.type || blob.type, lastModified: file.lastModified }),
    )
  } catch (err) {
    errors.push(`blob-url: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    if (url) URL.revokeObjectURL(url)
  }
  console.warn('[materialize] failed:', errors.join(' | '))
  throw new Error(unreadableFileMessage())
}

export function unreadableFileMessage(): string {
  if (typeof navigator === 'undefined') {
    return 'Could not read this file. The browser blocked access — try re-selecting the file, or open the site in a different browser.'
  }
  const ua = navigator.userAgent
  const isIos = /iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/i.test(ua))
  if (isIos) {
    return 'Could not read this file on iOS. Common causes: the video isn\'t fully downloaded from iCloud (open it in Photos first so it downloads), the file is too large for the browser tab, or you\'re inside an in-app browser (Google app, Instagram). Open in real Safari and try again.'
  }
  if (/Android/i.test(ua)) {
    return 'Could not read this file. Android sometimes revokes access to videos from apps like Viber or WhatsApp. Try re-sharing the video or save it to Downloads first.'
  }
  return 'Could not read this file. The browser blocked access — try re-selecting the file from your Downloads folder, or open the site in a different browser.'
}
