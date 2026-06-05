import type { ToolOptions } from '@/lib/types'

let workerInstance: Worker | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('./vips.worker.ts', import.meta.url),
      { type: 'module' }
    )
  }
  return workerInstance
}

function getMimeType(outputFormat: string): string {
  return outputFormat === 'webp' ? 'image/webp'
    : outputFormat === 'avif' ? 'image/avif'
    : outputFormat === 'png' ? 'image/png'
    : 'image/jpeg'
}

export function convertViaWorker(
  file: File,
  outputFormat: string,
  opts: ToolOptions,
  onProgress?: (pct: number) => void
): Promise<File> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    const id = crypto.randomUUID()
    const baseName = file.name.replace(/\.[^.]+$/, '')
    const fileName = `${baseName}.${outputFormat}`

    const handler = (e: MessageEvent) => {
      if (e.data.id !== id) return

      if (e.data.type === 'progress') {
        onProgress?.(e.data.pct)
      } else if (e.data.type === 'result') {
        worker.removeEventListener('message', handler)
        const result = new File([e.data.data], e.data.fileName, { type: getMimeType(outputFormat) })
        resolve(result)
      } else if (e.data.type === 'error') {
        worker.removeEventListener('message', handler)
        reject(new Error(e.data.message))
      }
    }

    worker.addEventListener('message', handler)

    file.arrayBuffer().then((buffer) => {
      worker.postMessage({ id, fileBuffer: buffer, outputFormat, opts, fileName }, [buffer])
    }).catch(reject)
  })
}
