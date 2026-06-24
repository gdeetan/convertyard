'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Copy, Check, Lock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { RelatedArticlesStrip } from '@/components/tool-shell/related-articles-strip'
import { computeDiff, toUnifiedDiff } from '@/lib/dev-tools/diff'
import type { DiffLine } from '@/lib/dev-tools/diff'

const SHARE_LIMIT = 5000

function encodeHash(a: string, b: string): string {
  try { return btoa(encodeURIComponent(a + '\x00' + b)) } catch { return '' }
}
function decodeHash(s: string): [string, string] {
  try {
    const parts = decodeURIComponent(atob(s)).split('\x00')
    return [parts[0] ?? '', parts[1] ?? '']
  } catch { return ['', ''] }
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5',
        'text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

function WordDiffSpan({ parts }: { parts: DiffLine['wordDiff'] }) {
  if (!parts) return null
  return (
    <>
      {parts.map((p, i) => (
        <span
          key={i}
          className={cn(
            p.type === 'added' && 'bg-green-300/60 dark:bg-green-500/30',
            p.type === 'removed' && 'bg-red-300/60 dark:bg-red-500/30',
          )}
        >
          {p.text}
        </span>
      ))}
    </>
  )
}

function LineNum({ n }: { n: number | undefined }) {
  return (
    <span className="select-none w-10 shrink-0 text-right text-fg-subtle pr-3 border-r border-border mr-3">
      {n ?? ''}
    </span>
  )
}

function SideBySideView({ lines }: { lines: DiffLine[] }) {
  const oldLines = lines.filter(l => l.type !== 'added')
  const newLines = lines.filter(l => l.type !== 'removed')

  return (
    <div className="grid grid-cols-2 gap-0 overflow-auto rounded-lg border border-border text-xs font-mono leading-6">
      {/* Old */}
      <div className="border-r border-border">
        <div className="border-b border-border bg-bg-muted px-3 py-1 text-xs font-medium text-fg-muted">Original</div>
        {oldLines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start px-3 py-0.5',
              line.type === 'removed' && 'bg-red-50 dark:bg-red-900/20',
            )}
          >
            <LineNum n={line.oldNum} />
            <span className={line.type === 'removed' ? 'text-red-700 dark:text-red-400' : 'text-fg'}>
              {line.wordDiff ? <WordDiffSpan parts={line.wordDiff} /> : line.text}
            </span>
          </div>
        ))}
      </div>
      {/* New */}
      <div>
        <div className="border-b border-border bg-bg-muted px-3 py-1 text-xs font-medium text-fg-muted">Changed</div>
        {newLines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start px-3 py-0.5',
              line.type === 'added' && 'bg-green-50 dark:bg-green-900/20',
            )}
          >
            <LineNum n={line.newNum} />
            <span className={line.type === 'added' ? 'text-green-700 dark:text-green-400' : 'text-fg'}>
              {line.wordDiff ? <WordDiffSpan parts={line.wordDiff} /> : line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function UnifiedView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="overflow-auto rounded-lg border border-border text-xs font-mono leading-6">
      {lines.map((line, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start px-3 py-0.5',
            line.type === 'added' && 'bg-green-50 dark:bg-green-900/20',
            line.type === 'removed' && 'bg-red-50 dark:bg-red-900/20',
          )}
        >
          <span className={cn(
            'w-4 shrink-0 select-none mr-3',
            line.type === 'added' ? 'text-green-600 dark:text-green-400' : line.type === 'removed' ? 'text-red-600 dark:text-red-400' : 'text-fg-subtle',
          )}>
            {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
          </span>
          <LineNum n={line.type !== 'added' ? line.oldNum : undefined} />
          <LineNum n={line.type !== 'removed' ? line.newNum : undefined} />
          <span className={cn(
            line.type === 'added' && 'text-green-700 dark:text-green-400',
            line.type === 'removed' && 'text-red-700 dark:text-red-400',
          )}>
            {line.wordDiff ? <WordDiffSpan parts={line.wordDiff} /> : line.text}
          </span>
        </div>
      ))}
    </div>
  )
}

