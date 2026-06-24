'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Copy, Check, Lock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { RelatedArticlesStrip } from '@/components/tool-shell/related-articles-strip'
import { testRegex, QUICK_PATTERNS } from '@/lib/dev-tools/regex'

const ALL_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const
const FLAG_HINTS: Record<string, string> = {
  g: 'Global — find all matches',
  i: 'Case-insensitive',
  m: 'Multiline — ^ and $ match line boundaries',
  s: 'Dotall — . matches newlines',
  u: 'Unicode — enables \\u{...} escapes',
  y: 'Sticky — match only at lastIndex',
}

function encodeHash(parts: string[]): string {
  try { return btoa(encodeURIComponent(parts.join('\x00'))) } catch { return '' }
}
function decodeHash(s: string): string[] {
  try { return decodeURIComponent(atob(s)).split('\x00') } catch { return [] }
}

function CopyButton({ text }: { text: string }) {
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
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

const FAQ = [
  { q: 'Which regex engine does this use?', a: 'This tool uses the JavaScript regex engine (ECMAScript), not PCRE or RE2. Patterns from Python, PHP, Ruby, or Go may behave differently here — especially features like possessive quantifiers, atomic groups, or lookbehind with variable length.' },
  { q: 'What do the flags mean?', a: 'g (global) finds all matches rather than stopping at the first. i (case-insensitive) makes [a-z] match A–Z too. m (multiline) makes ^ and $ match line boundaries instead of just string boundaries. s (dotall) makes . match newlines. u enables full Unicode support. y (sticky) anchors the match to the current lastIndex position.' },
  { q: 'Why does my pattern match nothing with the g flag?', a: 'A common issue is that zero-length matches can cause an infinite loop. This tool automatically advances lastIndex past zero-length matches to prevent that.' },
  { q: 'What are named capture groups?', a: 'You can name a group with (?<name>...). For example, (?<year>\\d{4})-(?<month>\\d{2}) gives you groups named year and month, which appear in the capture groups panel below.' },
  { q: 'Can I share my regex and test string?', a: 'Yes. Your pattern, flags, and test string are encoded in the URL hash. Copy the URL from the address bar and send it — the recipient will see the same pattern and test string loaded.' },
]

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState('g')
  const [testString, setTestString] = useState('')
  const hashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const result = testRegex(pattern, flags, testString)

  // Hydrate from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const parts = decodeHash(hash)
      if (parts.length >= 3) {
        setPattern(parts[0])
        setFlags(parts[1])
        setTestString(parts[2])
      }
    }
  }, [])

  // Write to URL hash (debounced)
  useEffect(() => {
    if (hashTimer.current) clearTimeout(hashTimer.current)
    hashTimer.current = setTimeout(() => {
      if (pattern || testString) {
        const enc = encodeHash([pattern, flags, testString])
        if (enc) history.replaceState(null, '', `#${enc}`)
      } else {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }, 500)
    return () => { if (hashTimer.current) clearTimeout(hashTimer.current) }
  }, [pattern, flags, testString])

  const toggleFlag = useCallback((f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f)
  }, [])

  const applyQuickPattern = useCallback((qp: typeof QUICK_PATTERNS[number]) => {
    setPattern(qp.pattern)
    setFlags(qp.flags)
  }, [])

  const namedGroupNames = Object.keys(result.matches[0]?.groups ?? {})

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Developer Tools', href: '/developer' },
          { label: 'Regex Tester' },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">Regex Tester</h1>
        <p className="mt-2 text-base text-fg-muted">Test regular expressions with live match highlighting. JavaScript engine.</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden />
          Runs entirely in your browser.
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-5">
          {/* Pattern + flags */}
          <div className="space-y-3">
            <label htmlFor="regex-pattern" className="block text-sm font-medium text-fg">Pattern</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-fg-muted select-none">/</span>
                <input
                  id="regex-pattern"
                  type="text"
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  placeholder="[a-z]+"
                  spellCheck={false}
                  className={cn(
                    'w-full rounded-lg border bg-bg-muted pl-7 pr-3 py-2',
                    'font-mono text-sm text-fg placeholder:text-fg-subtle',
                    'focus:outline-none focus:ring-1 focus:ring-primary',
                    result.error ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : 'border-border focus:border-primary',
                  )}
                  aria-invalid={!!result.error}
                  aria-describedby={result.error ? 'pattern-error' : undefined}
                />
              </div>
              <span className="flex items-center font-mono text-fg-muted select-none">/</span>
            </div>

            {result.error && (
              <div id="pattern-error" role="alert" className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {result.error}
              </div>
            )}

            {/* Flags */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Regex flags">
              {ALL_FLAGS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFlag(f)}
                  title={FLAG_HINTS[f]}
                  aria-pressed={flags.includes(f)}
                  className={cn(
                    'rounded-md border px-2.5 py-1 font-mono text-xs transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    flags.includes(f)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Quick-insert patterns */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-fg-subtle self-center">Insert:</span>
              {QUICK_PATTERNS.map(qp => (
                <button
                  key={qp.label}
                  type="button"
                  onClick={() => applyQuickPattern(qp)}
                  className={cn(
                    'rounded-full border border-border px-2.5 py-0.5 text-xs text-fg-muted',
                    'transition-colors hover:border-border-strong hover:text-fg',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  )}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test string */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="regex-test" className="text-sm font-medium text-fg">Test string</label>
              {result.matches.length > 0 && (
                <span className="text-xs text-fg-subtle">{result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}</span>
              )}
            </div>
            <textarea
              id="regex-test"
              value={testString}
              onChange={e => setTestString(e.target.value)}
              placeholder="Paste text to test against your pattern…"
              rows={6}
              spellCheck={false}
              className={cn(
                'w-full rounded-lg border border-border bg-bg-muted px-3 py-2',
                'font-mono text-sm text-fg placeholder:text-fg-subtle resize-y',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              )}
            />
          </div>
        </div>

        {/* Match highlighting output */}
        {testString && (
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-fg">Match preview</p>
              <CopyButton text={testString} />
            </div>
            <div
              className="overflow-auto rounded-lg border border-border bg-bg-muted p-4 font-mono text-sm leading-7 text-fg whitespace-pre-wrap break-words max-h-72"
              aria-live="polite"
              aria-label="Match highlighting output"
            >
              {result.segments.map((seg, i) =>
                seg.matched ? (
                  <mark
                    key={i}
                    className="rounded bg-yellow-200 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-200"
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </div>

            {/* Named capture groups */}
            {namedGroupNames.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Named capture groups</p>
                <div className="overflow-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-bg-muted">
                      <tr>
                        <th className="border-b border-border px-3 py-2 text-left font-medium text-fg">Group</th>
                        {result.matches.map((_, i) => (
                          <th key={i} className="border-b border-border px-3 py-2 text-left font-medium text-fg">Match {i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {namedGroupNames.map(name => (
                        <tr key={name} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium text-fg">{name}</td>
                          {result.matches.map((m, i) => (
                            <td key={i} className="px-3 py-2 font-mono text-fg-muted">{m.groups[name] ?? '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Match list */}
            {result.matches.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Matches</p>
                <ol className="space-y-1">
                  {result.matches.map((m, i) => (
                    <li key={i} className="flex items-baseline gap-2 text-xs">
                      <span className="w-6 shrink-0 text-right font-medium text-fg-subtle">{i + 1}.</span>
                      <span className="font-mono text-fg break-all">{m.value || <em className="text-fg-subtle">empty string</em>}</span>
                      <span className="shrink-0 text-fg-subtle">at {m.index}–{m.end}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        <FAQAccordion items={FAQ} />
        <RelatedToolsStrip slugs={['json-formatter', 'diff-checker', 'base64']} />
        <RelatedArticlesStrip slugs={[]} />
      </div>
    </div>
  )
}
