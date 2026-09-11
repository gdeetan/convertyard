/** Remaining time from elapsed / percent done. Null until the encode is past warmup. */
export function estimateRemainingMs(elapsedMs: number, pct: number): number | null {
  if (!(elapsedMs >= 2000) || !(pct >= 3) || pct >= 99.5) return null
  return elapsedMs * (100 - pct) / pct
}

export function formatRemaining(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  if (s < 60) return `about ${s}s remaining`
  const m = Math.round(s / 60)
  if (m < 60) return `about ${m} min remaining`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `about ${h}h ${mm}m remaining`
}

/** One decimal below 20% so a multi-GB 360p encode can move the bar. */
export function formatPct(n: number): string {
  if (n >= 99.5) return String(Math.round(Math.min(100, n)))
  const clamped = Math.max(0, n)
  if (clamped < 0.05) return '0'
  if (clamped < 20) return (Math.round(clamped * 10) / 10).toFixed(1)
  return String(Math.round(clamped))
}