const FAQ = [
  { q: 'What kind of diff does this produce?', a: 'This tool performs a line-level diff using the Myers diff algorithm, then a word-level diff within changed lines. This is the same approach used by git diff.' },
  { q: 'What is the difference between side-by-side and unified view?', a: 'Side-by-side shows the original and changed text in two columns, making it easy to compare corresponding lines. Unified view shows all changes in a single column, prefixed with + (added) or − (removed), which is more compact for large files.' },
  { q: 'What does "Copy as unified diff" output?', a: 'It produces a standard unified diff format (--- original, +++ changed, then lines prefixed with +, −, or space). This format is understood by patch, git apply, and most code review tools.' },
  { q: 'Why can\'t I share a link for large inputs?', a: 'URLs have browser limits (typically 2,000–64,000 characters depending on browser). To keep links reliable, sharing is capped at 5,000 combined characters. For larger texts, copy and share the raw content instead.' },
  { q: 'Does this work for code?', a: 'Yes, and it preserves whitespace exactly, which matters for languages where indentation is significant (Python, YAML). The diff is purely character-based — it does not understand language syntax.' },
]

export default function DiffCheckerPage() {
  const [original, setOriginal] = useState('')
  const [changed, setChanged] = useState('')
  const [view, setView] = useState<'side-by-side' | 'unified'>('side-by-side')
  const [lines, setLines] = useState<DiffLine[]>([])
  const hashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const diffTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tooLargeToShare = original.length + changed.length > SHARE_LIMIT

  // Hydrate from hash
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const [a, b] = decodeHash(hash)
      if (a || b) { setOriginal(a); setChanged(b) }
    }
  }, [])

  // Write hash (debounced)
  useEffect(() => {
    if (hashTimer.current) clearTimeout(hashTimer.current)
    hashTimer.current = setTimeout(() => {
      if (!tooLargeToShare && (original || changed)) {
        const enc = encodeHash(original, changed)
        if (enc) history.replaceState(null, '', `#${enc}`)
      } else {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }, 500)
    return () => { if (hashTimer.current) clearTimeout(hashTimer.current) }
  }, [original, changed, tooLargeToShare])

  // Compute diff (debounced)
  useEffect(() => {
    if (diffTimer.current) clearTimeout(diffTimer.current)
    if (!original && !changed) { setLines([]); return }
    diffTimer.current = setTimeout(async () => {
      const result = await computeDiff(original, changed)
      setLines(result)
    }, 200)
    return () => { if (diffTimer.current) clearTimeout(diffTimer.current) }
  }, [original, changed])

  const addedCount = lines.filter(l => l.type === 'added').length
  const removedCount = lines.filter(l => l.type === 'removed').length

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Developer Tools', href: '/developer' },
          { label: 'Diff Checker' },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">Diff Checker</h1>
        <p className="mt-2 text-base text-fg-muted">Visually compare two texts. Line and word-level highlighting.</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden />
          Runs entirely in your browser.
        </div>
      </div>

      <div className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: 'Original', value: original, set: setOriginal, id: 'diff-original' },
            { label: 'Changed', value: changed, set: setChanged, id: 'diff-changed' },
          ].map(({ label, value, set, id }) => (
            <div key={id} className="space-y-2">
              <label htmlFor={id} className="block text-sm font-medium text-fg">{label}</label>
              <textarea
                id={id}
                value={value}
                onChange={e => set(e.target.value)}
                placeholder={`Paste ${label.toLowerCase()} text…`}
                rows={12}
                spellCheck={false}
                className={cn(
                  'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2',
                  'font-mono text-xs text-fg placeholder:text-fg-subtle resize-y',
                  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                )}
              />
            </div>
          ))}
        </div>

        {tooLargeToShare && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Too large to share via link — copy the text instead.
          </div>
        )}

        {/* Diff output */}
        {lines.length > 0 && (
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-green-600 dark:text-green-400">+{addedCount} added</span>
                <span className="text-xs font-medium text-red-600 dark:text-red-400">−{removedCount} removed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border overflow-hidden" role="group" aria-label="View mode">
                  {(['side-by-side', 'unified'] as const).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                        view === v
                          ? 'bg-primary text-white'
                          : 'text-fg-muted hover:text-fg',
                      )}
                    >
                      {v.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                <CopyButton text={toUnifiedDiff(lines)} label="Copy unified diff" />
              </div>
            </div>

            {view === 'side-by-side'
              ? <SideBySideView lines={lines} />
              : <UnifiedView lines={lines} />
            }
          </div>
        )}

        <FAQAccordion items={FAQ} />
        <RelatedToolsStrip slugs={['json-formatter', 'regex-tester', 'base64']} />
        <RelatedArticlesStrip slugs={[]} />
      </div>
    </div>
  )
}
