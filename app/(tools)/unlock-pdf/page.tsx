'use client'

import { useState, useCallback } from 'react'
import { Lock, Unlock, Download, RefreshCcw, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { unlockPdf } from '@/lib/converters/mupdf-client'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes, downloadFile } from '@/lib/utils/download'
import { config } from '@/content/tools/unlock-pdf'

interface FileEntry {
  file: File
  password: string
  status: 'pending' | 'done' | 'error'
  result?: File
  error?: string
}

export default function UnlockPdfPage() {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [phase, setPhase] = useState<'idle' | 'processing' | 'done'>('idle')
  const [showPw, setShowPw] = useState<Record<number, boolean>>({})

  const handleAdd = useCallback((files: File[]) => {
    setEntries((prev) => [
      ...prev,
      ...files.map((f) => ({ file: f, password: '', status: 'pending' as const })),
    ])
  }, [])

  const setPassword = (idx: number, pw: string) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, password: pw } : e)))
  }

  const handleUnlock = async () => {
    setPhase('processing')
    const updated = await Promise.all(
      entries.map(async (entry) => {
        try {
          const buffer = await entry.file.arrayBuffer()
          const outBuffer = await unlockPdf(buffer, entry.password)
          const outName = entry.file.name.replace(/\.pdf$/i, '') + '-unlocked.pdf'
          return {
            ...entry,
            status: 'done' as const,
            result: new File([outBuffer], outName, { type: 'application/pdf' }),
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Decryption failed'
          const isWrongPassword = msg === 'IncorrectPassword'
          return {
            ...entry,
            status: 'error' as const,
            error: isWrongPassword ? 'Incorrect password.' : msg,
          }
        }
      })
    )
    setEntries(updated)
    setPhase('done')
  }

  const handleReset = () => {
    setEntries([])
    setPhase('idle')
    setShowPw({})
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'PDF Tools', href: '/pdf' },
          { label: config.title },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{config.title}</h1>
        <p className="mt-2 text-base text-fg-muted">{config.subtitle}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden="true" />
          Your password never leaves your browser. No uploads. No accounts.
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm">
        {phase === 'idle' && entries.length === 0 && (
          <Dropzone accepts={config.accepts} acceptsExt={config.acceptsExt} onAdd={handleAdd} />
        )}

        {(phase === 'idle' || phase === 'processing') && entries.length > 0 && (
          <div className="space-y-4">
            <ul className="space-y-2" aria-label="PDF files to unlock">
              {entries.map((entry, idx) => (
                <li key={`${entry.file.name}-${idx}`} className="rounded-lg border border-border bg-bg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Unlock className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{entry.file.name}</span>
                    <span className="text-xs text-fg-subtle">{formatBytes(entry.file.size)}</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPw[idx] ? 'text' : 'password'}
                      value={entry.password}
                      onChange={(e) => setPassword(idx, e.target.value)}
                      placeholder="Enter password (leave blank if not encrypted)"
                      className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 pr-10 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                      aria-label={`Password for ${entry.file.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((p) => ({ ...p, [idx]: !p[idx] }))}
                      className="absolute right-2.5 top-2.5 text-fg-subtle hover:text-fg"
                      aria-label={showPw[idx] ? 'Hide password' : 'Show password'}
                    >
                      {showPw[idx] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <Dropzone
              accepts={config.accepts}
              acceptsExt={config.acceptsExt}
              onAdd={handleAdd}
              compact
              fileCount={entries.length}
              totalBytes={entries.reduce((s, e) => s + e.file.size, 0)}
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-fg-muted hover:text-fg transition-colors"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={handleUnlock}
                disabled={phase === 'processing'}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                <Unlock className="h-4 w-4" aria-hidden="true" />
                {phase === 'processing'
                  ? 'Unlocking…'
                  : `Unlock ${entries.length} file${entries.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="space-y-4">
            <ul className="space-y-2">
              {entries.map((entry, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3',
                    entry.status === 'done' ? 'border-border bg-bg' : 'border-error/40 bg-bg'
                  )}
                >
                  {entry.status === 'done' ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-error" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{entry.file.name}</p>
                    {entry.error && <p className="text-xs text-error mt-0.5">{entry.error}</p>}
                  </div>
                  {entry.result && (
                    <button
                      type="button"
                      onClick={() => downloadFile(entry.result!)}
                      className={cn(
                        'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5',
                        'bg-primary text-primary-fg text-xs font-semibold',
                        'transition-colors hover:bg-primary-hover'
                      )}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Unlock more files
            </button>
          </div>
        )}
      </div>

      {config.faq.length > 0 && (
        <section className="mt-12">
          <FAQAccordion items={config.faq} />
        </section>
      )}
      {config.relatedTools.length > 0 && (
        <section className="mt-12">
          <RelatedToolsStrip slugs={config.relatedTools} />
        </section>
      )}
    </div>
  )
}
