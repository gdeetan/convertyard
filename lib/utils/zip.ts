import { zip } from 'fflate'

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
      const a = document.createElement('a')
      a.href = url
      a.download = zipName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      resolve()
    })
  })
}
