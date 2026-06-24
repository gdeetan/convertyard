'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Copy, Check, Lock, ChevronDown, ShieldCheck, ShieldX, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { FAQAccordion } from '@/components/tool-shell/faq-accordion'
import { RelatedToolsStrip } from '@/components/tool-shell/related-tools-strip'
import { RelatedArticlesStrip } from '@/components/tool-shell/related-articles-strip'
import { decodeJwt, verifyJwt, formatRelativeTime } from '@/lib/dev-tools/jwt'
import type { JwtParts, JwtVerifyResult } from '@/lib/dev-tools/jwt'

function encodeHash(s: string): string {
  try { return btoa(encodeURIComponent(s)) } catch { return '' }
}
function decodeHash(s: string): string {
  try { return decodeURIComponent(atob(s)) } catch { return '' }
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text) } catch { /* fallback not needed */ }
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

function JsonBlock({ title, data }: { title: string; data: object }) {
  const json = JSON.stringify(data, null, 2)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</p>
        <CopyButton text={json} />
      </div>
      <pre className="overflow-auto rounded-lg border border-border bg-bg-muted p-4 font-mono text-xs leading-6 text-fg max-h-64">
        <code>{json}</code>
      </pre>
    </div>
  )
}

function ExpiryBadge({ exp }: { exp: number }) {
  const { text, expired } = formatRelativeTime(exp)
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
      expired
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    )}>
      {expired ? 'Expired' : 'Valid'} — {text}
    </span>
  )
}

function TimingInfo({ payload }: { payload: { exp?: number; iat?: number; nbf?: number } }) {
  if (!payload.exp && !payload.iat && !payload.nbf) return null
  return (
    <div className="flex flex-wrap gap-3 text-xs text-fg-muted">
      {payload.exp && (
        <span>
          <span className="font-medium text-fg">exp:</span>{' '}
          <ExpiryBadge exp={payload.exp} />
        </span>
      )}
      {payload.iat && (
        <span>
          <span className="font-medium text-fg">iat:</span>{' '}
          {new Date(payload.iat * 1000).toLocaleString()}
        </span>
      )}
      {payload.nbf && (
        <span>
          <span className="font-medium text-fg">nbf:</span>{' '}
          {new Date(payload.nbf * 1000).toLocaleString()}
        </span>
      )}
    </div>
  )
}

