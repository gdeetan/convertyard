'use client'

import { useState, useCallback } from 'react'
import { Lock, Shield, Download, RefreshCcw, Eye, EyeOff, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { protectPdf, buildPermissionsMask } from '@/lib/converters/mupdf-client'
import { Dropzone } from '@/components/tool-shell/dropzone'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { cn } from '@/lib/utils/cn'
import { formatBytes, downloadFile } from '@/lib/utils/download'
import { config } from '@/content/tools/protect-pdf'

interface Result {
  name: string
  file: File
}

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: 'bg-bg-muted', width: '0%' }
  if (pw.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' }
  if (pw.length < 10) return { label: 'Fair', color: 'bg-yellow-500', width: '50%' }
  if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Good', color: 'bg-blue-500', width: '75%' }
  return { label: 'Strong', color: 'bg-green-500', width: '100%' }
}

export default function ProtectPdfPage() {
  const [files, setFiles] = useState<File[]>([])
  const [userPw, setUserPw] = useState('')
  const [ownerPw, setOwnerPw] = useState('')
  const [showUserPw, setShowUserPw] = useState(false)
  const [showOwnerPw, setShowOwnerPw] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'processing' | 'done'>('idle')
  const [results, setResults] = useState<Result[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [encryptStrength, setEncryptStrength] = useState<'aes-256' | 'aes-128'>('aes-256')
  const [allowPrinting, setAllowPrinting] = useState(true)
  const [allowCopying, setAllowCopying] = useState(true)
  const [allowEditing, setAllowEditing] = useState(true)
  const [allowForms, setAllowForms] = useState(true)
  const [allowAccessibility, setAllowAccessibility] = useState(true)

  const handleAdd = useCallback((added: File[]) => {
    setFiles((prev) => [...prev, ...added])
  }, [])

  const handleProtect = async () => {
    if (!userPw || files.length === 0) return
    setPhase('processing')
    setError(null)

    const permissions = buildPermissionsMask({
      allowPrinting,
      allowCopying,
      allowEditing,
      allowFillingForms: allowForms,
      allowAccessibility,
    })

    try {
      const out: Result[] = []
      for (const file of files) {
        const buffer = await file.arrayBuffer()
        const encrypted = await protectPdf(buffer, {
          userPassword: userPw,
          ownerPassword: ownerPw || userPw,
          encryptStrength,
          permissions,
        })
        const outName = file.name.replace(/\.pdf$/i, '') + '-protected.pdf'
        out.push({
          name: outName,
          file: new File([encrypted], outName, { type: 'application/pdf' }),
        })
      }
      setResults(out)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to protect PDF')
      setPhase('idle')
    }
  }

  const handleReset = () => {
    setFiles([])
    setUserPw('')
    setOwnerPw('')
    setResults([])
    setPhase('idle')
    setError(null)
    setShowAdvanced(false)
    setEncryptStrength('aes-256')
    setAllowPrinting(true)
    setAllowCopying(true)
    setAllowEditing(true)
    setAllowForms(true)
    setAllowAccessibility(true)
  }

  const strength = passwordStrength(userPw)
  const totalBytes = files.reduce((s, f) => s + f.size, 0)

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

      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-6">
        {/* File drop */}
        {files.length === 0 ? (
          <Dropzone accepts={config.accepts} acceptsExt={config.acceptsExt} onAdd={handleAdd} />
        ) : (
          <div>
            <p className="text-sm text-fg-muted mb-1">
              {files.length} file{files.length !== 1 ? 's' : ''} · {formatBytes(totalBytes)}
            </p>
            <p className="text-xs text-fg-subtle truncate">{files.map((f) => f.name).join(', ')}</p>
            <Dropzone
              accepts={config.accepts}
              acceptsExt={config.acceptsExt}
              onAdd={handleAdd}
              compact
              fileCount={files.length}
              totalBytes={totalBytes}
            />
          </div>
        )}

        {phase !== 'done' && (
          <>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-fg mb-1">
                  Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showUserPw ? 'text' : 'password'}
                    value={userPw}
                    onChange={(e) => setUserPw(e.target.value)}
                    placeholder="Required to open the PDF"
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 pr-10 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPw((v) => !v)}
                    className="absolute right-2.5 top-2.5 text-fg-subtle hover:text-fg"
                    aria-label={showUserPw ? 'Hide password' : 'Show password'}
                  >
                    {showUserPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {userPw && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', strength.color)}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <span className="text-xs text-fg-subtle">{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-fg mb-1">
                  Owner password{' '}
                  <span className="text-fg-subtle text-xs font-normal">(optional — to change permissions)</span>
                </label>
                <div className="relative">
                  <input
                    type={showOwnerPw ? 'text' : 'password'}
                    value={ownerPw}
                    onChange={(e) => setOwnerPw(e.target.value)}
                    placeholder="Defaults to same as password"
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 pr-10 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOwnerPw((v) => !v)}
                    className="absolute right-2.5 top-2.5 text-fg-subtle hover:text-fg"
                    aria-label={showOwnerPw ? 'Hide owner password' : 'Show owner password'}
                  >
                    {showOwnerPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced: encryption strength + permissions */}
            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
              >
                {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Encryption &amp; permissions
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  {/* Encryption strength */}
                  <div>
                    <p className="text-sm font-medium text-fg mb-2">Encryption</p>
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-4">
                      {(['aes-256', 'aes-128'] as const).map((v) => (
                        <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="encryptStrength"
                            value={v}
                            checked={encryptStrength === v}
                            onChange={() => setEncryptStrength(v)}
                            className="accent-primary"
                          />
                          {v === 'aes-256' ? 'AES-256 (recommended)' : 'AES-128 (legacy compatibility)'}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <p className="text-sm font-medium text-fg mb-2">Permissions</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Allow printing', val: allowPrinting, set: setAllowPrinting },
                        { label: 'Allow copying text', val: allowCopying, set: setAllowCopying },
                        { label: 'Allow editing', val: allowEditing, set: setAllowEditing },
                        { label: 'Allow filling forms', val: allowForms, set: setAllowForms },
                        { label: 'Allow accessibility (screen readers)', val: allowAccessibility, set: setAllowAccessibility },
                      ].map(({ label, val, set }) => (
                        <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={val}
                            onChange={(e) => set(e.target.checked)}
                            className="accent-primary"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-fg-subtle">
                      Restrictions apply to anyone with only the open password. Owner password bypasses all.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-error">{error}</p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleProtect}
                disabled={!userPw || files.length === 0 || phase === 'processing'}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-6 py-3',
                  'bg-primary text-primary-fg text-sm font-semibold',
                  'transition-colors hover:bg-primary-hover',
                  'disabled:opacity-40 disabled:cursor-not-allowed'
                )}
              >
                <Shield className="h-4 w-4" />
                {phase === 'processing'
                  ? 'Protecting…'
                  : `Protect ${files.length} file${files.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}

        {phase === 'done' && (
          <div className="space-y-3">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-bg px-4 py-3"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                <span className="flex-1 truncate text-sm text-fg">{r.name}</span>
                <button
                  type="button"
                  onClick={() => downloadFile(r.file)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
                    'bg-primary text-primary-fg text-xs font-semibold',
                    'transition-colors hover:bg-primary-hover'
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Protect more files
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
