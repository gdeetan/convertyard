import { zip } from 'fflate'
import type { ToolOptions, ConversionResult } from '@/lib/types'
import { extractGifFramesViaWorker } from './vips-client'
import { libvipsConvert } from './libvips'

function padWidth(total: number): number {
  return Math.max(3, String(total).length)
}

async function zipFrames(
  frames: Array<{ index: number; data: ArrayBuffer }>,
  totalFrames: number
): Promise<Uint8Array> {
  const width = padWidth(totalFrames)
  const entries: Record<string, Uint8Array> = {}
  for (const f of frames) {
    const n = String(f.index + 1).padStart(width, '0')
    entries[`frame-${n}.jpg`] = new Uint8Array(f.data)
  }
  return new Promise((resolve, reject) => {
    zip(entries, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

export async function gifToJpgConvert(
  files: File[],
  opts: ToolOptions,
  onProgress?: (fileIndex: number, pct: number) => void,
  onResult?: (fileIndex: number, result: ConversionResult) => void
): Promise<ConversionResult[]> {
  const frameMode = typeof opts.frameMode === 'string' ? opts.frameMode : 'first'

  if (frameMode !== 'all') {
    return libvipsConvert(files, 'jpg', opts, onProgress, onResult)
  }

  const results: ConversionResult[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(i, 5)
    try {
      const frames = await extractGifFramesViaWorker(file, opts, (pct) => {
        onProgress?.(i, Math.min(95, Math.max(5, pct)))
      })
      const total = frames.length
      const zipBytes = await zipFrames(frames, total)
      const baseName = file.name.replace(/\.gif$/i, '')
      const zipFile = new File([zipBytes as BlobPart], `${baseName}-frames.zip`, { type: 'application/zip' })
      onProgress?.(i, 100)
      results.push(zipFile)
      onResult?.(i, zipFile)
    } catch (err) {
      onProgress?.(i, 100)
      const error = new Error(
        `${file.name}: ${err instanceof Error ? err.message : 'frame extraction failed'}`
      )
      results.push(error)
      onResult?.(i, error)
    }
  }
  return results
}
