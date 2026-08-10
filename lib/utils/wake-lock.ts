export interface WakeLockHandle {
  release(): void
}

const noop: WakeLockHandle = { release: () => {} }

export async function acquireWakeLock(): Promise<WakeLockHandle> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return noop
  }

  let sentinel: WakeLockSentinel | null = null

  const acquire = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sentinel = await (navigator as any).wakeLock.request('screen')
    } catch {
      // Silently ignore — device may not support it or page is not visible
    }
  }

  await acquire()

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      acquire()
    }
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  return {
    release() {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      sentinel?.release().catch(() => {})
    },
  }
}
