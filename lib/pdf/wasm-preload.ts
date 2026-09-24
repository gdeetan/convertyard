// Preload cold-start WASM before user click to hide 200–500ms of latency.
const WASM_URLS = [
  '/mupdf-wasm.wasm',
  '/mozjpeg_enc.wasm',
]

let started = false

export async function preloadPdfWasm(): Promise<void> {
  if (started) return
  started = true
  try {
    await Promise.all(
      WASM_URLS.map((u) =>
        fetch(u, { credentials: 'omit', cache: 'force-cache' }).catch(() => {})
      )
    )
  } catch {}
}

export function __resetPreloadStateForTests(): void { started = false }
