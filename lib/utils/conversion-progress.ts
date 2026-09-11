import type { FileStatus } from '@/lib/types'

/**
 * RAF-batched progress for a convert run. A finished run can still have a
 * trailing 100% tick in the queue after the user hits Convert again; without
 * a generation check that tick clamps the new run to 99% and freezes the bar.
 */
export function createConversionProgressGate() {
  let generation = 0
  const pending: Array<[number, number]> = []
  return {
    begin(): number {
      generation += 1
      pending.length = 0
      return generation
    },
    push(gen: number, fileIndex: number, pct: number): void {
      if (gen !== generation) return
      pending.push([fileIndex, pct])
    },
    drain(): Array<[number, number]> {
      const latest = new Map<number, number>()
      for (const [i, pct] of pending.splice(0)) latest.set(i, pct)
      return [...latest.entries()]
    },
    invalidate(): void {
      generation += 1
      pending.length = 0
    },
  }
}

/** Monotonic 0–99 while processing. Done/error files ignore late ticks. */
export function nextProcessingProgress(
  status: FileStatus,
  prev: number,
  pct: number,
): number | null {
  if (status !== 'processing') return null
  // A finished run queues onProgress(100). If that tick lands after
  // START_CONVERTING (progress 0), the monotonic cap would pin the new
  // bar at 99% and hide the ETA for the whole encode.
  if (prev < 1 && pct >= 99) return null
  const next = Math.min(99, Math.max(prev, pct))
  const rounded = Math.round(next * 10) / 10
  return rounded === prev ? null : rounded
}
