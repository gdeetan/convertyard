'use client'
import { useState, useCallback } from 'react'
import { ToolShell } from '@/components/tool-shell/tool-shell'
import { config } from '@/content/tools/pdf-to-text'

export default function Page() {
  const [previewText, setPreviewText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleResults = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    const text = await files[0].text()
    setPreviewText(text)
    setCopied(false)
  }, [])

  const handleCopy = useCallback(() => {
    if (!previewText) return
    navigator.clipboard.writeText(previewText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [previewText])

  return (
    <>
      <ToolShell config={config} onResults={handleResults} />
      {previewText !== null && (
        <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6">
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-fg">Extracted text preview</p>
              <button
                onClick={handleCopy}
                className="rounded-md px-3 py-1.5 text-sm font-medium border border-border bg-bg hover:bg-bg-elevated transition-colors"
              >
                {copied ? 'Copied!' : 'Copy all text'}
              </button>
            </div>
            <textarea
              readOnly
              value={previewText}
              rows={20}
              className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg font-mono leading-relaxed focus:outline-none"
            />
          </div>
        </div>
      )}
    </>
  )
}
