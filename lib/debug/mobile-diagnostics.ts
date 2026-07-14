// Local-only mobile OCR diagnostics. All logic is gated behind ?debug=1.
// Zero cost when disabled — every exported function returns immediately.
// Panel persists to sessionStorage so iOS post-reload restore is possible.

export const DEBUG_ENABLED: boolean =
  typeof window !== 'undefined' &&
  typeof window.location !== 'undefined' &&
  new URLSearchParams(window.location.search).has('debug')

interface DiagEntry {
  ts: number
  label: string
  detail?: string
  isError: boolean
}

const SESSION_KEY = 'cy_diag_log'
const entries: DiagEntry[] = []
let panelEl: HTMLDivElement | null = null
let listEl: HTMLDivElement | null = null
let t0 = 0

function persistLog(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(entries.slice(-200)))
  } catch { /* storage full — ignore */ }
}

function restoreLog(): void {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return
    const prev: DiagEntry[] = JSON.parse(raw)
    entries.push({ ts: 0, label: '── RESTORED FROM PREVIOUS SESSION ──', isError: false })
    entries.push(...prev)
    entries.push({ ts: performance.now() - t0, label: '── NEW SESSION STARTS HERE ──', isError: false })
  } catch { /* corrupt JSON */ }
}

function renderPanel(): void {
  if (!panelEl) {
    panelEl = document.createElement('div')
    panelEl.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:99999',
      'max-height:40vh', 'overflow-y:auto',
      'background:rgba(0,0,0,0.88)',
      'font:11px/1.4 monospace', 'color:#e5e7eb',
      'padding:0 0 4px 0',
      'border-top:2px solid #ef4444',
    ].join(';')

    const header = document.createElement('div')
    header.style.cssText = [
      'color:#fbbf24', 'font-weight:bold',
      'padding:4px 8px', 'cursor:pointer',
      'position:sticky', 'top:0',
      'background:rgba(0,0,0,0.95)',
      'border-bottom:1px solid #374151',
      'user-select:none',
    ].join(';')
    header.textContent = '[CY Debug] ?debug=1 active — tap to collapse'

    listEl = document.createElement('div')
    listEl.style.cssText = 'padding:4px 8px;white-space:pre-wrap;word-break:break-all'

    header.onclick = () => {
      if (listEl) listEl.style.display = listEl.style.display === 'none' ? '' : 'none'
    }

    panelEl.append(header, listEl)
    document.body.appendChild(panelEl)
  }

  if (!listEl) return
  listEl.innerHTML = ''
  for (const e of entries) {
    appendEntryLine(e)
  }
  panelEl.scrollTop = panelEl.scrollHeight
}

function appendEntryLine(e: DiagEntry): void {
  if (!listEl) return
  const line = document.createElement('div')
  line.style.color = e.isError
    ? '#f87171'
    : e.label.startsWith('──')
    ? '#6b7280'
    : ''
  line.textContent = `[+${(e.ts / 1000).toFixed(2)}s] ${e.label}${e.detail ? '  ' + e.detail : ''}`
  listEl.appendChild(line)
  if (panelEl) panelEl.scrollTop = panelEl.scrollHeight
}

function addEntry(label: string, detail: string | undefined, isError: boolean): void {
  const entry: DiagEntry = { ts: performance.now() - t0, label, detail, isError }
  entries.push(entry)
  persistLog()
  if (panelEl) {
    appendEntryLine(entry)
  }
}

export function diagLog(label: string, detail?: string): void {
  if (!DEBUG_ENABLED) return
  addEntry(label, detail, false)
}

export function diagError(label: string, err: unknown): void {
  if (!DEBUG_ENABLED) return
  let msg: string
  if (err instanceof Error) {
    const stackLines = err.stack?.split('\n').slice(1, 4).join(' | ') ?? ''
    msg = stackLines ? `${err.message} | ${stackLines}` : err.message
  } else {
    msg = String(err)
  }
  addEntry(label, msg, true)
}

export function diagMemory(context: string): void {
  if (!DEBUG_ENABLED) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mem = (performance as any).memory
    if (mem) {
      const used = (mem.usedJSHeapSize / 1024 / 1024).toFixed(1)
      const total = (mem.totalJSHeapSize / 1024 / 1024).toFixed(1)
      addEntry(`memory:${context}`, `used=${used}MB total=${total}MB`, false)
    } else {
      addEntry(`memory:${context}`, 'API unavailable (Safari)', false)
    }
  } catch {
    addEntry(`memory:${context}`, 'API unavailable', false)
  }
}

if (DEBUG_ENABLED) {
  t0 = performance.now()
  restoreLog()

  window.addEventListener('error', (e) => {
    diagError('window.onerror', e.error ?? new Error(e.message))
  })
  window.addEventListener('unhandledrejection', (e) => {
    diagError('unhandledrejection', e.reason)
  })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPanel)
  } else {
    renderPanel()
  }
}
