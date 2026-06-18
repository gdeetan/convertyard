let workerInstance: Worker | null = null

// Track pending requests so we can reject them if the worker crashes.
const pending = new Map<string, (err: Error) => void>()

function rejectAll(err: Error) {
  for (const reject of pending.values()) reject(err)
  pending.clear()
}

function getWorker(): Worker {
  if (!workerInstance) {
    const w = new Worker(
      new URL('./mupdf.worker.ts', import.meta.url),
      { type: 'module' }
    )

    w.addEventListener('error', (e: ErrorEvent) => {
      const err = new Error(e.message || 'mupdf worker crashed')
      workerInstance = null
      rejectAll(err)
    })

    w.addEventListener('messageerror', () => {
      const err = new Error('mupdf worker message deserialization failed')
      workerInstance = null
      rejectAll(err)
    })

    workerInstance = w
  }
  return workerInstance
}

function send<T>(
  type: string,
  payload: Record<string, unknown>,
  transfer: Transferable[] = []
): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = getWorker()
    const id = crypto.randomUUID()

    // Register a reject hook so getWorker's onerror can cancel this promise.
    pending.set(id, reject)

    const handler = (e: MessageEvent) => {
      if (e.data.id !== id) return
      worker.removeEventListener('message', handler)
      pending.delete(id)
      if (e.data.type === 'error') {
        reject(new Error(e.data.message))
      } else {
        resolve(e.data as T)
      }
    }

    worker.addEventListener('message', handler)
    worker.postMessage({ id, type, ...payload }, transfer)
  })
}

export async function getPageCount(fileBuffer: ArrayBuffer): Promise<number> {
  const clone = fileBuffer.slice(0)
  const res = await send<{ count: number }>('page-count', { fileBuffer: clone }, [clone])
  return res.count
}

export async function renderPage(
  fileBuffer: ArrayBuffer,
  pageIndex: number,
  dpi: number,
  quality: number
): Promise<ArrayBuffer> {
  const clone = fileBuffer.slice(0)
  const res = await send<{ data: ArrayBuffer }>(
    'render-page',
    { fileBuffer: clone, pageIndex, dpi, quality },
    [clone]
  )
  return res.data
}

export async function renderPagePng(
  fileBuffer: ArrayBuffer,
  pageIndex: number,
  dpi: number,
  transparent: boolean = false
): Promise<ArrayBuffer> {
  const clone = fileBuffer.slice(0)
  const res = await send<{ data: ArrayBuffer }>(
    'render-page-png',
    { fileBuffer: clone, pageIndex, dpi, transparent },
    [clone]
  )
  return res.data
}

export async function extractText(fileBuffer: ArrayBuffer): Promise<string[]> {
  const clone = fileBuffer.slice(0)
  const res = await send<{ data: ArrayBuffer }>('extract-text', { fileBuffer: clone }, [clone])
  const json = new TextDecoder().decode(res.data)
  return JSON.parse(json) as string[]
}

export async function getPageSizes(fileBuffer: ArrayBuffer): Promise<{ width: number; height: number }[]> {
  const clone = fileBuffer.slice(0)
  const res = await send<{ data: ArrayBuffer }>('page-sizes', { fileBuffer: clone }, [clone])
  const json = new TextDecoder().decode(res.data)
  return JSON.parse(json) as { width: number; height: number }[]
}

export async function unlockPdf(fileBuffer: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  const clone = fileBuffer.slice(0)
  const res = await send<{ data: ArrayBuffer }>('unlock-pdf', { fileBuffer: clone, password }, [clone])
  return res.data
}

export async function protectPdf(
  fileBuffer: ArrayBuffer,
  userPassword: string,
  ownerPassword: string
): Promise<ArrayBuffer> {
  const clone = fileBuffer.slice(0)
  const res = await send<{ data: ArrayBuffer }>(
    'protect-pdf',
    { fileBuffer: clone, userPassword, ownerPassword },
    [clone]
  )
  return res.data
}

export async function extractStructuredText(fileBuffer: ArrayBuffer): Promise<string[]> {
  const clone = fileBuffer.slice(0)
  const res = await send<{ data: ArrayBuffer }>('extract-structured-text', { fileBuffer: clone }, [clone])
  const json = new TextDecoder().decode(res.data)
  return JSON.parse(json) as string[]
}