function VerifyPanel({ token, alg }: { token: string; alg: string }) {
  const [open, setOpen] = useState(false)
  const [secret, setSecret] = useState('')
  const [result, setResult] = useState<JwtVerifyResult | null>(null)
  const [verifying, setVerifying] = useState(false)

  const isSymmetric = alg.startsWith('HS')
  const label = isSymmetric ? 'Secret (HMAC key)' : 'Public key (PEM)'

  const verify = useCallback(async () => {
    setVerifying(true)
    setResult(null)
    const res = await verifyJwt(token, secret, alg)
    setResult(res)
    setVerifying(false)
  }, [token, secret, alg])

  return (
    <div className="border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between text-sm font-medium text-fg hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-expanded={open}
      >
        <span>Verify signature</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-fg-muted">{label}</label>
          <textarea
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder={isSymmetric ? 'your-secret-key' : '-----BEGIN PUBLIC KEY-----\n...'}
            rows={isSymmetric ? 2 : 5}
            className={cn(
              'w-full rounded-lg border border-border bg-bg-muted px-3 py-2',
              'font-mono text-xs text-fg placeholder:text-fg-subtle resize-y',
              'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            )}
          />
          <button
            type="button"
            onClick={verify}
            disabled={!secret.trim() || verifying}
            className={cn(
              'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white',
              'transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            )}
          >
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
          {result && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
              result.valid
                ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
            )}>
              {result.valid
                ? <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                : <ShieldX className="h-4 w-4 shrink-0" aria-hidden />}
              {result.valid ? 'Signature valid' : (result.error ?? 'Signature invalid')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FAQ = [
  { q: 'What is a JWT?', a: 'A JSON Web Token (JWT) is a compact, URL-safe way to represent claims between two parties. It has three Base64url-encoded parts separated by dots: a header (algorithm and type), a payload (the claims), and a signature.' },
  { q: 'Is my token sent to a server?', a: 'No. Everything happens in your browser using JavaScript. The token never leaves your device. That said, treat a real, live JWT like a password — anyone who can read it can impersonate the token holder until it expires.' },
  { q: 'Can this tool verify the signature?', a: 'Yes, for HS256/HS384/HS512 (with the HMAC secret) and RS256/RS384/RS512 and ES256/ES384/ES512 (with the public key in PEM format). All verification uses the browser\'s built-in Web Crypto API.' },
  { q: 'What does the exp field mean?', a: 'exp is the expiration time, as a Unix timestamp (seconds since January 1, 1970 UTC). The decoder shows how long until expiry, or how long ago it expired, in plain language.' },
  { q: 'Why can\'t I verify an RS256 token with just the token?', a: 'RS256 uses asymmetric cryptography. The token is signed with a private key. You can only verify it with the corresponding public key — which you must obtain separately (e.g., from the issuer\'s JWKS endpoint).' },
  { q: 'What does alg: none mean?', a: 'A JWT with alg: none has no signature. Any payload can be placed in it. Never accept a none-algorithm JWT in production — it is a well-known security vulnerability.' },
]

export default function JwtDecoderPage() {
  const [token, setToken] = useState('')
  const hashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const decoded = token.trim() ? decodeJwt(token.trim()) : null

  // Hydrate from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const t = decodeHash(hash)
      if (t) setToken(t)
    }
  }, [])

  // Write to URL hash (debounced, replaceState)
  useEffect(() => {
    if (hashTimer.current) clearTimeout(hashTimer.current)
    hashTimer.current = setTimeout(() => {
      if (token) {
        const enc = encodeHash(token)
        if (enc) history.replaceState(null, '', `#${enc}`)
      } else {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }, 500)
    return () => { if (hashTimer.current) clearTimeout(hashTimer.current) }
  }, [token])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Tools', href: '/tools' },
          { label: 'Developer Tools', href: '/developer' },
          { label: 'JWT Decoder' },
        ]} />
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">JWT Decoder</h1>
        <p className="mt-2 text-base text-fg-muted">Decode and inspect JSON Web Tokens. Verify signatures with HS256, RS256, or ES256.</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
          <Lock className="h-3 w-3 text-primary" aria-hidden />
          Decoded entirely in your browser — nothing is sent anywhere. Treat a live JWT like a password.
        </div>
      </div>

      <div className="space-y-6">
        {/* Input */}
        <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="jwt-input" className="text-sm font-medium text-fg">Paste a JWT</label>
              {token && (
                <button
                  type="button"
                  onClick={() => setToken('')}
                  className="text-xs text-fg-subtle hover:text-fg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              id="jwt-input"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0..."
              rows={4}
              spellCheck={false}
              className={cn(
                'w-full rounded-lg border border-border bg-bg-muted px-3 py-2',
                'font-mono text-xs text-fg placeholder:text-fg-subtle resize-y',
                'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
              )}
              aria-label="JWT token input"
            />
            <p className="text-xs text-fg-subtle">
              Shareable URL: your token is encoded in the page URL. Anyone with the link can read the token.
            </p>
          </div>

          {/* Error */}
          {decoded?.error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{decoded.error}</span>
            </div>
          )}
        </div>

        {/* Decoded output */}
        {decoded?.parts && (
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-sm space-y-6">
            <JsonBlock title="Header" data={decoded.parts.header} />
            <div className="space-y-3">
              <JsonBlock title="Payload" data={decoded.parts.payload} />
              <TimingInfo payload={decoded.parts.payload} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Signature</p>
              <p className="break-all font-mono text-xs text-fg-muted">{decoded.parts.signature}</p>
            </div>
            <VerifyPanel token={token.trim()} alg={decoded.parts.header.alg ?? ''} />
          </div>
        )}

        {/* FAQ */}
        <FAQAccordion items={FAQ} />

        {/* Related */}
        <RelatedToolsStrip slugs={['base64', 'json-formatter', 'regex-tester']} />
        <RelatedArticlesStrip slugs={[]} />
      </div>
    </div>
  )
}
