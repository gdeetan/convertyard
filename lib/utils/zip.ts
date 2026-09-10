import { zip } from 'fflate'
import { isIosInAppBrowser } from './platform'

export async function downloadAsZip(files: File[], zipName = 'convertyard.zip'): Promise<void> {
  const entries: Record<string, Uint8Array> = {}

  await Promise.all(
    files.map(async (file) => {
      const buf = await file.arrayBuffer()
      // Deduplicate filenames
      let name = file.name
      let i = 2
      while (name in entries) {
        const dot = file.name.lastIndexOf('.')
        name =
          dot >= 0
            ? `${file.name.slice(0, dot)}_${i}${file.name.slice(dot)}`
            : `${file.name}_${i}`
        i++
      }
      entries[name] = new Uint8Array(buf)
    })
  )

  return new Promise((resolve, reject) => {
    zip(entries, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      const blob = new Blob([data], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const cleanup = () => setTimeout(() => URL.revokeObjectURL(url), 60_000)

      if (isIosInAppBrowser()) {
        // WKWebView hosts (Google app, FB, IG, etc.) ignore the `download`
        // attribute and drop anchor-triggered blob downloads. Open in a new
        // tab so the user can save from the viewer.
        window.open(url, '_blank')
        cleanup()
        resolve()
        return
      }

      const a = document.createElement('a')
      a.href = url
      a.download = zipName
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      cleanup()
      resolve()
    })
  })
}
