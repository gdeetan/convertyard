import { isIosInAppBrowser } from './platform'

async function tryShareFile(file: File): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean
    share?: (data: { files?: File[]; title?: string }) => Promise<void>
  }
  if (!nav.share || !nav.canShare) return false
  try {
    if (!nav.canShare({ files: [file] })) return false
    await nav.share({ files: [file], title: file.name })
    return true
  } catch {
    return false
  }
}

export async function downloadFile(file: File): Promise<void> {
  const url = URL.createObjectURL(file)
  const cleanup = () => setTimeout(() => URL.revokeObjectURL(url), 60_000)

  if (isIosInAppBrowser()) {
    if (await tryShareFile(file)) {
      cleanup()
      return
    }
    // Fallback: open the blob in a new tab so the user can long-press → Save.
    window.open(url, '_blank')
    cleanup()
    return
  }

  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  cleanup()
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1_048_576).toFixed(1)} MB`
}
