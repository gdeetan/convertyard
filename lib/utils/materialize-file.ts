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
    configurable: false,
    writable: false,
  })
  return file
}

export async function materializeFile(file: File): Promise<File> {
  if (isMaterialized(file)) return file
  const errors: string[] = []
  try {
    const buf = await file.arrayBuffer()
    return markMaterialized(
      new File([buf], file.name, { type: file.type, lastModified: file.lastModified }),
    )
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err))
  }
  try {
    const reader = file.stream().getReader()
    const chunks: BlobPart[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value as unknown as BlobPart)
    }
    return markMaterialized(
      new File(chunks, file.name, { type: file.type, lastModified: file.lastModified }),
    )
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err))
  }
  console.warn('[materialize] failed:', errors.join(' | '))
  throw new Error(
    'Could not read this file. Android sometimes revokes access to videos from apps like Viber or WhatsApp. Try re-sharing the video or save it to Downloads first.',
  )
}
