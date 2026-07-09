'use client'
import { useState, useEffect } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/image-to-excel'

export default function Page() {
  const [wasmOnly, setWasmOnly] = useState(false)

  useEffect(() => {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu
    if (!gpu) {
      setWasmOnly(true)
      return
    }
    gpu.requestAdapter()
      .then(adapter => { if (!adapter) setWasmOnly(true) })
      .catch(() => setWasmOnly(true))
  }, [])

  const notice = wasmOnly ? (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <strong>GPU acceleration not detected</strong> — a lightweight fallback model (~200 MB) will be used instead of the full model (~1.8 GB). Results may be less accurate. Verify output before use.
    </div>
  ) : null

  return <ToolShell config={config} notice={notice} />
}
