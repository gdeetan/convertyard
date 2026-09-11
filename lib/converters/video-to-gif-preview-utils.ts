export const MIN_WINDOW_S = 0.1

export const SHORT_FILE_WARNING =
  'This clip is shorter than the trim window. Conversion will use what this file has.'

export function resolveWindow(
  startTime: number,
  endTime: number,
  duration: number,
): { start: number; end: number } {
  if (!(duration > 0)) {
    return { start: 0, end: 0 }
  }

  const start = Math.max(0, startTime)
  const rawEnd = endTime > 0 ? endTime : duration
  let displayStart = Math.min(start, duration)
  let displayEnd = Math.min(rawEnd, duration)

  if (displayEnd - displayStart < MIN_WINDOW_S) {
    displayEnd = duration
    displayStart = Math.max(0, displayEnd - MIN_WINDOW_S)
  }

  return { start: displayStart, end: displayEnd }
}

export function wouldInvert(nextStart: number, nextEnd: number): boolean {
  return nextEnd - nextStart < MIN_WINDOW_S
}

export function clampSelectedIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return Math.max(0, Math.min(index, length - 1))
}

export function loopPlayhead(currentTime: number, start: number, end: number): number {
  if (end > start && currentTime >= end) return start
  return currentTime
}

export function shortFileWarning(startTime: number, endTime: number, duration: number): boolean {
  if (!(duration > 0)) return false
  if (startTime >= duration) return true
  if (endTime > 0 && endTime > duration) return true
  return false
}

export function endHandleWrite(end: number, duration: number): number {
  if (end >= duration) return duration
  return end
}
