// Best-effort mobile detection for perf tuning (worker pool size, cache caps,
// concurrency). NOT for feature gating or content differences — false positives
// on touch laptops are acceptable since the perf trade-offs still make sense.

export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  // Modern client hint (Chromium). Boolean when present.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uad = (navigator as any).userAgentData
  if (uad && typeof uad.mobile === 'boolean') return uad.mobile
  // Safari + older browsers: touch primary input + narrow viewport.
  if (typeof matchMedia !== 'undefined') {
    try {
      return matchMedia('(pointer: coarse)').matches && matchMedia('(max-width: 900px)').matches
    } catch {
      return false
    }
  }
  return false
}
