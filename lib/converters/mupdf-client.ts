let workerInstance: Worker | null = null

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('./mupdf.worker.ts', import.meta.url),
      { type: 'module' }
    )
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

    const handler = (e: MessageEvent) => {
      if (e.data.id !== id) return
      worker.removeEventListener('message', handler)
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

// Returns one JSON string per page from mupdf's structured text API.
// Each JSON string contains block/line/span data with font name, size, bold/italic flags.
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
