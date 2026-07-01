import React from 'react'
import { DevToolsMockup } from './devtools-mockup'

export function DevToolsProof() {
  return (
    <section aria-labelledby="devtools-heading" className="py-10 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">

          {/* Copy */}
          <div>
            <p className="mb-3 text-sm font-semibold tracking-wide text-primary">
              Verified — don&apos;t take our word for it
            </p>
            <h2
              id="devtools-heading"
              className="mb-4 text-2xl font-bold tracking-tight text-fg sm:text-3xl"
            >
              Check it yourself in 15 seconds
            </h2>
            <p className="text-base leading-relaxed text-fg-muted">
              Open DevTools, drop a file into any tool, and watch the Network tab.
              Zero requests to any external server during conversion — only the
              tool&apos;s code loads initially. Your files never travel anywhere.
            </p>

            <ol className="mt-6 space-y-4" role="list">
              {([
                <>Press <kbd className="rounded border border-border bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-fg">F12</kbd> or <kbd className="rounded border border-border bg-bg-muted px-1.5 py-0.5 font-mono text-xs text-fg">⌘⌥I</kbd> to open DevTools</>,
                <>Go to the <strong className="text-fg">Network</strong> tab and clear it</>,
                <>Drop a file in and convert — watch the Network tab stay empty</>,
              ] as React.ReactNode[]).map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-muted text-xs font-bold text-primary"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-fg-muted">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Animated DevTools mockup */}
          <DevToolsMockup />

        </div>
      </div>
    </section>
  )
}
