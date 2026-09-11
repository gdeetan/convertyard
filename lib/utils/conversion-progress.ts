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
      return pending.splice(0)
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
  const next = Math.min(99, Math.max(prev, pct))
  return next === prev ? null : next
}
