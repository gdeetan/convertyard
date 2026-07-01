'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

const ROWS = [
  { name: 'libvips-wasm.js',   type: 'script', size: '187 kB', time: '312 ms' },
  { name: 'libvips.wasm',      type: 'wasm',   size: '2.4 MB', time: '1.20 s' },
  { name: 'libvips-wasm.data', type: 'fetch',  size: '8.1 MB', time: '2.84 s' },
]

type Phase = 'row0' | 'row1' | 'row2' | 'drop' | 'converting' | 'done'

const SEQUENCE: [Phase, number][] = [
  ['row0',       350],
  ['row1',       800],
  ['row2',      1600],
  ['drop',      3000],
  ['converting',3500],
  ['done',      6000],
]

// Simple fade-in via inline style — no tailwindcss-animate dependency
function FadeIn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ animation: 'devtools-fadein 0.2s ease both' }}
    >
      {children}
    </div>
  )
}

export function DevToolsMockup() {
  const [phase, setPhase] = useState<Phase | null>(null)

  useEffect(() => {
    let alive = true
    const timers: ReturnType<typeof setTimeout>[] = []

    function run() {
      setPhase(null)
      SEQUENCE.forEach(([p, delay]) => {
        timers.push(setTimeout(() => { if (alive) setPhase(p) }, delay))
      })
      timers.push(setTimeout(() => { if (alive) run() }, 8800))
    }

    run()
    return () => { alive = false; timers.forEach(clearTimeout) }
  }, [])

  const visibleRows   = phase === null ? 0 : phase === 'row0' ? 1 : phase === 'row1' ? 2 : 3
  const showDrop      = phase === 'drop' || phase === 'converting' || phase === 'done'
  const showConverting= phase === 'converting' || phase === 'done'
  const showDone      = phase === 'done'

  return (
    <>
      {/* keyframe defined inline so no global CSS file needed */}
      <style>{`
        @keyframes devtools-fadein {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="overflow-hidden rounded-xl border border-border bg-white font-mono text-[11px] shadow-sm">

        {/* DevTools tab bar */}
        <div className="flex items-center border-b border-[#dadce0] bg-[#f1f3f4] px-2">
          {['Elements', 'Console', 'Sources', 'Network', 'Performance'].map((tab) => (
            <span
              key={tab}
              className={cn(
                'px-3 py-2 font-sans text-[11px]',
                tab === 'Network'
                  ? 'border-b-2 border-[#1a73e8] text-[#1a73e8]'
                  : 'text-[#5f6368]',
              )}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Filter toolbar */}
        <div className="flex items-center gap-2 border-b border-[#dadce0] bg-[#f8f9fa] px-3 py-1.5">
          <span className="rounded border border-[#dadce0] bg-white px-1.5 py-0.5 text-[10px] text-[#5f6368]">
            🚫 Clear
          </span>
          <div className="h-4 w-px bg-[#dadce0]" />
          <div className="flex-1 rounded border border-[#dadce0] bg-white px-2 py-0.5 text-[10px] text-[#80868b]">
            Filter
          </div>
          <span className="text-[10px] text-[#5f6368]">All</span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] border-b border-[#dadce0] bg-[#f1f3f4] px-3 py-1 text-[10px] text-[#5f6368]">
          <span>Name</span>
          <span>Type</span>
          <span>Size</span>
          <span>Time</span>
        </div>

        {/* Request rows */}
        <div className="min-h-[130px] divide-y divide-[#f1f3f4] bg-white">
          {ROWS.slice(0, visibleRows).map((row) => (
            <FadeIn key={row.name} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center px-3 py-1.5">
              <span className="truncate text-[#1a73e8]">{row.name}</span>
              <span className="text-[#5f6368]">{row.type}</span>
              <span className="text-[#5f6368]">{row.size}</span>
              <span className="text-[#5f6368]">{row.time}</span>
            </FadeIn>
          ))}

          {showDrop && (
            <FadeIn className="flex items-center gap-2 bg-[#fff8e1] px-3 py-1.5">
              <span className="text-[10px] text-[#e65100]">▶ photo.jpg dropped — converting</span>
              {showConverting && !showDone && (
                <span className="ml-auto flex items-center gap-1 text-[#5f6368]">
                  <span className="inline-block h-2 w-2 animate-spin rounded-full border border-[#1a73e8] border-t-transparent" />
                  running in browser
                </span>
              )}
            </FadeIn>
          )}

          {showConverting && !showDone && (
            <FadeIn className="px-3 py-1.5 italic text-[#80868b]">
              — no new network requests —
            </FadeIn>
          )}

          {showDone && (
            <FadeIn className="flex items-center gap-2 bg-[#e8f5e9] px-3 py-1.5">
              <span className="text-[#2e7d32]">✓</span>
              <span className="text-[#2e7d32]">Done. Your file never left this tab.</span>
            </FadeIn>
          )}
        </div>

        {/* Status bar */}
        <div className="border-t border-[#dadce0] bg-[#f1f3f4] px-3 py-1 text-[10px] text-[#5f6368]">
          {visibleRows} requests · all from convertyard.com · 0 to external servers
        </div>

      </div>
    </>
  )
}
